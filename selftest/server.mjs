#!/usr/bin/env node
/**
 * 全球电台（Global Radio）client 离线验收后端
 *
 * 只服务 dsh-global-radio-selftest，不碰插件源码：
 *  - 静态服务：harness.html / client.js / React 18 UMD
 *  - 完整 mock /global-radio/api/*（严格按 docs/CONTRACT.md §2 的信封与形状）
 *  - 确定性数据：seed 8 条（含 1 条 hls:true）/ china 5 条 / popular 5 条
 *  - /stream 返回 75s 22050Hz mono PCM WAV，支持 Range / 206
 *  - /hls：m3u8 返回改写后的播放列表（URI 全部指向 /global-radio/api/hls?url=），分片返回字节
 *  - /hls-runtime.js：最小假 Hls 类，loadSource 时把 audio.src 指向 /stream（走通播放链路）
 *  - /img 本地 SVG 占位，/icon PNG（纯 Node zlib 生成，无 npm 依赖）
 *  - 控制面：POST /__config、GET /__calls、POST /__reset
 *
 * 用法：node server.mjs                       （随机端口，stdout 打印 {"port":N}）
 *       GR_CLIENT=/abs/path.js node server.mjs   覆盖 client.js 路径（基础设施自测用）
 */
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const HERE = dirname(fileURLToPath(import.meta.url))
const WORKSPACE = join(HERE, '..')
const CLIENT = process.env.GR_CLIENT
  ? resolve(process.env.GR_CLIENT)
  : join(WORKSPACE, 'client.js')

/* ------------------------------------------------------------------ *
 * 配置（POST /__config 可改）
 * ------------------------------------------------------------------ */
const DEFAULTS = {
  errorMode: null,      // null | 'home' | 'search' | 'stream' | 'hls' | 'all'
  hlsMissing: false,    // true → /hls-runtime.js 404（验证「缺少 HLS 运行时」提示）
  slowMs: 0,            // 人为延迟数据接口（验证加载态）
  imgFail: false,       // true → /img 404（验证台标首字母占位）
  fallbackMode: null,   // null | 'has-alt' | 'empty'：模拟主源失败 + 备用源有/无候选
  upstream: 'ok',       // ok | degraded
  seedCount: 8,
  source: 'radio-browser',
}
const cfg = { ...DEFAULTS }
let calls = []

/* ------------------------------------------------------------------ *
 * 确定性 mock 数据
 * ------------------------------------------------------------------ */
const API = '/global-radio/api'

const S = (id, name, url, country, countryCode, city, tags, codec, bitrate, frequency, hls = false) => ({
  id,
  name,
  url,
  logo: 'http://mock.local/logo/' + encodeURIComponent(id) + '.png',
  country,
  countryCode,
  city,
  tags,
  codec,
  bitrate,
  frequency,
  homepage: 'https://mock.local/' + encodeURIComponent(id),
  hls,
  votes: 100 + ((id.length * 37) % 900),
  clicks: 200 + ((id.length * 61) % 1800),
})

// seed：国内 + 国际混排，8 条。第 1 条与 hls 条目是断言锚点：
//  - seed:cn-beijing-fm974 → 无封面时的频率展示 / hero 频率
//  - seed:hls-cbc          → HLS 电台
const BUILTIN_SEED = [
  S('seed:cn-beijing-fm974', '北京音乐广播 FM97.4', 'http://mock.local/stream/beijing.mp3',
    'China', 'CN', 'Beijing', ['music', 'pop'], 'MP3', 128, 'FM 97.4'),
  S('seed:cn-shanghai-fm1017', '上海东方广播 FM101.7', 'http://mock.local/stream/shanghai.mp3',
    'China', 'CN', 'Shanghai', ['music', 'news'], 'MP3', 128, 'FM 101.7'),
  S('seed:cn-gd-fm993', '广东音乐之声 FM99.3', 'http://mock.local/stream/guangdong.mp3',
    'China', 'CN', 'Guangzhou', ['music', 'pop'], 'AAC', 96, 'FM 99.3'),
  S('seed:gb-bbc-radio1', 'BBC Radio 1', 'http://mock.local/stream/bbc1.mp3',
    'United Kingdom', 'GB', 'London', ['music', 'pop', 'rock'], 'AAC', 128, 'FM 98.8'),
  S('seed:us-npr-news', 'NPR News', 'http://mock.local/stream/npr.mp3',
    'United States', 'US', 'Washington', ['news', 'talk'], 'MP3', 64, null),
  S('seed:jp-nhk-radio1', 'NHK Radio 1', 'http://mock.local/stream/nhk.mp3',
    'Japan', 'JP', 'Tokyo', ['news', 'talk'], 'AAC', 48, null),
  S('seed:fr-rfi-francais', 'RFI Français', 'http://mock.local/stream/rfi.mp3',
    'France', 'FR', 'Paris', ['news', 'talk'], 'MP3', 96, 'FM 89.0'),
  S('seed:hls-cbc', 'CBC Radio One (HLS)', 'http://mock.local/hls/cbc/playlist.m3u8',
    'Canada', 'CA', 'Toronto', ['news', 'talk'], 'AAC', 96, null, true),
]

