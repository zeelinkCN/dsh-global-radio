/**
 * 全球电台 · DeepSeek Harness 插件（Host 侧）
 *
 * 职责：
 *  1. 代理 Radio Browser（社区全球电台目录），归一化台站数据并缓存
 *  2. 音频流代理 /stream：让 <audio> 同源播放（Web Audio 频谱分析因此可用）
 *  3. HLS 播放列表/分片代理 /hls：重写 m3u8 内的相对 URI，解决 CORS 与相对路径问题
 *  4. 台标图片代理 /img：内存 LRU 缓存，规避热链/混合内容/失效域名
 *  5. 兜底精选台单 data/seed-stations.json：上游不可用时仍可听
 *
 * 设计要点：
 *  - 上游失败一律降级，绝不阻塞插件激活；所有错误走统一信封 {ok:false,error,code}
 *  - 流式转发，不整段 buffer；客户端断开即中止上游
 *  - 不依赖任何第三方 npm 包
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

export const name = 'global-radio'
export const inject = ['webServer']

const ROOT = dirname(fileURLToPath(import.meta.url))
const ROUTE = '/global-radio/api'
const VERSION = '1.0.0'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 DSH-GlobalRadio/1.0'
const API_UA = 'DSH-GlobalRadio/1.0 (DeepSeek Harness plugin)'
const MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://de2.api.radio-browser.info',
  'https://all.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
]
const UPSTREAM_TIMEOUT = 13_000
/** 已实测无法在浏览器解码的源（青听系加密地址），列表层直接过滤，避免用户点开没声音 */
const BAD_STREAM_HOSTS = []
const isBadStreamHost = (value) => {
  if (typeof value !== 'string' || !value) return true
  try {
    if (!BAD_STREAM_HOSTS.length) return false
    const host = new URL(value).hostname
    return BAD_STREAM_HOSTS.some((pattern) => pattern.test(host))
  } catch {
    return true
  }
}

/** 检查一段字节是否像可解码音频（MP3/AAC/ADTS/OGG/FLAC/WAV/ID3） */
function looksLikeAudio(buffer) {
  if (!buffer || buffer.length < 16) return false
  const head = buffer.subarray(0, 4).toString('latin1')
  if (head === 'ID3' || head === 'OggS' || head === 'fLaC' || head === 'RIFF') return true
  if (buffer[0] === 0xff && (buffer[1] & 0xf6) === 0xf0) return true // ADTS
  // MP3：在 4KB 内找 2 个间隔合理的帧同步（避免随机密文的假同步）
  const limit = Math.min(buffer.length, 4096)
  const syncs = []
  for (let i = 0; i < limit - 1; i += 1) {
    if (buffer[i] === 0xff && (buffer[i + 1] & 0xe0) === 0xe0) {
      syncs.push(i)
      if (syncs.length >= 8) break
    }
  }
  for (let i = 0; i < syncs.length - 1; i += 1) {
    const gap = syncs[i + 1] - syncs[i]
    if (gap >= 100 && gap <= 1200) return true
  }
  return false
}

/** 快速校验一个流地址：跟随重定向，判断 HLS / 可解码音频 */
async function checkStream(target, timeoutMs = 8000) {
  if (!isHttpUrl(target)) return { ok: false, reason: 'invalid-url' }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const upstream = await fetch(target, {
      headers: { 'User-Agent': UA, Accept: '*/*', 'Accept-Encoding': 'identity' },
      redirect: 'follow',
      signal: controller.signal,
    })
    if (!upstream.ok) return { ok: false, reason: `http-${upstream.status}`, status: upstream.status }
    const contentType = str(upstream.headers.get('content-type')).toLowerCase()
    const finalUrl = upstream.url || target
    const hls = contentType.includes('mpegurl') || isHlsUrl(finalUrl)
    let reader = null
    let sample = Buffer.alloc(0)
    if (!hls && upstream.body) {
      reader = upstream.body.getReader()
      const chunk = await reader.read()
      sample = Buffer.from(chunk.value || [])
    }
    if (reader) {
      try {
        await reader.cancel()
      } catch {
        /* ignore */
      }
    }
    if (hls) return { ok: true, hls: true, contentType, finalUrl }
    const audioLike = /^audio\//.test(contentType) || looksLikeAudio(sample)
    return {
      ok: audioLike,
      hls: false,
      contentType,
      finalUrl,
      audioLike,
      reason: audioLike ? undefined : 'not-audio',
    }
  } catch (err) {
    return { ok: false, reason: String(err?.message ?? err) }
  } finally {
    clearTimeout(timer)
  }
}
const STREAM_TIMEOUT = 20_000
const HOME_TTL = 10 * 60 * 1000
const COUNTRIES_TTL = 60 * 60 * 1000
const LOG_TAG = '[global-radio]'
const CORS = { 'Access-Control-Allow-Origin': '*' }

/** 首页国家筛选常用项；name 为英文兜底，客户端按 code 本地化 */
const PREFERRED_COUNTRIES = [
  ['CN', 'China'],
  ['HK', 'Hong Kong'],
  ['TW', 'Taiwan'],
  ['US', 'United States'],
  ['GB', 'United Kingdom'],
  ['FR', 'France'],
  ['DE', 'Germany'],
  ['JP', 'Japan'],
  ['KR', 'South Korea'],
  ['RU', 'Russia'],
  ['IT', 'Italy'],
  ['ES', 'Spain'],
  ['CA', 'Canada'],
  ['AU', 'Australia'],
  ['BR', 'Brazil'],
  ['IN', 'India'],
]

/** 常用分类（Radio Browser tag） */
const PREFERRED_TAGS = ['news', 'music', 'talk', 'jazz', 'classical', 'electronic', 'rock', 'pop', 'sports', 'culture']

/** seed 文件缺失时的最后兜底（尽量少，能证明链路可用） */
const EMBEDDED_SEED = [
  {
    id: 'seed:bbc-world-service',
    name: 'BBC World Service',
    url: 'http://stream.live.vc.bbcmedia.co.uk/bbc_world_service',
    logo: '',
    country: 'United Kingdom',
    countryCode: 'GB',
    city: 'London',
    tags: ['news', 'talk'],
    codec: 'MP3',
    bitrate: 56,
    frequency: null,
    homepage: 'https://www.bbc.co.uk/worldserviceradio',
    hls: false,
    votes: 0,
    clicks: 0,
  },
  {
    id: 'seed:france-info',
    name: 'France Info',
    url: 'http://direct.franceinfo.fr/live/franceinfo-midfi.mp3',
    logo: '',
    country: 'France',
    countryCode: 'FR',
    city: 'Paris',
    tags: ['news'],
    codec: 'MP3',
    bitrate: 128,
    frequency: null,
    homepage: 'https://www.francetvinfo.fr',
    hls: false,
    votes: 0,
    clicks: 0,
  },
  {
    id: 'seed:deutschlandfunk',
    name: 'Deutschlandfunk',
    url: 'https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3',
    logo: '',
    country: 'Germany',
    countryCode: 'DE',
    city: 'Cologne',
    tags: ['news', 'talk', 'culture'],
    codec: 'MP3',
    bitrate: 128,
    frequency: null,
    homepage: 'https://www.deutschlandfunk.de',
    hls: false,
    votes: 0,
    clicks: 0,
  },
  {
    id: 'seed:cnr-1',
    name: 'CNR-1 中国之声',
    url: 'https://lhttp.qtfm.cn/live/15318317/64k.mp3',
    logo: '',
    country: 'China',
    countryCode: 'CN',
    city: '北京',
    tags: ['news', 'talk'],
    codec: 'MP3',
    bitrate: 64,
    frequency: null,
    homepage: '',
    hls: false,
    votes: 0,
    clicks: 0,
  },
  {
    id: 'seed:asiafm-hd',
    name: 'AsiaFM 高清音乐台',
    url: 'http://asiafm.hk:8000/asiahd',
    logo: '',
    country: 'Hong Kong',
    countryCode: 'HK',
    city: 'Hong Kong',
    tags: ['music', 'pop'],
    codec: 'AAC+',
    bitrate: 96,
    frequency: null,
    homepage: '',
    hls: false,
    votes: 0,
    clicks: 0,
  },
]