const BUILTIN_CHINA = [
  S('cn:cnr-voice', '中国之声 FM106.1', 'http://mock.local/stream/cnr.mp3',
    'China', 'CN', 'Beijing', ['news', 'talk'], 'MP3', 128, 'FM 106.1'),
  S('cn:shanghai-news', '上海新闻广播 FM93.4', 'http://mock.local/stream/shnews.mp3',
    'China', 'CN', 'Shanghai', ['news', 'talk'], 'MP3', 96, 'FM 93.4'),
  S('cn:guangzhou-traffic', '广州交通电台 FM105.2', 'http://mock.local/stream/gztraffic.mp3',
    'China', 'CN', 'Guangzhou', ['news', 'talk'], 'MP3', 64, 'FM 105.2'),
  S('cn:shenzhen-music', '深圳音乐广播 FM97.1', 'http://mock.local/stream/szmusic.mp3',
    'China', 'CN', 'Shenzhen', ['music', 'pop'], 'AAC', 128, 'FM 97.1'),
  S('cn:zhejiang-music', '浙江音乐调频 FM99.6', 'http://mock.local/stream/zjmusic.mp3',
    'China', 'CN', 'Hangzhou', ['music', 'classical'], 'MP3', 128, 'FM 99.6'),
]

const BUILTIN_POPULAR = [
  S('gb:bbc-world-service', 'BBC World Service', 'http://mock.local/stream/bbcws.mp3',
    'United Kingdom', 'GB', 'London', ['news', 'talk'], 'MP3', 96, null),
  S('us:npr-program', 'NPR Program Stream', 'http://mock.local/stream/npr2.mp3',
    'United States', 'US', 'New York', ['news', 'talk'], 'MP3', 128, null),
  S('jp:tokyo-fm', 'Tokyo FM', 'http://mock.local/stream/tokyofm.mp3',
    'Japan', 'JP', 'Tokyo', ['music', 'pop'], 'AAC', 128, 'FM 80.0'),
  S('fr:france-inter', 'France Inter', 'http://mock.local/stream/franceinter.mp3',
    'France', 'FR', 'Paris', ['news', 'talk'], 'MP3', 128, 'FM 87.8'),
  S('au:abc-radio-national', 'ABC Radio National', 'http://mock.local/stream/abc.mp3',
    'Australia', 'AU', 'Sydney', ['news', 'talk'], 'MP3', 64, null),
]

/* ------------------------------------------------------------------ *
 * 优先读取插件真实 seed 数据（data/seed-stations.json），让截图里的台名/频率
 * 接近真实；文件不存在/不可读时回退到上面内置的确定性数据。
 * 验收断言锚点（真实 seed 里存在）：
 *   seed:bj-music-fm974      → 北京音乐广播 FM97.4（频率展示 / hero）
 *   seed:cnr2-jingjizhisheng → HLS 电台（hls:true）
 * ------------------------------------------------------------------ */
const SEED_FILE = join(WORKSPACE, 'data', 'seed-stations.json')

function parseFrequencyFromName(name) {
  const text = String(name || '')
  const m = /\b(?:FM|AM|MW|LW)\s*[:\-]?\s*(\d{2,4}(?:\.\d{1,2})?)\s*(?:MHz|kHz)?/i.exec(text)
  if (m) return (/^(?:AM|MW|LW)$/i.test(text.slice(Math.max(0, m.index - 1)).trim()) ? 'AM ' : 'FM ') + m[1]
  const cn = /(调频|中波)\s*(\d{2,4}(?:\.\d{1,2})?)/.exec(text)
  if (cn) return (cn[1] === '中波' ? 'AM ' : 'FM ') + cn[2]
  return null
}

function readRealSeed() {
  try {
    if (!existsSync(SEED_FILE)) return []
    const raw = JSON.parse(readFileSync(SEED_FILE, 'utf8'))
    const list = Array.isArray(raw) ? raw : raw && Array.isArray(raw.stations) ? raw.stations : []
    return list
      .filter((st) => st && st.id && st.name)
      .map((st) => {
        const id = String(st.id)
        return {
          id,
          name: String(st.name),
          url: String(st.url || ''),
          logo: st.logo ? String(st.logo) : 'http://mock.local/logo/' + encodeURIComponent(id) + '.png',
          country: String(st.country || ''),
          countryCode: String(st.countryCode || '').toUpperCase(),
          city: String(st.city || ''),
          tags: Array.isArray(st.tags) ? st.tags.filter(Boolean).map(String).slice(0, 6) : [],
          codec: String(st.codec || 'UNKNOWN'),
          bitrate: Number(st.bitrate) || 0,
          frequency: st.frequency ? String(st.frequency) : parseFrequencyFromName(st.name),
          homepage: String(st.homepage || ''),
          hls: !!st.hls,
          votes: Number(st.votes) || 0,
          clicks: Number(st.clicks) || 0,
        }
      })
  } catch {
    return []
  }
}

const REAL_SEED = readRealSeed()
const USE_REAL_SEED = REAL_SEED.length >= 8
const SEED = USE_REAL_SEED ? REAL_SEED.slice(0, 12) : BUILTIN_SEED
const CHINA = USE_REAL_SEED ? REAL_SEED.filter((st) => st.countryCode === 'CN').slice(0, 12) : BUILTIN_CHINA
const POPULAR = USE_REAL_SEED
  ? [...REAL_SEED].sort((a, b) => b.clicks - a.clicks || a.id.localeCompare(b.id)).slice(0, 12)
  : BUILTIN_POPULAR
if (USE_REAL_SEED) cfg.seedCount = REAL_SEED.length

// 搜索目录：真实 seed + 少量合成 BBC 条目（保证搜索断言有稳定数据）；无真实 seed 时用内置数据
const EXTRA_CATALOG = [
  S('mock:bbc-radio1', 'BBC Radio 1', 'http://mock.local/stream/bbc1.mp3',
    'United Kingdom', 'GB', 'London', ['music', 'pop', 'rock'], 'AAC', 128, 'FM 98.8'),
  S('mock:bbc-radio2', 'BBC Radio 2', 'http://mock.local/stream/bbc2.mp3',
    'United Kingdom', 'GB', 'London', ['music', 'pop'], 'AAC', 128, 'FM 88.6'),
  S('mock:bbc-radio4', 'BBC Radio 4', 'http://mock.local/stream/bbc4.mp3',
    'United Kingdom', 'GB', 'London', ['news', 'talk'], 'MP3', 96, 'FM 92.5'),
]

const COUNTRY_NAMES = {
  CN: 'China', US: 'United States', GB: 'United Kingdom', FR: 'France', DE: 'Germany',
  JP: 'Japan', KR: 'South Korea', HK: 'Hong Kong', TW: 'Taiwan', RU: 'Russia',
  IT: 'Italy', ES: 'Spain', AU: 'Australia', CA: 'Canada', BR: 'Brazil', IN: 'India',
}
const COUNTRIES = Object.entries(COUNTRY_NAMES).map(([code, name], i) => ({
  code, name, count: 20 + i * 7,
}))
const TAGS = ['news', 'music', 'talk', 'jazz', 'classical', 'electronic', 'rock', 'sports']
  .map((id) => ({ id }))