class PluginError extends Error {
  constructor(message, code = 'INTERNAL') {
    super(message)
    this.name = 'PluginError'
    this.code = code
  }
}

function log(...args) {
  console.error(LOG_TAG, ...args)
}

/* ------------------------------------------------------------------ *
 * 通用工具
 * ------------------------------------------------------------------ */
const num = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const str = (value, fallback = '') => (typeof value === 'string' ? value : fallback)

const isHttpUrl = (value) => {
  if (typeof value !== 'string' || !value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const isHlsUrl = (value) => typeof value === 'string' && /\.m3u8(?:[?#]|$)/i.test(value)
const isPlaylistFileUrl = (value) => typeof value === 'string' && /\.(?:pls|m3u)(?:[?#]|$)/i.test(value)

/** 台名里解析频率：FM 97.4 / FM97.4 / 调频 97.4 / AM 720 … */
const FREQ_PATTERNS = [
  /\b(?:FM|AM|MW|LW|SW)\s*[:：\-]?\s*(\d{2,4}(?:\.\d{1,2})?)\s*(?:MHz|kHz)?/i,
  /(?:调频|中波|短波)\s*[:：\-]?\s*(\d{2,4}(?:\.\d{1,2})?)/,
]
function parseFrequency(name) {
  const text = str(name)
  if (!text) return null
  for (const re of FREQ_PATTERNS) {
    const match = text.match(re)
    if (!match) continue
    const value = match[1]
    const n = Number(value)
    if (!Number.isFinite(n) || n < 40 || n > 2200) continue
    const kind = /AM|MW|LW|SW|中波|短波/i.test(match[0]) ? 'AM' : 'FM'
    return `${kind} ${value}`
  }
  return null
}

const CODE_TO_NAME = new Map(PREFERRED_COUNTRIES.map(([code, label]) => [code, label]))

/** Radio Browser station → 归一化 Station（契约 2.1） */
function normalizeStation(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = str(raw.stationuuid || raw.id)
  const url = str(raw.url_resolved || raw.url)
  const stationName = str(raw.name).trim()
  if (!id || !stationName || !isHttpUrl(url) || isPlaylistFileUrl(url) || isBadStreamHost(url)) return null
  const tags = str(raw.tags)
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 6)
  const codec = str(raw.codec, 'UNKNOWN').toUpperCase()
  const country = str(raw.country).trim()
  const countryCode = str(raw.countrycode).trim().toUpperCase()
  const hls = isHlsUrl(url) || codec.includes('HLS')
  return {
    id,
    name: stationName,
    url,
    logo: isHttpUrl(str(raw.favicon)) ? str(raw.favicon) : '',
    country: country || CODE_TO_NAME.get(countryCode) || '',
    countryCode,
    city: str(raw.state || raw.city).trim(),
    tags,
    codec,
    bitrate: Math.max(0, Math.round(num(raw.bitrate))),
    frequency: parseFrequency(stationName),
    homepage: isHttpUrl(str(raw.homepage)) ? str(raw.homepage) : '',
    hls,
    votes: Math.max(0, Math.round(num(raw.votes))),
    clicks: Math.max(0, Math.round(num(raw.clickcount))),
  }
}

function normalizeSeedStation(raw) {
  const station = normalizeStation({
    ...raw,
    stationuuid: raw.id || raw.stationuuid || `seed:${str(raw.name).toLowerCase().replace(/\s+/g, '-')}`,
    url_resolved: raw.url,
    favicon: raw.logo,
    countrycode: raw.countryCode,
    clickcount: raw.clicks,
  })
  if (!station) return null
  if (typeof raw.frequency === 'string' && raw.frequency) station.frequency = raw.frequency
  if (!station.id.startsWith('seed:')) station.id = `seed:${station.id}`
  return station
}

function dedupeStations(list) {
  const seen = new Set()
  const out = []
  for (const item of list) {
    if (!item) continue
    const key = item.id || `${item.name}|${item.url}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

function createCache() {
  const store = new Map()
  const inflight = new Map()
  return {
    async wrap(key, ttlMs, factory) {
      const hit = store.get(key)
      if (hit && Date.now() - hit.at < ttlMs) return hit.value
      if (inflight.has(key)) return inflight.get(key)
      const task = Promise.resolve()
        .then(factory)
        .then((value) => {
          store.set(key, { at: Date.now(), value })
          return value
        })
        .finally(() => inflight.delete(key))
      inflight.set(key, task)
      return task
    },
    get(key) {
      return store.get(key)
    },
    clear() {
      store.clear()
    },
    get size() {
      return store.size
    },
  }
}

/* ------------------------------------------------------------------ *
 * Radio Browser 客户端（镜像探测 + 失败降级）
 * ------------------------------------------------------------------ */
function createRadioBrowser() {
  let activeMirror = null
  let upstreamOk = false
  let lastError = ''
  const clickMarks = new Map()

  async function fetchJson(url, timeoutMs) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs || UPSTREAM_TIMEOUT)
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': API_UA, Accept: 'application/json' },
        redirect: 'follow',
        signal: controller.signal,
      })
      if (!response.ok) throw new PluginError(`上游返回 HTTP ${response.status}`, 'NETWORK')
      return await response.json()
    } finally {
      clearTimeout(timer)
    }
  }

  async function probeMirror() {
    const results = await Promise.all(
      MIRRORS.map(async (base) => {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 8000)
        try {
          const response = await fetch(base + '/json/stats', {
            headers: { 'User-Agent': API_UA, Accept: 'application/json' },
            signal: controller.signal,
          })
          if (!response.ok) return null
          await response.json()
          return base
        } catch {
          return null
        } finally {
          clearTimeout(timer)
        }
      }),
    )
    activeMirror = results.find(Boolean) || null
    if (activeMirror) log('Radio Browser 镜像就绪', activeMirror)
    else log('Radio Browser 所有镜像暂不可用，将使用精选兜底')
    return activeMirror
  }

  async function mirrorFetch(pathAndQuery) {
    if (!activeMirror) await probeMirror()
    const order = activeMirror ? [activeMirror, ...MIRRORS.filter((m) => m !== activeMirror)] : [...MIRRORS]
    let lastErr = null
    for (let index = 0; index < order.length; index += 1) {
      const base = order[index]
      try {
        const data = await fetchJson(base + pathAndQuery, index === 0 ? UPSTREAM_TIMEOUT : 6000)
        if (activeMirror !== base) {
          activeMirror = base
          log('Radio Browser 镜像切换为', base)
        }
        upstreamOk = true
        lastError = ''
        return data
      } catch (err) {
        lastErr = err
        if (activeMirror === base) activeMirror = null
      }
    }
    upstreamOk = false
    lastError = String(lastErr?.message ?? lastErr)
    throw new PluginError(`全球电台目录暂不可用：${lastError}`, 'NETWORK')
  }

  async function stations(pathAndQuery) {
    const data = await mirrorFetch(pathAndQuery)
    return Array.isArray(data) ? data : []
  }

  return {
    search: (query) => stations(`/json/stations/search?${query}`),
    topClick: (limit) => stations(`/json/stations/topclick/${limit}?hidebroken=true`),
    countries: () => mirrorFetch('/json/countries'),
    tags: () => mirrorFetch('/json/tags?order=stationcount&reverse=true&limit=80'),
    countPlay: (id) => {
      if (!id || typeof id !== 'string' || !/^[0-9a-f-]{16,}$/i.test(id)) return
      const now = Date.now()
      const marked = clickMarks.get(id) || 0
      if (now - marked < 60 * 60 * 1000) return
      clickMarks.set(id, now)
      if (clickMarks.size > 500) clickMarks.clear()
      mirrorFetch(`/json/url/${encodeURIComponent(id)}`).catch(() => {})
    },
    status: () => (upstreamOk ? 'ok' : 'degraded'),
    lastError: () => lastError,
  }
}

/* ------------------------------------------------------------------ *
 * 静态资源
 * ------------------------------------------------------------------ */
function readIcon(size) {
  const wanted = Number(size) || 256
  const files = { 64: 'icon-64.png', 128: 'icon-128.png', 256: 'icon-256.png' }
  const file = join(ROOT, 'assets', files[wanted] || files[256])
  try {
    return { bytes: readFileSync(file), file }
  } catch {
    try {
      return { bytes: readFileSync(join(ROOT, 'assets', 'icon.png')), file: 'icon.png' }
    } catch {
      return null
    }
  }
}

const HLS_RUNTIME_FILE = join(ROOT, 'vendor', 'hls.light.min.js')

function loadSeedFile() {
  const candidates = [join(ROOT, 'data', 'seed-stations.json')]
  for (const file of candidates) {
    try {
      if (!existsSync(file)) continue
      const parsed = JSON.parse(readFileSync(file, 'utf8'))
      const rawList = Array.isArray(parsed) ? parsed : Array.isArray(parsed.stations) ? parsed.stations : []
      const list = dedupeStations(rawList.map(normalizeSeedStation).filter(Boolean))
      if (list.length) {
        log('已载入精选台单', `${list.length} 条`, file)
        return list
      }
    } catch (err) {
      log('读取精选台单失败', file, String(err?.message ?? err))
    }
  }
  log('未找到精选台单文件，使用内置兜底台单')
  return EMBEDDED_SEED.map(normalizeSeedStation).filter(Boolean)
}

const CONTENT_TYPE_BY_EXT = {
  '.ts': 'video/mp2t',
  '.aac': 'audio/aac',
  '.m4s': 'video/mp4',
  '.mp4': 'video/mp4',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.key': 'application/octet-stream',
}

function guessContentType(target, upstreamType) {
  const type = str(upstreamType).toLowerCase()
  if (type && !type.includes('text/html') && !type.includes('application/octet-stream')) return upstreamType
  try {
    const ext = extname(new URL(target).pathname).toLowerCase()
    if (CONTENT_TYPE_BY_EXT[ext]) return CONTENT_TYPE_BY_EXT[ext]
  } catch {
    /* ignore */
  }
  if (type && type.includes('application/octet-stream')) return upstreamType
  return 'audio/mpeg'
}

/** 把 m3u8 内所有 URI 改写到本插件代理 */
function rewritePlaylist(text, baseUrl) {
  let base
  try {
    base = new URL(baseUrl)
  } catch {
    return text
  }
  const proxify = (raw) => {
    try {
      const absolute = new URL(raw, base).href
      if (!isHttpUrl(absolute)) return raw
      return `${ROUTE}/hls?url=${encodeURIComponent(absolute)}`
    } catch {
      return raw
    }
  }
  const lines = String(text).split(/\r?\n/)
  return lines
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return line
      if (trimmed.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/g, (match, uri) => `URI="${proxify(uri)}"`)
      }
      return proxify(trimmed)
    })
    .join('\n')
}

/* ------------------------------------------------------------------ *
 * 插件入口
 * ------------------------------------------------------------------ */
export function apply(ctx) {
  const cache = createCache()
  const radio = createRadioBrowser()
  const seedStations = loadSeedFile()

  /* ------------------------------------------------------------------ *
   * Agent 工具桥：Host 命令队列 + 浏览器端状态上报
   * 播放发生在浏览器（<audio>），所以工具只入队命令，客户端 1.2s 轮询执行并回报状态。
   * ------------------------------------------------------------------ */
  const playerCommands = []
  let playerCommandSeq = 0
  let playerState = null
  let lastClientPoll = 0
  const pushPlayerCommand = (command) => {
    playerCommandSeq += 1
    playerCommands.push({ seq: playerCommandSeq, at: Date.now(), ...command })
    if (playerCommands.length > 80) playerCommands.splice(0, playerCommands.length - 80)
    return playerCommandSeq
  }
  const readJsonBody = (req) =>
    new Promise((resolve, reject) => {
      let raw = ''
      req.setEncoding('utf8')
      req.on('data', (chunk) => {
        raw += chunk
        if (raw.length > 64 * 1024) {
          req.destroy()
          reject(new PluginError('请求体过大', 'INTERNAL'))
        }
      })
      req.on('end', () => {
        if (!raw) return resolve({})
        try {
          resolve(JSON.parse(raw))
        } catch {
          reject(new PluginError('JSON 解析失败', 'INTERNAL'))
        }
      })
      req.on('error', (err) => reject(err))
    })

  const json = (res, payload, statusCode = 200) => {
    const body = JSON.stringify(payload)
    res.statusCode = statusCode
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.end(body)
  }
  const ok = (res, data) => json(res, { ok: true, data })
  const fail = (res, error, code = 'INTERNAL') => {
    const message = typeof error === 'string' ? error : String(error?.message ?? error)
    const actualCode = typeof error === 'object' && error?.code ? error.code : code
    json(res, { ok: false, error: message, code: actualCode }, actualCode === 'NOT_FOUND' ? 404 : 502)
  }

  const route = (path, handler, kind = 'exact') => ({
    kind,
    path: `${ROUTE}/${path}`,
    handler: async (req, res) => {
      let url
      try {
        url = new URL(req.url || '/', 'http://127.0.0.1')
      } catch {
        url = new URL('/', 'http://127.0.0.1')
      }
      try {
        await handler(url, req, res)
      } catch (err) {
        if (!res.writableEnded) fail(res, err, (err && err.code) || 'INTERNAL')
      }
    },
  })

  const homeCountries = async () => {
    let counts = new Map()
    try {
      const list = await cache.wrap('countries', COUNTRIES_TTL, () => radio.countries())
      for (const item of list) {
        const code = str(item?.iso_3166_1).toUpperCase()
        if (code) counts.set(code, num(item.stationcount))
      }
    } catch (err) {
      log('国家列表获取失败（降级）', String(err?.message ?? err))
    }
    return PREFERRED_COUNTRIES.map(([code, fallbackName]) => ({
      code,
      name: fallbackName,
      count: counts.get(code) || 0,
    }))
  }

  const mapList = (rawList) => dedupeStations(rawList.map(normalizeStation).filter(Boolean))

  const buildHome = async (forceRefresh) => {
    if (forceRefresh) cache.clear()
    return cache.wrap('home', HOME_TTL, async () => {
      const tags = PREFERRED_TAGS.map((id) => ({ id }))
      const countries = await homeCountries()
      let source = 'radio-browser'
      let popular = []
      let china = []
      try {
        const [topRaw, chinaRaw] = await Promise.all([
          radio.topClick(24),
          radio.search('countrycode=CN&order=clickcount&reverse=true&limit=18&hidebroken=true'),
        ])
        popular = mapList(topRaw)
        china = mapList(chinaRaw)
        if (!popular.length && !china.length) source = 'seed'
      } catch (err) {
        source = 'seed'
        log('首页上游失败，使用精选兜底', String(err?.message ?? err))
      }
      const chinaFallback = seedStations.filter((station) => station.countryCode === 'CN' || station.countryCode === 'HK' || station.countryCode === 'TW').slice(0, 12)
      const worldFallback = seedStations.filter((station) => !['CN', 'HK', 'TW'].includes(station.countryCode)).slice(0, 12)
      return {
        seed: seedStations,
        china: china.length ? china : chinaFallback,
        popular: popular.length ? popular : worldFallback,
        tags,
        countries,
        updatedAt: Date.now(),
        source,
      }
    })
  }

  const filterSeed = (query) => {
    const q = str(query.get('q')).trim().toLowerCase()
    const country = str(query.get('country')).trim().toUpperCase()
    const tag = str(query.get('tag')).trim().toLowerCase()
    return seedStations.filter((station) => {
      if (q && !`${station.name} ${station.country} ${station.tags.join(' ')}`.toLowerCase().includes(q)) return false
      if (country && country !== 'ALL' && station.countryCode !== country) return false
      if (tag && !station.tags.some((item) => item.includes(tag))) return false
      return true
    })
  }

  const searchStations = async (query) => {
    const q = str(query.get('q')).trim()
    const country = str(query.get('country')).trim().toUpperCase()
    const tag = str(query.get('tag')).trim()
    const offset = Math.max(0, Math.min(2000, Math.round(num(query.get('offset'), 0))))
    const limit = Math.max(1, Math.min(100, Math.round(num(query.get('limit'), 48))))
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      order: 'clickcount',
      reverse: 'true',
      hidebroken: 'true',
    })
    if (q) params.set('name', q)
    if (country && country !== 'ALL') params.set('countrycode', country)
    if (tag) params.set('tag', tag)
    const filtered = !!(q || (country && country !== 'ALL') || tag)

    try {
      const raw = await cache.wrap(`search:${params.toString()}`, 120 * 1000, () => radio.search(params.toString()))
      const items = mapList(raw)
      return { items, offset, limit, hasMore: items.length >= limit, source: 'radio-browser' }
    } catch (err) {
      if (!filtered) {
        const items = filterSeed(new URLSearchParams({})).slice(offset, offset + limit)
        return { items, offset, limit, hasMore: false, source: 'seed' }
      }
      throw err
    }
  }

  /** 从 Radio Browser 找同名/同国家的候选流，并做快速健康检查，作为备用信号源 */
  async function findAlternates(params) {
    const stationName = str(params.get('name')).trim()
    const country = str(params.get('country')).trim().toUpperCase()
    const selfId = str(params.get('id'))
    const selfUrl = str(params.get('url'))
    if (!stationName) return []
    const query = new URLSearchParams({
      name: stationName,
      limit: '20',
      hidebroken: 'true',
      order: 'clickcount',
      reverse: 'true',
    })
    if (country) query.set('countrycode', country)
    return cache.wrap(`alt:${stationName}:${country}:${selfId}`, 5 * 60 * 1000, async () => {
      let raw = []
      try {
        raw = await radio.search(query.toString())
      } catch {
        return []
      }
      const candidates = mapList(raw)
        .filter((item) => item.id !== selfId && item.url !== selfUrl && !isBadStreamHost(item.url))
        .slice(0, 6)
      const checked = await Promise.all(
        candidates.map(async (item) => {
          const result = await checkStream(item.url, 7000)
          if (!result.ok) return null
          const station = Object.assign({}, item, {
            url: result.finalUrl || item.url,
            hls: !!result.hls || item.hls,
            codec: item.codec || (result.hls ? 'HLS' : 'MP3'),
          })
          return station
        }),
      )
      return checked.filter(Boolean).slice(0, 3)
    })
  }

  /** 代理并流式转发（音频/分片共用） */
  async function pipeUpstream(req, res, target, options = {}) {
    if (!isHttpUrl(target)) return fail(res, '不支持的音频地址', 'PROXY')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), options.timeout || STREAM_TIMEOUT)
    const abort = () => controller.abort()
    res.on('close', abort)
    const headers = {
      'User-Agent': UA,
      Accept: '*/*',
      'Accept-Encoding': 'identity',
    }
    if (options.referer) headers.Referer = options.referer
    let upstream
    try {
      upstream = await fetch(target, { headers, redirect: 'follow', signal: controller.signal })
    } catch (err) {
      clearTimeout(timer)
      res.off('close', abort)
      if (!res.writableEnded) fail(res, `上游连接失败：${String(err?.message ?? err)}`, 'NETWORK')
      return
    }
    clearTimeout(timer)
    if (!upstream.ok) {
      res.off('close', abort)
      if (!res.writableEnded) fail(res, `上游返回 HTTP ${upstream.status}`, 'PROXY')
      return
    }

    const contentType = options.forceType || guessContentType(target, upstream.headers.get('content-type'))
    res.statusCode = options.statusCode || 200
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Access-Control-Allow-Origin', '*')
    const length = upstream.headers.get('content-length')
    if (length && options.passLength !== false) res.setHeader('Content-Length', length)
    if (!options.readBody) res.setHeader('Accept-Ranges', 'none')

    if ((req.method || 'GET').toUpperCase() === 'HEAD' || options.readBody) {
      res.off('close', abort)
      try {
        const buffer = Buffer.from(await upstream.arrayBuffer())
        if (!res.writableEnded) res.end(buffer)
      } catch (err) {
        if (!res.writableEnded) res.end()
      }
      return
    }

    let readable
    try {
      readable = Readable.fromWeb(upstream.body)
    } catch (err) {
      res.off('close', abort)
      if (!res.writableEnded) fail(res, `音频流读取失败：${String(err?.message ?? err)}`, 'PROXY')
      return
    }
    const cleanup = () => {
      res.off('close', cleanup)
      try {
        readable.destroy()
      } catch {
        /* ignore */
      }
      abort()
    }
    res.on('close', cleanup)
    readable.on('error', () => {
      try {
        res.destroy()
      } catch {
        /* ignore */
      }
      abort()
    })
    res.on('error', cleanup)
    readable.pipe(res)
  }

  /** HLS 播放列表/分片代理 */
  async function proxyHls(req, res, target) {
    if (!isHttpUrl(target)) return fail(res, '不支持的播放列表地址', 'PROXY')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT)
    const abort = () => controller.abort()
    res.on('close', abort)
    let upstream
    try {
      upstream = await fetch(target, {
        headers: { 'User-Agent': UA, Accept: '*/*', 'Accept-Encoding': 'identity' },
        redirect: 'follow',
        signal: controller.signal,
      })
    } catch (err) {
      clearTimeout(timer)
      res.off('close', abort)
      if (!res.writableEnded) fail(res, `播放列表连接失败：${String(err?.message ?? err)}`, 'NETWORK')
      return
    }
    clearTimeout(timer)
    if (!upstream.ok) {
      res.off('close', abort)
      if (!res.writableEnded) fail(res, `播放列表返回 HTTP ${upstream.status}`, 'PROXY')
      return
    }
    const upstreamType = str(upstream.headers.get('content-type')).toLowerCase()
    const isPlaylist = upstreamType.includes('mpegurl') || isHlsUrl(upstream.url || target)
    if (isPlaylist) {
      res.off('close', abort)
      try {
        const text = await upstream.text()
        const rewritten = rewritePlaylist(text, upstream.url || target)
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
        res.setHeader('Cache-Control', 'no-store')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.end(rewritten)
      } catch (err) {
        if (!res.writableEnded) fail(res, `播放列表读取失败：${String(err?.message ?? err)}`, 'PROXY')
      }
      return
    }

    res.statusCode = 200
    res.setHeader('Content-Type', guessContentType(target, upstream.headers.get('content-type')))
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Access-Control-Allow-Origin', '*')
    const length = upstream.headers.get('content-length')
    if (length) res.setHeader('Content-Length', length)
    let readable
    try {
      readable = Readable.fromWeb(upstream.body)
    } catch (err) {
      res.off('close', abort)
      if (!res.writableEnded) fail(res, `分片读取失败：${String(err?.message ?? err)}`, 'PROXY')
      return
    }
    const cleanup = () => {
      res.off('close', cleanup)
      try {
        readable.destroy()
      } catch {
        /* ignore */
      }
      abort()
    }
    res.on('close', cleanup)
    readable.on('error', () => {
      try {
        res.destroy()
      } catch {
        /* ignore */
      }
      abort()
    })
    readable.pipe(res)
  }

  /* ---------------- 台标图片代理（内存 LRU） ---------------- */
  const imageCache = new Map()
  let imageCacheBytes = 0
  const IMAGE_MAX_ITEMS = 200
  const IMAGE_MAX_BYTES = 32 * 1024 * 1024
  const IMAGE_MAX_FILE = 4 * 1024 * 1024

  const rememberImage = (key, entry) => {
    if (imageCache.has(key)) {
      const old = imageCache.get(key)
      imageCacheBytes -= old.bytes.length
      imageCache.delete(key)
    }
    imageCache.set(key, entry)
    imageCacheBytes += entry.bytes.length
    while (imageCache.size > IMAGE_MAX_ITEMS || imageCacheBytes > IMAGE_MAX_BYTES) {
      const oldestKey = imageCache.keys().next().value
      if (oldestKey === undefined) break
      const oldest = imageCache.get(oldestKey)
      imageCacheBytes -= oldest.bytes.length
      imageCache.delete(oldestKey)
    }
  }

  const imageRoute = async (url, req, res) => {
    const target = str(url.searchParams.get('url'))
    if (!isHttpUrl(target)) {
      res.statusCode = 404
      res.end()
      return
    }
    const cached = imageCache.get(target)
    if (cached && Date.now() - cached.at < 24 * 60 * 60 * 1000) {
      res.statusCode = 200
      res.setHeader('Content-Type', cached.type)
      res.setHeader('Cache-Control', 'public, max-age=86400')
      res.setHeader('Content-Length', String(cached.bytes.length))
      res.end(cached.bytes)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12_000)
    try {
      const upstream = await fetch(target, {
        headers: { 'User-Agent': UA, Accept: 'image/*,*/*' },
        redirect: 'follow',
        signal: controller.signal,
      })
      if (!upstream.ok) throw new Error(`HTTP ${upstream.status}`)
      const declared = num(upstream.headers.get('content-length'), 0)
      if (declared > IMAGE_MAX_FILE) throw new Error('图片过大')
      const buffer = Buffer.from(await upstream.arrayBuffer())
      if (buffer.length > IMAGE_MAX_FILE) throw new Error('图片过大')
      const type = str(upstream.headers.get('content-type')) || 'image/jpeg'
      const entry = { at: Date.now(), type, bytes: buffer }
      rememberImage(target, entry)
      res.statusCode = 200
      res.setHeader('Content-Type', type)
      res.setHeader('Cache-Control', 'public, max-age=86400')
      res.setHeader('Content-Length', String(buffer.length))
      res.end(buffer)
    } catch {
      if (!res.writableEnded) {
        res.statusCode = 404
        res.end()
      }
    } finally {
      clearTimeout(timer)
    }
  }

  ctx.effect(() => {
    log('激活', `v${VERSION}`, `seed=${seedStations.length}`, `hls=${existsSync(HLS_RUNTIME_FILE)}`)
    const routes = [
      route('status', (url, req, res) => {
        ok(res, {
          service: 'ok',
          version: VERSION,
          upstream: radio.status(),
          upstreamError: radio.lastError(),
          seedCount: seedStations.length,
          hlsRuntime: existsSync(HLS_RUNTIME_FILE),
        })
      }),

      route('home', async (url, req, res) => {
        try {
          const refresh = url.searchParams.get('refresh') === '1'
          ok(res, await buildHome(refresh))
        } catch (err) {
          fail(res, err, 'NETWORK')
        }
      }),

      route('search', async (url, req, res) => {
        try {
          ok(res, await searchStations(url.searchParams))
        } catch (err) {
          fail(res, err, 'NETWORK')
        }
      }),

      route('stream', async (url, req, res) => {
        const target = str(url.searchParams.get('url'))
        const id = str(url.searchParams.get('id'))
        if (id) radio.countPlay(id)
        await pipeUpstream(req, res, target)
      }),

      route('hls', async (url, req, res) => {
        await proxyHls(req, res, str(url.searchParams.get('url')))
      }),

      route('check', async (url, req, res) => {
        const target = str(url.searchParams.get('url'))
        if (isBadStreamHost(target)) {
          ok(res, { ok: false, reason: 'bad-host' })
          return
        }
        ok(res, await checkStream(target, 9000))
      }),

      route('alternates', async (url, req, res) => {
        try {
          ok(res, { items: await findAlternates(url.searchParams) })
        } catch (err) {
          fail(res, err, 'NETWORK')
        }
      }),

      route('img', (url, req, res) => imageRoute(url, req, res)),

      route('hls-runtime.js', (url, req, res) => {
        if (!existsSync(HLS_RUNTIME_FILE)) {
          res.statusCode = 404
          res.end()
          return
        }
        try {
          const bytes = readFileSync(HLS_RUNTIME_FILE)
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
          res.setHeader('Cache-Control', 'public, max-age=604800')
          res.setHeader('Content-Length', String(bytes.length))
          res.end(bytes)
        } catch (err) {
          log('读取 hls 运行时失败', String(err?.message ?? err))
          res.statusCode = 500
          res.end()
        }
      }),

      /* ---- Agent 工具桥：客户端轮询命令 / 上报播放状态 ---- */
      route('player/commands', (url, req, res) => {
        lastClientPoll = Date.now()
        let cursor = Math.max(0, Math.round(num(url.searchParams.get('cursor'), 0)))
        // 丢弃 90s 前的过期命令（页面关着时排队的请求不应在很久后突然开播）
        while (playerCommands.length && Date.now() - playerCommands[0].at > 90_000) playerCommands.shift()
        const commands = playerCommands.filter((command) => command.seq > cursor)
        if (!commands.length) cursor = playerCommandSeq
        ok(res, { cursor: playerCommandSeq, commands })
      }),

      route('player/state', async (url, req, res) => {
        if (req.method && req.method !== 'POST') {
          fail(res, '请用 POST 上报状态', 'INTERNAL')
          return
        }
        try {
          const body = await readJsonBody(req)
          if (body && typeof body === 'object') {
            const station = body.station && typeof body.station === 'object' ? body.station : null
            playerState = {
              station: station
                ? {
                    id: str(station.id).slice(0, 120),
                    name: str(station.name).slice(0, 160),
                    frequency: str(station.frequency).slice(0, 40),
                    country: str(station.country).slice(0, 80),
                    countryCode: str(station.countryCode).slice(0, 8),
                    codec: str(station.codec).slice(0, 24),
                    bitrate: Math.max(0, Math.round(num(station.bitrate))),
                    hls: !!station.hls,
                  }
                : null,
              playing: !!body.playing,
              loading: !!body.loading,
              error: str(body.error).slice(0, 40),
              volume: Math.max(0, Math.min(1, num(body.volume))),
              muted: !!body.muted,
              updatedAt: Date.now(),
            }
            lastClientPoll = Date.now()
          }
          ok(res, { received: true })
        } catch (err) {
          fail(res, err, 'INTERNAL')
        }
      }),

      route('icon', (url, req, res) => {
        const found = readIcon(url.searchParams.get('size'))
        if (!found) {
          res.statusCode = 404
          res.end()
          return
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'image/png')
        res.setHeader('Cache-Control', 'public, max-age=604800')
        res.setHeader('Content-Length', String(found.bytes.length))
        res.end(found.bytes)
      }),
    ].map((entry) => ctx.webServer.register(entry))

    // 预热首页数据（失败不影响激活）
    buildHome(false).catch((err) => log('首页预热失败', String(err?.message ?? err)))

    return () => {
      routes.forEach((dispose) => {
        try {
          dispose()
        } catch (err) {
          log('路由释放失败', String(err?.message ?? err))
        }
      })
      cache.clear()
    }
  }, 'global-radio: routes')

  /* ------------------------------------------------------------------ *
   * Agent 工具：radio_play / radio_player
   * 用户说“播放上海的某个电台 / 来点音乐电台 / 随便来点电台 / 听 FM”时，
   * 模型直接调用这里；Host 解析电台 -> 入队 -> 客户端轮询播放。
   * ------------------------------------------------------------------ */
  ctx.effect(() => {
    const tools = ctx.get('tools')
    const systemPrompt = ctx.get('systemPrompt')
    if (!tools || typeof tools.register !== 'function') return undefined
    const disposers = []
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    const toolText = () => ({
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: String(value) }],
    })

    const GENRE_ALIASES = {
      music: 'music', '音乐': 'music',
      pop: 'pop', '流行': 'pop',
      news: 'news', '新闻': 'news', '资讯': 'news',
      talk: 'talk', '谈话': 'talk', '聊天': 'talk',
      classical: 'classical', '古典': 'classical',
      jazz: 'jazz', '爵士': 'jazz',
      electronic: 'electronic', '电子': 'electronic', '电音': 'electronic',
      rock: 'rock', '摇滚': 'rock',
      sports: 'sports', '体育': 'sports',
      culture: 'culture', '文化': 'culture',
    }
    const COUNTRY_ALIASES = {
      '中国': 'CN', '大陆': 'CN', '国内': 'CN', cn: 'CN', china: 'CN',
      '香港': 'HK', hk: 'HK', 'hong kong': 'HK',
      '台湾': 'TW', tw: 'TW', taiwan: 'TW',
      '美国': 'US', us: 'US', usa: 'US', 'america': 'US',
      '英国': 'GB', gb: 'GB', uk: 'GB', 'britain': 'GB',
      '法国': 'FR', fr: 'FR', france: 'FR',
      '德国': 'DE', de: 'DE', germany: 'DE',
      '日本': 'JP', jp: 'JP', japan: 'JP',
      '韩国': 'KR', kr: 'KR', korea: 'KR',
      '俄罗斯': 'RU', ru: 'RU', russia: 'RU',
      '意大利': 'IT', it: 'IT', italy: 'IT',
      '西班牙': 'ES', es: 'ES', spain: 'ES',
      '加拿大': 'CA', ca: 'CA', canada: 'CA',
      '澳大利亚': 'AU', au: 'AU', australia: 'AU',
      '巴西': 'BR', br: 'BR', brazil: 'BR',
      '印度': 'IN', in: 'IN', india: 'IN',
    }
    const GENERIC_WORDS = new Set([
      '帮我', '请', '给我', '播放', '放', '听', '听听', '来', '来点', '来个', '随便', '随便来点', '某个', '一个', '一些',
      '电台', '广播', '收音机', '网络电台', '网络广播', '频道', '台', '在线', '实时', '直播', '呀', '啊', '吧', '的', '了',
      'fm', 'am', 'mhz', 'khz', 'radio', 'station',
    ])
    const CHINESE_GENERIC = [...GENERIC_WORDS].filter((word) => /[\u4e00-\u9fff]/.test(word))
    const CHINESE_GENRES = Object.keys(GENRE_ALIASES).filter((word) => /[\u4e00-\u9fff]/.test(word))
    const tokensOf = (text) => {
      const parts = String(text || '')
        .split(/[\s,，。.!！?？、:：/]+/)
        .map((part) => part.trim())
        .filter(Boolean)
      const out = []
      for (const part of parts) {
        const lower = part.toLowerCase()
        if (GENERIC_WORDS.has(lower) || COUNTRY_ALIASES[lower] || GENRE_ALIASES[lower]) continue
        // 中文长句（如“音乐电台”“上海的某个电台”）先剥掉类型/泛词，保留城市或台名片段
        let rest = part
        if (/[\u4e00-\u9fff]/.test(part)) {
          for (const word of CHINESE_GENRES) rest = rest.split(word).join('')
          for (const word of CHINESE_GENERIC) rest = rest.split(word).join('')
        }
        rest = rest.trim()
        if (!rest) continue
        if (/^\d{2,4}(?:\.\d{1,2})?$/.test(rest)) {
          out.push(rest)
          continue
        }
        if (rest.length >= 1) out.push(rest)
      }
      return out
    }

    const searchStations = async (params) => {
      try {
        const query = new URLSearchParams({
          limit: '24',
          order: 'clickcount',
          reverse: 'true',
          hidebroken: 'true',
          ...params,
        })
        return mapList(await radio.search(query.toString()))
      } catch {
        return []
      }
    }

    const stationHaystack = (station) =>
      [station.name, station.frequency || '', station.country, station.countryCode, station.city, (station.tags || []).join(' ')]
        .join(' ')
        .toLowerCase()

    const parseRadioRequest = (args) => {
      const rawQuery = str(args.query).trim()
      const lower = rawQuery.toLowerCase()
      let genre = str(args.genre).trim().toLowerCase()
      if (!genre) {
        for (const alias of Object.keys(GENRE_ALIASES)) {
          if (lower.includes(alias.toLowerCase())) {
            genre = GENRE_ALIASES[alias]
            break
          }
        }
      } else {
        genre = GENRE_ALIASES[genre] || genre
      }
      let country = str(args.country).trim()
      if (!country) {
        for (const alias of Object.keys(COUNTRY_ALIASES)) {
          if (lower.includes(alias.toLowerCase())) {
            country = COUNTRY_ALIASES[alias]
            break
          }
        }
      } else {
        country = COUNTRY_ALIASES[country.toLowerCase()] || country.toUpperCase()
      }
      const freqMatch = rawQuery.match(/\b(?:fm|am)?\s*(\d{2,4}(?:\.\d{1,2})?)\s*(?:mhz|khz)?\b/i)
      const frequency = freqMatch ? freqMatch[1] : ''
      return {
        rawQuery,
        tokens: tokensOf(rawQuery).slice(0, 3),
        genre,
        country: country ? String(country).toUpperCase() : '',
        frequency,
        random:
          !!args.random ||
          /随便|随机|某个|一些|来点/.test(rawQuery) ||
          (!rawQuery && !str(args.genre).trim() && !str(args.country).trim()),
      }
    }

    const resolveRadio = async (args) => {
      const parsed = parseRadioRequest(args || {})
      const seen = new Set()
      const candidates = []
      const add = (list) => {
        for (const station of list || []) {
          if (!station || !station.url) continue
          const key = station.id || station.url
          if (seen.has(key)) continue
          seen.add(key)
          candidates.push(station)
        }
      }
      add(seedStations)
      let filtered = false
      for (const token of parsed.tokens) {
        filtered = true
        add(await searchStations({ name: token }))
      }
      if (parsed.rawQuery) add(await searchStations({ name: parsed.rawQuery, limit: '10' }))
      if (parsed.genre) {
        filtered = true
        add(await searchStations({ tag: parsed.genre }))
      }
      if (parsed.country) {
        filtered = true
        add(await searchStations({ countrycode: parsed.country }))
      }
      if (!filtered) add(await searchStations({ limit: '30' }))

      const scored = candidates
        .map((station) => {
          const haystack = stationHaystack(station)
          let score = 0
          for (const token of parsed.tokens) {
            if (haystack.includes(token.toLowerCase())) score += 10
          }
          if (parsed.frequency && (haystack.includes(parsed.frequency) || (station.frequency || '').includes(parsed.frequency))) score += 24
          if (parsed.genre && (station.tags || []).includes(parsed.genre)) score += 8
          if (parsed.country && station.countryCode === parsed.country) score += 6
          score += Math.min(4, Math.log10((station.clicks || 0) + 10))
          return { station, score }
        })
        .sort((left, right) => right.score - left.score)

      if (!scored.length) return { empty: true, parsed }
      if (parsed.tokens.length && scored[0].score < 10) return { empty: true, parsed }
      const top = scored.slice(0, 12).map((item) => item.station)
      const pool = parsed.random ? top.slice(0, Math.min(8, top.length)) : top.slice(0, 1)
      const picked = pool[Math.floor(Math.random() * pool.length)]
      const queue = [picked, ...top.filter((station) => station.id !== picked.id)]
      return { station: picked, queue, parsed }
    }

    const formatStation = (station) => {
      if (!station) return '未知电台'
      const frequency = station.frequency || (station.bitrate > 0 ? `${station.codec || '在线'} ${station.bitrate} kbps` : '在线电台')
      const country = station.country || station.countryCode || ''
      return `${station.name}（${frequency}${country ? ' · ' + country : ''}）`
    }

    const pushPlay = (resolved) => {
      pushPlayerCommand({ type: 'play', station: resolved.station, queue: resolved.queue })
    }

    disposers.push(
      tools.register({
        name: 'radio_play',
        description:
          '在 DeepSeek Harness 的「全球电台」插件里播放电台 / 广播 / FM / AM / 网络电台。当用户说“播放上海的某个电台”“来点音乐电台”“随便放个电台”“听 FM 97.4”“放 BBC”这类话时使用本工具；不要用网易云音乐工具（netease_play）处理电台请求，那些只用于歌曲/歌单/专辑。支持 query（城市/台名/频率/关键词）、genre（news/music/classical/jazz/electronic/rock/talk）、country（中国/美国/日本…）、random（随便来点）。播放后面板底部出现大播放条，回到对话后收进左侧栏迷你播放器。',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '电台关键词：城市、台名、频率或任意关键词，例如“上海”“上海动感101”“北京 FM97.4”“BBC World Service”。' },
            genre: { type: 'string', description: '类型：music 音乐 / news 新闻 / talk 谈话 / classical 古典 / jazz 爵士 / electronic 电子 / rock 摇滚 / sports 体育 / culture 文化（也接受中文）。' },
            country: { type: 'string', description: '国家/地区：CN 中国、HK 香港、TW 台湾、US 美国、GB 英国、JP 日本、KR 韩国、FR 法国、DE 德国 等（也接受中文）。' },
            random: { type: 'boolean', description: 'true = 从匹配到的电台里随机挑一个（“随便来点电台”时使用）。' },
          },
          additionalProperties: false,
        },
        output: toolText(),
        timeoutMs: 30_000,
        async execute(args) {
          const request = args && typeof args === 'object' ? args : {}
          let resolved
          try {
            resolved = await resolveRadio(request)
          } catch (err) {
            return '电台解析失败：' + String(err && err.message ? err.message : err)
          }
          if (!resolved.station) {
            const label = request.query || request.genre || request.country || '这个条件'
            return `没有找到「${label}」可播放的电台。可以换个城市/台名/类型试试，或直接说“随便来点电台”。`
          }
          pushPlay(resolved)
          await sleep(900)
          const confirmed = playerState && playerState.station && playerState.station.id === resolved.station.id
          if (confirmed && playerState.playing) {
            return `正在播放：${formatStation(resolved.station)}。已交给「全球电台」插件，回到对话也不会中断；左侧栏会出现迷你播放器，同一时间只会有一个播放器发声。`
          }
          if (Date.now() - lastClientPoll > 15_000) {
            return `已把播放请求发给「全球电台」：${formatStation(resolved.station)}；但当前似乎没有打开的 Harness 页面在响应，打开或刷新页面后会在电台面板开始播放。`
          }
          return `已让「全球电台」开始播放：${formatStation(resolved.station)}。播放器会在面板内显示底部大播放条，回到对话后收进左侧栏迷你播放器。`
        },
      }),
    )

    disposers.push(
      tools.register({
        name: 'radio_player',
        description:
          '控制 DeepSeek Harness「全球电台」播放器的状态：status 查看当前电台、pause 暂停、resume 继续、next 下一台、prev 上一台、volume 调音量、search 只搜索不播放、random 随机播放。用户提到电台/广播/FM/AM 时使用本工具；歌曲/歌单/专辑请用网易云音乐工具。',
        parameters: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['status', 'pause', 'resume', 'next', 'prev', 'volume', 'search', 'random'], description: '要执行的操作。' },
            volume: { type: 'number', description: 'action=volume 时的音量 0-1。' },
            query: { type: 'string', description: 'action=search 时的搜索词（台名/城市/关键词）。' },
            genre: { type: 'string', description: 'action=search 时的类型过滤。' },
            country: { type: 'string', description: 'action=search 时的国家过滤。' },
          },
          required: ['action'],
          additionalProperties: false,
        },
        output: toolText(),
        timeoutMs: 30_000,
        async execute(args) {
          const request = args && typeof args === 'object' ? args : {}
          const action = String(request.action || 'status')
          const state = playerState
          switch (action) {
            case 'status': {
              if (!state || !state.station) return '当前没有正在播放的电台。可以用 radio_play 说一句“播放上海的某个电台”或“随便来点电台”。'
              const station = state.station
              const progress = state.playing ? '正在播放' : state.loading ? '连接中' : '已暂停'
              return `${formatStation(station)} · ${progress}${state.error ? '（错误：' + state.error + '）' : ''}；音量 ${Math.round((state.volume || 0) * 100)}%${state.muted ? '（静音）' : ''}。`
            }
            case 'pause':
              pushPlayerCommand({ type: 'control', action: 'pause' })
              return '已暂停电台。'
            case 'resume':
              pushPlayerCommand({ type: 'control', action: 'resume' })
              return '已继续播放。'
            case 'next':
              pushPlayerCommand({ type: 'control', action: 'next' })
              return '已切到下一台。'
            case 'prev':
              pushPlayerCommand({ type: 'control', action: 'prev' })
              return '已切到上一台。'
            case 'volume': {
              const volume = Math.min(1, Math.max(0, Number(request.volume) || 0))
              pushPlayerCommand({ type: 'control', action: 'volume', volume })
              return `电台音量已设为 ${Math.round(volume * 100)}%。`
            }
            case 'random': {
              let resolved
              try {
                resolved = await resolveRadio({ random: true })
              } catch (err) {
                return '随机播放失败：' + String(err && err.message ? err.message : err)
              }
              if (!resolved.station) return '暂时没有找到可播放的电台。'
              pushPlay(resolved)
              return `已随机播放：${formatStation(resolved.station)}。`
            }
            case 'search': {
              const parsed = parseRadioRequest(request)
              const seen = new Set()
              const found = []
              const take = (list) => {
                for (const station of list || []) {
                  if (!station || seen.has(station.id)) continue
                  seen.add(station.id)
                  found.push(station)
                }
              }
              if (parsed.rawQuery) take(await searchStations({ name: parsed.rawQuery, limit: '12' }))
              if (parsed.genre) take(await searchStations({ tag: parsed.genre, limit: '12' }))
              if (parsed.country) take(await searchStations({ countrycode: parsed.country, limit: '12' }))
              if (!found.length) take(seedStations.slice(0, 12))
              const lines = found.slice(0, 10).map((station, index) => `${index + 1}. ${formatStation(station)}`)
              return `找到 ${Math.min(found.length, 10)} 个电台（只搜索，未播放）：\n` + lines.join('\n') + '\n想听哪个就说“播放第 N 个 / 播放 <台名>”。'
            }
            default:
              return '未知操作：' + action
          }
        },
      }),
    )

    if (systemPrompt && typeof systemPrompt.section === 'function') {
      disposers.push(
        systemPrompt.section({
          name: 'global-radio-plugin',
          order: 8800,
          text: [
            '## 电台播放（全球电台插件）',
            '当用户提到「电台 / 广播 / FM / AM / 收音机 / 网络电台 / 收听某个频率 / 随便来点电台」时，必须使用「全球电台」插件工具：`radio_play` 播放，`radio_player` 查看状态/暂停/继续/切歌/音量/搜索/随机。',
            '不要用网易云音乐工具（netease_play / netease_player）处理电台、广播、FM、收音机请求——那些只用于歌曲、歌手、歌单、专辑。反过来，用户要听歌/歌曲/歌单时才用网易云工具。',
            '示例：用户说“播放上海的某个电台”→ radio_play({ query: "上海" })；说“来点新闻电台”→ radio_play({ genre: "news" })；说“随便来点电台”→ radio_play({ random: true })；说“听 FM 97.4”→ radio_play({ query: "FM 97.4" })；说“放 BBC”→ radio_play({ query: "BBC" })。',
            '播放不会打断对话：电台在插件播放器里播放，面板内有底部大播放条，回到对话后收进左侧栏迷你播放器；与网易云音乐互斥，同一时间只一个音频在发声。',
          ].join('\n'),
        }),
      )
    }

    return () => {
      disposers.forEach((dispose) => {
        try {
          dispose()
        } catch (err) {
          log('工具释放失败', String(err?.message ?? err))
        }
      })
    }
  }, 'global-radio: agent tools')
}