// 搜索目录（按 id 去重）：真实 seed / 内置数据 + 合成 BBC 条目
const CATALOG = (() => {
  const map = new Map()
  const base = USE_REAL_SEED
    ? REAL_SEED
    : [...BUILTIN_SEED, ...BUILTIN_CHINA, ...BUILTIN_POPULAR]
  for (const st of [...base, ...EXTRA_CATALOG]) map.set(st.id, st)
  return [...map.values()]
})()

const HOME = () => ({
  seed: SEED,
  china: CHINA,
  popular: POPULAR,
  tags: TAGS,
  countries: COUNTRIES,
  updatedAt: 1730000000000,
  source: cfg.source,
})

/* ------------------------------------------------------------------ *
 * 音频：75s / 22050Hz / mono / 16bit PCM WAV（确定性正弦波）
 * ------------------------------------------------------------------ */
const WAV_SECONDS = 75
const WAV_SR = 22050
const WAV = (() => {
  const n = WAV_SECONDS * WAV_SR
  const buf = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + n * 2, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20) // PCM
  buf.writeUInt16LE(1, 22) // mono
  buf.writeUInt32LE(WAV_SR, 24)
  buf.writeUInt32LE(WAV_SR * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(n * 2, 40)
  const fade = WAV_SR * 0.25
  for (let i = 0; i < n; i++) {
    const env = Math.min(1, i / fade, (n - i) / fade)
    // 两个频率叠加，保证 AnalyserNode 有可见频谱、WAV 可听
    const v = Math.sin((2 * Math.PI * 440 * i) / WAV_SR) * 0.16 +
      Math.sin((2 * Math.PI * 880 * i) / WAV_SR) * 0.06
    buf.writeInt16LE(Math.round(v * env * 32767), 44 + i * 2)
  }
  return buf
})()

function serveWav(req, res) {
  const total = WAV.length
  const range = req.headers.range || ''
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim())
  let start = 0
  let end = total - 1
  let partial = false
  if (m && (m[1] !== '' || m[2] !== '')) {
    if (m[1] === '') {
      // bytes=-N → 末尾 N 字节
      const n = Number(m[2] || 0)
      start = Math.max(0, total - n)
    } else {
      start = Number(m[1])
      if (m[2] !== '') end = Math.min(Number(m[2]), total - 1)
    }
    partial = true
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= total) {
    res.writeHead(416, { 'Content-Range': `bytes */${total}`, 'Accept-Ranges': 'bytes' })
    return res.end()
  }
  const len = end - start + 1
  const headers = {
    'Content-Type': 'audio/wav',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
    'Accept-Ranges': 'bytes',
  }
  if (partial) {
    headers['Content-Range'] = `bytes ${start}-${end}/${total}`
    headers['Content-Length'] = String(len)
    res.writeHead(206, headers)
    return res.end(WAV.subarray(start, end + 1))
  }
  headers['Content-Length'] = String(total)
  res.writeHead(200, headers)
  return res.end(WAV)
}

/* ------------------------------------------------------------------ *
 * HLS：播放列表重写 + 分片代理
 * ------------------------------------------------------------------ */
const HLS_PLAYLIST = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-KEY:METHOD=AES-128,URI="key.bin"
#EXT-X-MAP:URI="init.mp4"
#EXTINF:10.0,
seg0.ts
#EXTINF:10.0,
seg1.ts
#EXTINF:10.0,
seg2.ts
#EXT-X-ENDLIST
`

function hlsM3u8(res, baseUrl) {
  const base = baseUrl.replace(/[^/]+$/, '')
  const abs = (u) => new URL(u, base).href
  const proxy = (u) => `${API}/hls?url=${encodeURIComponent(abs(u))}`
  const lines = HLS_PLAYLIST.split('\n').map((line) => {
    if (!line || line.startsWith('#')) {
      // 处理 #EXT-X-KEY / #EXT-X-MAP / #EXT-X-MEDIA / #EXT-X-I-FRAME-STREAM-INF 里的 URI="..."
      return line.replace(/URI="([^"]+)"/g, (_, u) => `URI="${proxy(u)}"`)
    }
    return proxy(line)
  })
  const body = lines.join('\n')
  res.writeHead(200, {
    'Content-Type': 'application/vnd.apple.mpegurl',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  })
  return res.end(body)
}

function hlsSegment(res, url) {
  const path = url.split('?')[0].toLowerCase()
  const type = path.endsWith('.ts') ? 'video/mp2t'
    : path.endsWith('.aac') ? 'audio/aac'
      : path.endsWith('.m4s') || path.endsWith('.mp4') ? 'video/mp4'
        : 'application/octet-stream'
  const body = Buffer.alloc(512, 0x47) // 假分片字节，不参与真实解码
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': String(body.length),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  })
  return res.end(body)
}

/* ------------------------------------------------------------------ *
 * 假 hls.js 运行时：最小 Hls 类，把 audio.src 指向本地 /stream，
 * 触发 MANIFEST_PARSED / LEVEL_LOADED 等事件，让 client 判定「已就绪/播放」
 * ------------------------------------------------------------------ */
const HLS_RUNTIME = `/* mock hls.js runtime (dsh-global-radio-selftest) */
(function () {
  function FakeHls() {
    this._media = null
    this._handlers = {}
    this._source = null
    this._destroyed = false
  }
  FakeHls.isSupported = function () { return true }
  FakeHls.Events = {
    MEDIA_ATTACHED: 'hlsMediaAttached',
    MEDIA_DETACHED: 'hlsMediaDetached',
    MANIFEST_PARSED: 'hlsManifestParsed',
    LEVEL_LOADED: 'hlsLevelLoaded',
    LEVEL_SWITCHED: 'hlsLevelSwitched',
    BUFFER_APPENDED: 'hlsBufferAppended',
    ERROR: 'hlsError',
  }
  FakeHls.prototype.on = function (event, cb) {
    (this._handlers[event] = this._handlers[event] || []).push(cb)
    return this
  }
  FakeHls.prototype.off = function (event, cb) {
    if (!cb) { delete this._handlers[event]; return this }
    this._handlers[event] = (this._handlers[event] || []).filter(function (f) { return f !== cb })
    return this
  }
  FakeHls.prototype.attachMedia = function (media) {
    this._media = media
    this._emit('hlsMediaAttached')
    return this
  }
  FakeHls.prototype.detachMedia = function () {
    this._media = null
    this._emit('hlsMediaDetached')
    return this
  }
  FakeHls.prototype.loadSource = function (url) {
    var self = this
    this._source = url
    if (!this._media) return this
    // 直接把 audio.src 指向 mock /stream，走通「同源代理 → 可播放」链路
    this._media.src = '/global-radio/api/stream?hls=1&url=' + encodeURIComponent(url)
    try { this._media.load() } catch (e) {}
    setTimeout(function () {
      if (self._destroyed) return
      self._emit('hlsManifestParsed', { levels: [{ bitrate: 128000 }] })
      self._emit('hlsLevelLoaded', { level: 0, details: { totalduration: 75 } })
    }, 30)
    return this
  }
  FakeHls.prototype.startLoad = function () {
    // client 可能在 MANIFEST_PARSED 后调用 play()，这里只补一次事件
    return this
  }
  FakeHls.prototype.stopLoad = function () { return this }
  FakeHls.prototype.destroy = function () {
    this._destroyed = true
    this._handlers = {}
    this._media = null
  }
  FakeHls.prototype._emit = function (event, data) {
    var list = (this._handlers[event] || []).slice()
    for (var i = 0; i < list.length; i++) {
      try { list[i](event, data) } catch (e) { setTimeout(function () { throw e }, 0) }
    }
  }
  window.Hls = FakeHls
  if (typeof module !== 'undefined' && module.exports) module.exports = FakeHls
})()
`

/* ------------------------------------------------------------------ *
 * 图片：本地 SVG 占位（/img）+ 纯 Node 生成 PNG（/icon）
 * ------------------------------------------------------------------ */
function svgPlaceholder(seed) {
  let h = 0
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) % 360
  const hue = h
  const hue2 = (hue + 62) % 360
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue} 78% 62%)"/>` +
    `<stop offset="1" stop-color="hsl(${hue2} 68% 38%)"/></linearGradient></defs>` +
    `<rect width="360" height="360" fill="url(#g)"/>` +
    `<circle cx="286" cy="76" r="64" fill="rgba(255,255,255,.2)"/>` +
    `<circle cx="60" cy="312" r="100" fill="rgba(0,0,0,.16)"/>` +
    `<g fill="none" stroke="rgba(255,255,255,.7)" stroke-width="12" stroke-linecap="round">` +
    `<path d="M62 236a52 52 0 0 1 0-72"/><path d="M96 262a98 98 0 0 1 0-124"/>` +
    `<path d="M298 236a52 52 0 0 0 0-72"/><path d="M264 262a98 98 0 0 0 0-124"/>` +
    `</g><circle cx="180" cy="200" r="30" fill="rgba(255,255,255,.85)"/>` +
    `<rect x="168" y="122" width="24" height="52" rx="12" fill="rgba(255,255,255,.85)"/>` +
    `</svg>`
  return Buffer.from(svg, 'utf8')
}

// 纯 Node zlib 生成 PNG（无依赖），返回 64/128/256 的同款图标
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}
function makePngIcon(size) {
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1)
    raw[row] = 0 // filter none
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size)
      // 深蓝 → 青 渐变 + 圆形电台波纹
      let r = Math.round(28 + t * 40)
      let g = Math.round(70 + t * 120)
      let b = Math.round(150 + t * 80)
      const cx = size / 2
      const cy = size / 2
      const d = Math.hypot(x - cx, y - cy) / size
      if (d < 0.34 && d > 0.26) { r = 235; g = 245; b = 255 }
      if (d < 0.2) { r = 235; g = 245; b = 255 }
      if (d < 0.12) { r = 40; g = 90; b = 170 }
      const o = row + 1 + x * 3
      raw[o] = r
      raw[o + 1] = g
      raw[o + 2] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr.writeUInt8(8, 8) // bit depth
  ihdr.writeUInt8(2, 9) // color type RGB
  ihdr.writeUInt8(0, 10)
  ihdr.writeUInt8(0, 11)
  ihdr.writeUInt8(0, 12)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}
const ICONS = { 64: makePngIcon(64), 128: makePngIcon(128), 256: makePngIcon(256) }
const ICON_FILE_CACHE = new Map()
/** 优先返回插件真实图标 assets/icon-<size>.png（找不到依次回退 128/256/64，再退回生成图） */
function iconFor(size) {
  for (const s of [size, 128, 256, 64]) {
    const file = join(WORKSPACE, 'assets', `icon-${s}.png`)
    if (existsSync(file)) {
      if (!ICON_FILE_CACHE.has(file)) ICON_FILE_CACHE.set(file, readFileSync(file))
      return ICON_FILE_CACHE.get(file)
    }
  }
  return ICONS[size] || ICONS[256]
}

/* ------------------------------------------------------------------ *
 * HTTP helpers
 * ------------------------------------------------------------------ */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function send(res, status, headers, body) {
  res.writeHead(status, { 'Access-Control-Allow-Origin': '*', ...headers })
  res.end(body)
}
function json(res, status, obj, extra = {}) {
  const body = Buffer.from(JSON.stringify(obj))
  send(res, status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': String(body.length),
    ...extra,
  }, body)
}
function ok(res, data) { return json(res, 200, { ok: true, data }) }
function fail(res, code, message, status = 502) {
  return json(res, status, { ok: false, error: message, code })
}
function staticFile(res, file, type) {
  if (!existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    return res.end('not found')
  }
  const body = readFileSync(file)
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'Content-Length': String(body.length),
  })
  return res.end(body)
}
async function readBody(req) {
  const chunks = []
  for await (const c of req) chunks.push(c)
  if (!chunks.length) return {}
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { return {} }
}
function recordCall(req, pathname, search) {
  calls.push({ at: Date.now(), method: req.method, path: pathname, search })
}

/* ------------------------------------------------------------------ *
 * API 路由
 * ------------------------------------------------------------------ */
function errMode(kind) {
  return cfg.errorMode === 'all' || cfg.errorMode === kind
}

async function handleApi(req, res, path, params) {
  if (cfg.slowMs > 0) await sleep(cfg.slowMs)

  switch (path) {
    case '/status': {
      if (errMode('status')) return fail(res, 'NETWORK', '无法连接全球电台服务（mock 故障）', 502)
      return ok(res, {
        service: 'ok',
        version: '1.0.0',
        upstream: cfg.upstream,
        seedCount: cfg.seedCount,
        hlsRuntime: !cfg.hlsMissing,
      })
    }

    case '/home': {
      if (errMode('home')) return fail(res, 'NETWORK', '无法连接全球电台服务（mock 故障）', 500)
      return ok(res, HOME())
    }

    case '/search': {
      if (errMode('search')) return fail(res, 'NETWORK', '搜索失败：上游不可用（mock）', 502)
      const q = (params.get('q') || '').trim().toLowerCase()
      const country = (params.get('country') || '').trim().toUpperCase()
      const tag = (params.get('tag') || '').trim().toLowerCase()
      const offset = Math.max(0, Number(params.get('offset') || 0) || 0)
      const limitRaw = Number(params.get('limit') || 48) || 48
      const limit = Math.max(1, Math.min(100, limitRaw))
      let items = CATALOG
      if (q) items = items.filter((s) => s.name.toLowerCase().includes(q))
      if (country && country !== 'ALL') items = items.filter((s) => s.countryCode === country)
      if (tag) items = items.filter((s) => s.tags.some((t) => t.includes(tag)))
      // 热门/过滤场景按 clicks 降序，稳定
      items = [...items].sort((a, b) => b.clicks - a.clicks || a.id.localeCompare(b.id))
      const page = items.slice(offset, offset + limit)
      return ok(res, {
        items: page,
        offset,
        limit,
        hasMore: offset + page.length < items.length,
        source: cfg.source,
      })
    }

    case '/alternates': {
      if (errMode('alternates')) return fail(res, 'NETWORK', '备用源查询失败（mock）', 502)
      const name = params.get('name') || 'Global Radio'
      const country = params.get('country') || ''
      if (cfg.fallbackMode === 'has-alt') {
        return ok(res, {
          items: [{
            id: 'mock:fallback-backup',
            name: '备用源 · ' + name,
            url: 'http://mock.local/stream/backup.mp3',
            logo: 'http://mock.local/logo/backup.png',
            country: country ? 'China' : '',
            countryCode: country || '',
            city: '',
            tags: ['backup'],
            codec: 'MP3',
            bitrate: 128,
            frequency: null,
            homepage: '',
            hls: false,
            votes: 0,
            clicks: 0,
          }],
        })
      }
      return ok(res, { items: [] })
    }

    case '/check': {
      const url = params.get('url') || ''
      const hls = /\.m3u8(?:\?|$)/i.test(url)
      if (!url) return fail(res, 'PROXY', '缺少 url 参数', 400)
      if (/broken|fail/i.test(url)) return ok(res, { ok: false, hls: false, reason: 'upstream unreachable' })
      return ok(res, {
        ok: true,
        hls,
        contentType: hls ? 'application/vnd.apple.mpegurl' : 'audio/mpeg',
        finalUrl: url,
        audioLike: !hls,
      })
    }

    case '/stream': {
      if (errMode('stream')) return fail(res, 'PROXY', '音频代理失败（mock）', 502)
      // 记录后走 WAV（Range 在调用方处理）
      return null
    }

    case '/hls': {
      if (errMode('hls')) return fail(res, 'PROXY', 'HLS 代理失败（mock）', 502)
      return null
    }

    case '/hls-runtime.js': {
      if (cfg.hlsMissing) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
        return res.end('hls runtime missing (mock)')
      }
      const body = Buffer.from(HLS_RUNTIME)
      return send(res, 200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=604800',
        'Content-Length': String(body.length),
      }, body)
    }

    case '/img': {
      if (cfg.imgFail) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        return res.end()
      }
      const url = params.get('url') || ''
      const body = svgPlaceholder(url)
      return send(res, 200, {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
        'Content-Length': String(body.length),
      }, body)
    }

    case '/icon': {
      const size = Number(params.get('size') || 256)
      const png = iconFor(size)
      return send(res, 200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=604800',
        'Content-Length': String(png.length),
      }, png)
    }

    default:
      return fail(res, 'NOT_FOUND', '接口不存在: ' + path, 404)
  }
}

/* ------------------------------------------------------------------ *
 * 路由
 * ------------------------------------------------------------------ */
const server = createServer(async (req, res) => {
  const u = new URL(req.url, 'http://127.0.0.1')
  const pathname = u.pathname

  /* 静态 */
  if (pathname === '/' || pathname === '/harness.html') {
    return staticFile(res, join(HERE, 'harness.html'), 'text/html; charset=utf-8')
  }
  if (pathname === '/client.js') {
    if (!existsSync(CLIENT)) {
      const msg = `/* client.js not found at ${CLIENT} — UI 尚未交付；harness 等待文件 */`
      res.writeHead(404, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' })
      return res.end(msg + '\nconsole.error("client.js not found")')
    }
    return staticFile(res, CLIENT, 'text/javascript; charset=utf-8')
  }
  if (pathname === '/react.js') {
    return staticFile(res, join(HERE, 'assets', 'react.js'), 'text/javascript; charset=utf-8')
  }
  if (pathname === '/react-dom.js') {
    return staticFile(res, join(HERE, 'assets', 'react-dom.js'), 'text/javascript; charset=utf-8')
  }
  if (pathname === '/favicon.ico') { res.writeHead(204); return res.end() }

  /* 测试控制面 */
  if (pathname === '/__health') {
    return json(res, 200, {
      ok: true,
      client: CLIENT,
      clientExists: existsSync(CLIENT),
      port: server.address()?.port ?? null,
    })
  }
  if (pathname === '/__config') {
    if (req.method === 'POST') {
      const patch = await readBody(req)
      Object.assign(cfg, patch)
    }
    return json(res, 200, { ...cfg, client: CLIENT, clientExists: existsSync(CLIENT) })
  }
  if (pathname === '/__calls') return json(res, 200, calls)
  if (pathname === '/__clearcalls') {
    calls = []
    return json(res, 200, { ok: true })
  }
  if (pathname === '/__reset') {
    calls = []
    Object.assign(cfg, DEFAULTS)
    return json(res, 200, { ok: true })
  }

  /* /stream（非 JSON，Range 在 serveWav 处理） */
  if (pathname === `${API}/stream`) {
    recordCall(req, pathname, u.search)
    if (errMode('stream')) return fail(res, 'PROXY', '音频代理失败（mock）', 502)
    if (cfg.fallbackMode && !/\/stream\/backup/.test(u.searchParams.get('url') || '')) {
      return fail(res, 'PROXY', '主源播放失败（mock）', 502)
    }
    if (!u.searchParams.get('url') && !u.searchParams.get('hls') && !u.searchParams.get('foreign')) {
      // client 必须把原始 url 传进代理；缺参数也算 PROXY 错误（契约 2.5）
      return fail(res, 'PROXY', '缺少 url 参数', 400)
    }
    return serveWav(req, res)
  }

  /* /hls（m3u8 或分片） */
  if (pathname === `${API}/hls`) {
    recordCall(req, pathname, u.search)
    if (errMode('hls')) return fail(res, 'PROXY', 'HLS 代理失败（mock）', 502)
    const raw = u.searchParams.get('url') || ''
    if (!raw) return fail(res, 'PROXY', '缺少 url 参数', 400)
    let target
    try { target = new URL(raw) } catch { return fail(res, 'PROXY', '非法 url', 400) }
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      return fail(res, 'PROXY', '仅允许 http/https', 400)
    }
    const isPlaylist = /mpegurl/i.test(String(target.pathname)) || /\.m3u8$/i.test(target.pathname)
    if (isPlaylist) return hlsM3u8(res, target.href)
    return hlsSegment(res, target.href)
  }

  /* /img、/icon 也走 API 记录 */
  if (pathname.startsWith(`${API}/`)) {
    recordCall(req, pathname, u.search)
    const path = pathname.slice(API.length) || '/'
    try {
      const handled = await handleApi(req, res, path, u.searchParams)
      if (handled !== null) return handled
    } catch (err) {
      return fail(res, 'INTERNAL', String(err?.message || err), 500)
    }
    if (!res.writableEnded) return fail(res, 'NOT_FOUND', 'not found', 404)
    return
  }

  return fail(res, 'NOT_FOUND', 'not found', 404)
})

server.listen(Number(process.env.GR_PORT) || 0, '127.0.0.1', () => {
  const { port } = server.address()
  console.log(JSON.stringify({
    port,
    client: CLIENT,
    clientExists: existsSync(CLIENT),
    wavBytes: WAV.length,
  }))
})
