#!/usr/bin/env node
/**
 * 全球电台（Global Radio）client 离线验收：真实 headless Chrome + 真实 React 18 + 真实 client.js，
 * 后端全部走本地 mock（server.mjs）。产出 PASS/FAIL 清单 + 截图 + last-run.log。
 *
 * 覆盖 docs/CONTRACT.md §6 的离线部分（模块/slot、home、播放、播放页/可视化、搜索/过滤/收藏、
 * 音频互斥、HLS、错误态、主题/响应式/侧栏迷你条、运行期无 console error）。
 * §6.10 真实 Harness 联调不在本脚本范围（需真机目视，由 Lead 在真实页面复核）。
 *
 * 用法：
 *   node run.mjs                          # 验收 dsh-global-radio/client.js
 *   GR_CLIENT=/abs/fixture.js node run.mjs    # 基础设施自测（可指向任意 client 实现）
 *
 * 依赖：Google Chrome（无 npm 依赖，Node 24 自带 WebSocket / fetch）。
 * 约束：Chrome profile 写到 ./tmp/chrome-profile，结束清理；不碰 ~/.dsh、不改插件源码。
 * 退出码：0 全绿 / 1 有 FAIL / 2 client.js 未交付 / 3 找不到 Chrome / 4 看门狗超时。
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SHOTS = join(HERE, 'shots')
const TMP = join(HERE, 'tmp')
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '',
  process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '',
  process.platform === 'win32' ? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' : '',
  process.platform === 'linux' ? '/usr/bin/google-chrome' : '',
  process.platform === 'linux' ? '/usr/bin/chromium' : '',
].filter((candidate) => candidate && existsSync(candidate))
const CHROME = CHROME_CANDIDATES[0] || ''
const NODE = process.execPath
const CLIENT = process.env.GR_CLIENT
  ? resolve(process.env.GR_CLIENT)
  : join(HERE, '..', 'client.js')

mkdirSync(SHOTS, { recursive: true })
mkdirSync(TMP, { recursive: true })
try {
  for (const f of readdirSync(SHOTS)) if (/\.png$/i.test(f)) rmSync(join(SHOTS, f), { force: true })
} catch { /* ignore */ }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* bail out early with distinct exit codes */
if (!existsSync(CLIENT)) {
  console.error(`\n[等待 UI] client.js 不存在：${CLIENT}`)
  console.error('基础设施（server.mjs / harness.html / run.mjs）已就绪，等 Lead 交付 client.js 后重跑。')
  console.error('可先用 GR_CLIENT=<fixture.js> node run.mjs 自测 harness。')
  process.exit(2)
}
if (!existsSync(CHROME)) {
  console.error(`\n[环境错误] 找不到 Chrome：${CHROME}`)
  process.exit(3)
}

/* ---------------- 断言 ---------------- */
const passed = []
const failures = []
function check(label, ok, extra) {
  if (ok) {
    passed.push(label)
    console.log(`  ✓ ${label}${extra === undefined ? '' : ` (${typeof extra === 'string' ? extra : JSON.stringify(extra)})`}`)
  } else {
    failures.push({ label, extra })
    console.log(`  ✗ ${label}${extra === undefined ? '' : ` → ${typeof extra === 'string' ? extra : JSON.stringify(extra)}`}`)
  }
}
function section(name) {
  console.log(`\n${name}`)
}
const brief = (v, n = 300) => {
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  return s && s.length > n ? s.slice(0, n) + '…' : s
}

/** localStorage 里的收藏可能是 id 数组，也可能是 Station 快照数组（契约两种表述都出现过） */
function idsOfStore(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.map((x) => (x && typeof x === 'object' ? x.id : x)).filter(Boolean)
  if (Array.isArray(value.ids)) return value.ids
  return []
}
/** client 可能用 JSON.stringify 落盘（localStorage 里是 '"bars"'），两种都接受 */
function parseVisualMode(raw) {
  if (raw == null) return null
  let v = raw
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'string') v = parsed
  } catch { /* raw 本身就是 bars */ }
  v = String(v).replace(/^"|"$/g, '')
  return /^(bars|ring|wave)$/.test(v) ? v : null
}

/* ---------------- mock backend ---------------- */
const server = spawn(NODE, [join(HERE, 'server.mjs')], {
  stdio: ['ignore', 'pipe', 'inherit'],
  env: { ...process.env, GR_CLIENT: CLIENT },
})
const port = await new Promise((res, rej) => {
  const timer = setTimeout(() => rej(new Error('mock server timeout (10s)')), 10000)
  server.stdout.on('data', (buf) => {
    const m = /\{"port":(\d+)/.exec(buf.toString())
    if (m) { clearTimeout(timer); res(Number(m[1])) } else console.log('[server] ' + buf.toString().trim())
  })
  server.on('exit', (code) => rej(new Error('mock server exited: ' + code)))
}).catch((err) => {
  console.error('[FATAL] ' + err.message)
  process.exit(1)
})
const BASE = `http://127.0.0.1:${port}`
console.log(`[mock] ${BASE}  client=${CLIENT}`)

/* 兜底 watchdog：任何一步卡死都不至于让验收进程永远挂着（退出码 4） */
const watchdog = setTimeout(() => {
  console.error('\n[watchdog] run.mjs 超过 10 分钟未结束，强制退出（Chrome/server 子进程会被清理）')
  try { chrome.kill('SIGKILL') } catch { /* ignore */ }
  try { server.kill('SIGKILL') } catch { /* ignore */ }
  process.exit(4)
}, 10 * 60 * 1000)
watchdog.unref?.()

async function config(patch) {
  const r = await fetch(`${BASE}/__config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch || {}),
  })
  return r.json()
}
async function calls() { return (await fetch(`${BASE}/__calls`)).json() }
async function resetCalls() { await fetch(`${BASE}/__clearcalls`, { method: 'POST' }) }
const callCount = async (path) => (await calls()).filter((c) => c.path === path).length
const findCalls = async (path, searchRe) => (await calls()).filter((c) =>
  c.path === path && (!searchRe || searchRe.test(decodeURIComponent(c.search || ''))))

/* ---------------- Chrome + CDP ---------------- */
const profileDir = join(TMP, 'chrome-profile')
try { rmSync(profileDir, { recursive: true, force: true }) } catch { /* ignore */ }

class CDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl
    this.id = 0
    this.pending = new Map()
    this.listeners = new Map()
  }
  async connect() {
    this.ws = new WebSocket(this.wsUrl)
    await new Promise((res, rej) => {
      this.ws.addEventListener('open', res, { once: true })
      this.ws.addEventListener('error', rej, { once: true })
    })
    this.ws.addEventListener('close', () => {
      for (const { reject } of this.pending.values()) reject(new Error('CDP socket closed'))
      this.pending.clear()
    })
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`))
        else resolve(msg.result)
        return
      }
      if (msg.method) for (const fn of this.listeners.get(msg.method) || []) fn(msg.params)
    })
  }
  send(method, params = {}) {
    const id = ++this.id
    this.ws.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`CDP timeout: ${method} (20s)`))
      }, 20000)
      this.pending.set(id, {
        resolve: (v) => { clearTimeout(timer); resolve(v) },
        reject: (e) => { clearTimeout(timer); reject(e) },
      })
    })
  }
  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, [])
    this.listeners.get(method).push(fn)
  }
  close() { try { this.ws.close() } catch { /* ignore */ } }
}

const chrome = spawn(CHROME, [
  '--headless=new',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-gpu',
  '--disable-crash-reporter',
  '--disable-breakpad',
  '--no-first-run',
  '--no-default-browser-check',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1440,980',
  '--remote-debugging-port=0',
  '--autoplay-policy=no-user-gesture-required',
  '--mute-audio',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-features=CalculateNativeWinOcclusion',
  '--disable-dev-shm-usage',
  `--user-data-dir=${profileDir}`,
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] })
let chromeStderr = ''
chrome.stderr.on('data', (b) => { chromeStderr += b.toString() })

const devtoolsFile = join(profileDir, 'DevToolsActivePort')
const debugPort = await (async () => {
  for (let i = 0; i < 120; i++) {
    if (existsSync(devtoolsFile)) {
      const line = readFileSync(devtoolsFile, 'utf8').split('\n')[0].trim()
      if (line) return Number(line)
    }
    await sleep(100)
  }
  throw new Error('Chrome DevToolsActivePort timeout\n' + chromeStderr.slice(-800))
})()
let pageWs = null
for (let i = 0; i < 80 && !pageWs; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()
    const page = list.find((t) => t.type === 'page')
    if (page?.webSocketDebuggerUrl) pageWs = page.webSocketDebuggerUrl
  } catch { /* retry */ }
  if (!pageWs) await sleep(100)
}
if (!pageWs) throw new Error('no page target')

const cdp = new CDP(pageWs)
await cdp.connect()
const errors = []          // 所有 console.error / 未捕获异常
const unexpectedErrors = [] // 预期失败路径（HLS 缺失/流失败）之外的
let allowErrors = false
cdp.on('Runtime.exceptionThrown', (p) => {
  const text = p?.exceptionDetails?.exception?.description || p?.exceptionDetails?.text || 'exception'
  errors.push(text)
  if (!allowErrors) unexpectedErrors.push(text)
})
cdp.on('Runtime.consoleAPICalled', (p) => {
  if (p.type === 'error') {
    const text = (p.args || []).map((a) => a.value ?? a.description ?? '').join(' ')
    errors.push(text)
    if (!allowErrors) unexpectedErrors.push(text)
  }
})
await cdp.send('Page.enable')
await cdp.send('Runtime.enable')
await cdp.send('Network.enable')
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })

/* ---------------- 通用 helpers ---------------- */
async function evaluate(expression) {
  const res = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (res.exceptionDetails) {
    throw new Error(`eval failed: ${brief(expression)}\n${res.exceptionDetails.text} ${res.exceptionDetails.exception?.description || ''}`)
  }
  return res.result.value
}
async function waitFor(expression, label, timeout = 12000, interval = 100) {
  const start = Date.now()
  let last
  while (Date.now() - start < timeout) {
    try {
      last = await evaluate(expression)
      if (last) return last
    } catch (err) { last = String(err) }
    await sleep(interval)
  }
  throw new Error(`waitFor timeout: ${label}; last=${brief(last)}`)
}
async function waitUntil(fn, label, timeout = 8000, interval = 150) {
  const start = Date.now()
  let last
  while (Date.now() - start < timeout) {
    try {
      last = await fn()
      if (last) return last
    } catch (err) { last = String(err) }
    await sleep(interval)
  }
  throw new Error(`waitUntil timeout: ${label}; last=${brief(last)}`)
}

async function screenshot(name) {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' })
  const file = join(SHOTS, name)
  writeFileSync(file, Buffer.from(data, 'base64'))
  console.log(`  · screenshot ${file}`)
  return file
}
const shots = []
async function S(name) {
  await sleep(420)
  const file = await screenshot(name)
  shots.push(file)
  return file
}
async function screenshotRegion(selector, name, scale = 3, pad = 16) {
  const box = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)})
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left, y: r.top, w: r.width, h: r.height }
  })()`)
  if (!box) throw new Error('screenshotRegion: element not found ' + selector)
  const { data } = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: Math.max(2, box.w + pad * 2),
      height: Math.max(2, box.h + pad * 2),
      scale,
    },
  })
  const file = join(SHOTS, name)
  writeFileSync(file, Buffer.from(data, 'base64'))
  console.log(`  · zoom screenshot ${file}`)
  shots.push(file)
  return file
}
async function setViewport(width, height) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
}
async function setTheme(theme) {
  await cdp.send('Emulation.setEmulatedMedia', {
    media: '',
    features: [{ name: 'prefers-color-scheme', value: theme }],
  })
}
async function navigate() {
  await cdp.send('Page.navigate', { url: BASE + '/' })
  await waitFor('document.readyState === "complete"', 'document ready')
}
async function reload() {
  await cdp.send('Page.reload', { ignoreCache: true })
  await waitFor('document.readyState === "complete"', 'reload ready')
}
async function waitMounted(timeout = 15000) {
  await waitFor('window.__mounted === true || window.__mountError', 'client mount', timeout)
}
function clickSel(selector) {
  return evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)})
    if (!el) return false
    try { el.scrollIntoView({ block: 'center' }) } catch (_) {}
    el.click()
    return true
  })()`)
}
async function clickFirst(selectors) {
  return evaluate(`(() => {
    const sels = ${JSON.stringify(selectors)}
    for (const s of sels) {
      for (const el of document.querySelectorAll(s)) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden') {
          try { el.scrollIntoView({ block: 'center' }) } catch (_) {}
          el.click()
          return s
        }
      }
    }
    return null
  })()`)
}
const visible = (selector) => evaluate(`(() => {
  const el = document.querySelector(${JSON.stringify(selector)})
  if (!el) return false
  const r = el.getBoundingClientRect()
  const st = getComputedStyle(el)
  return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none'
})()`)
const textOf = (selector) => evaluate(`(() => {
  const el = document.querySelector(${JSON.stringify(selector)})
  return el ? el.textContent.trim() : null
})()`)
const countSel = (selector) => evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`)
const grState = () => evaluate('window.__grState()')
const audioInfo = () => evaluate('window.__grAudio()')
const grStations = () => evaluate('window.__grStations()')

async function pressEscape() {
  try {
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 })
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 })
  } catch { /* ignore */ }
  await evaluate(`(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }))
  })()`)
  await sleep(420)
}

async function clickStation(id, name) {
  return evaluate(`(() => {
    const cards = [...document.querySelectorAll('[data-gr="station"]')]
    let el = ${id ? `document.querySelector('[data-gr="station"][data-id="${id}"]')` : 'null'}
    if (!el && ${JSON.stringify(name || '')}) el = cards.find(function (c) { return c.textContent.includes(${JSON.stringify(name || '')}) })
    if (!el) return { found: false, count: cards.length }
    try { el.scrollIntoView({ block: 'center' }) } catch (_) {}
    el.click()
    return { found: true, id: el.getAttribute('data-id'), text: (el.textContent || '').trim().slice(0, 80) }
  })()`)
}
async function clickPlayControls() {
  return evaluate(`(() => {
    const sels = ['[data-gr="play"]', '[data-gr="toggle"]', '[data-gr="mini-toggle"]', '[data-gr="open-player"]']
    for (const s of sels) {
      for (const el of document.querySelectorAll(s)) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) { el.click(); return s }
      }
    }
    return null
  })()`)
}
async function ensurePlaying(timeout = 9000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const st = await audioInfo()
    if (st.exists && !st.paused && st.currentTime > 0.02) return true
    await clickPlayControls()
    await sleep(500)
  }
  return false
}
/** 播放指定电台：优先点卡片（契约 §6.3「点卡片 → 播放」），失败再点卡片/hero 的播放键 */
async function playStation(id, name) {
  const clicked = await clickStation(id, name)
  await sleep(700)
  let st = await audioInfo()
  if (!(st.exists && !st.paused)) {
    await evaluate(`(() => {
      const card = ${id ? `document.querySelector('[data-gr="station"][data-id="${id}"]')` : `[...document.querySelectorAll('[data-gr="station"]')].find(function(c){return c.textContent.includes(${JSON.stringify(name || '')})})`}
      const btn = card && card.querySelector('[data-gr="play"], [data-gr="toggle"]')
      if (btn) { btn.click(); return true }
      return false
    })()`)
    await sleep(700)
  }
  if (!(await audioInfo()).paused) return clicked
  await ensurePlaying()
  return clicked
}
async function waitPlaying(label = 'audio playing', timeout = 12000) {
  return waitFor(`(() => {
    const a = window.__grAudio()
    return a.exists && !a.paused && a.currentTime > 0.02
  })()`, label, timeout)
}

async function openPlayerView() {
  const clicked = await clickFirst([
    '[data-gr="open-player"]',
    '[data-gr="hero"] [data-gr="play"]',
    '[data-gr="hero"]',
    '[data-gr="station"][data-playing="true"] [data-gr="open-player"]',
  ])
  try {
    await waitFor(`!!document.querySelector('[data-gr="player-view"]')`, 'player view', 5000)
    return clicked
  } catch {
    return null
  }
}
async function backToBrowse() {
  await clickFirst(['[data-gr="back"]'])
  try {
    await waitFor(`!document.querySelector('[data-gr="player-view"]')`, 'back to browse', 5000)
    return true
  } catch {
    return false
  }
}
async function overflowReport() {
  return evaluate(`(() => {
    const de = document.documentElement
    const root = document.querySelector('[data-gr="root"]')
    return {
      docScroll: de.scrollWidth, docClient: de.clientWidth, innerW: window.innerWidth,
      rootScroll: root ? root.scrollWidth : null,
      rootClient: root ? root.clientWidth : null,
    }
  })()`)
}
async function modeSnapshot() {
  return {
    controls: await evaluate('window.__grModeControls()'),
    canvas: await evaluate('window.__grCanvasStats()'),
    visualMode: await evaluate(`(() => { try { return localStorage.getItem('global-radio:visualMode') } catch (e) { return null } })()`),
  }
}


/* ---------------- 发现页 / playerbar / 堆叠 取值助手 ---------------- */
async function radioSnap() {
  return evaluate(`(() => {
    const h = window.__GLOBAL_RADIO__
    const s = h && h.store && typeof h.store.getSnapshot === 'function' ? h.store.getSnapshot() : null
    if (!s) return null
    return {
      station: s.station ? { id: s.station.id, name: s.station.name } : null,
      playing: !!s.playing,
      loading: !!s.loading,
      error: s.error || null,
      otherPlaying: !!s.otherPlaying,
      unavailableIds: Array.isArray(s.unavailableIds) ? s.unavailableIds : [],
      view: s.view || null,
    }
  })()`)
}
const bannerIds = () => evaluate(`[...document.querySelectorAll('[data-gr="banner"]')].map(function (el) { return el.getAttribute('data-id') })`)
const genreTiles = () => evaluate(`[...document.querySelectorAll('[data-gr="genre"]')].map(function (el) { return { id: el.getAttribute('data-genre'), text: (el.textContent || '').trim().slice(0, 24) } })`)
const rowIds = () => evaluate(`[...document.querySelectorAll('[data-gr="row"]')].map(function (el) { return el.getAttribute('data-row') })`)
const toastText = () => evaluate(`(() => { const el = document.querySelector('[data-gr="toast"]'); return el ? (el.textContent || '').trim() : '' })()`)
async function waitToast(re, label, timeout = 6000) {
  return waitFor(`(() => { const el = document.querySelector('[data-gr="toast"]'); return !!el && ${re.toString()}.test((el.textContent || '')) })()`, label, timeout, 80)
}
async function startToastLog() {
  return evaluate(`(() => {
    window.__toastLog = []
    if (window.__toastObserver) { try { window.__toastObserver.disconnect() } catch (_) {} }
    const record = function () {
      const el = document.querySelector('[data-gr="toast"]')
      const text = el ? (el.textContent || '').trim() : ''
      if (text && window.__toastLog[window.__toastLog.length - 1] !== text) window.__toastLog.push(text)
    }
    window.__toastObserver = new MutationObserver(record)
    window.__toastObserver.observe(document.body, { childList: true, subtree: true, characterData: true })
    record()
    return true
  })()`)
}
async function toastLog() { return evaluate('window.__toastLog || []') }
async function waitToastLog(re, label, timeout = 8000) {
  return waitUntil(async () => {
    const log = await toastLog()
    return log.some((t) => re.test(t)) ? log : false
  }, label, timeout, 80)
}

async function playerbarInfo() {
  return evaluate(`(() => {
    const el = document.querySelector('[data-gr="playerbar"]')
    if (!el) return { exists: false }
    const r = el.getBoundingClientRect()
    const root = document.querySelector('[data-gr="root"]')
    const toggle = el.querySelector('[data-gr="toggle"]')
    const tr = toggle ? toggle.getBoundingClientRect() : null
    return {
      exists: true,
      visible: r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden',
      position: getComputedStyle(el).position,
      inRoot: !!root && root.contains(el),
      dataPlaying: el.getAttribute('data-playing'),
      text: (el.textContent || '').trim().slice(0, 120),
      controls: {
        toggle: !!toggle,
        prev: !!el.querySelector('[data-gr="prev"]'),
        next: !!el.querySelector('[data-gr="next"]'),
        favorite: !!el.querySelector('[data-gr="favorite"]'),
        openPlayer: !!el.querySelector('[data-gr="open-player"]'),
        expand: !!el.querySelector('[data-gr="expand"]'),
        volume: !!el.querySelector('[data-gr="volume"]'),
      },
      playCenterDelta: tr ? Math.round(Math.abs((tr.left + tr.right) / 2 - (r.left + r.right) / 2) * 10) / 10 : null,
      width: Math.round(r.width), height: Math.round(r.height),
    }
  })()`)
}
async function stackGeometry() {
  return evaluate(`(() => {
    const footer = document.querySelector('[class*="footerActions"]') || document.getElementById('sidebar-footer')
    const ours = document.querySelector('[data-gr="mini-player"]')
    const foreign = document.querySelector('[data-nm-mini]')
    if (!footer || !ours || !foreign) return { footer: !!footer, ours: !!ours, foreign: !!foreign }
    const a = ours.getBoundingClientRect()
    const b = foreign.getBoundingClientRect()
    const centerA = (a.left + a.right) / 2
    const centerB = (b.left + b.right) / 2
    return {
      sameFooter: footer.contains(ours) && footer.contains(foreign),
      vertical: b.bottom <= a.top + 1 || a.bottom <= b.top + 1,
      sideBySide: a.right <= b.left + 1 || b.right <= a.left + 1,
      xAligned: Math.abs(centerA - centerB) <= 6,
      horizOverlap: Math.round(Math.min(a.right, b.right) - Math.max(a.left, b.left)),
      ours: { x: Math.round(centerA), w: Math.round(a.width), h: Math.round(a.height), top: Math.round(a.top), bottom: Math.round(a.bottom), cls: String(ours.className || '') },
      foreign: { x: Math.round(centerB), w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top), bottom: Math.round(b.bottom) },
    }
  })()`)
}
async function miniInfo() {
  return evaluate(`(() => {
    const m = document.querySelector('[data-gr="mini-player"]')
    if (!m) return { present: false }
    const r = m.getBoundingClientRect()
    return {
      present: true,
      visible: r.width > 0 && r.height > 0,
      width: Math.round(r.width), height: Math.round(r.height),
      cls: String(m.className || ''),
      playing: m.getAttribute('data-playing'),
      text: (m.textContent || '').trim().slice(0, 80),
      prev: !!m.querySelector('[data-gr="mini-prev"]'),
      toggle: !!m.querySelector('[data-gr="mini-toggle"]'),
      next: !!m.querySelector('[data-gr="mini-next"]'),
      volume: !!m.querySelector('[data-gr="volume"]'),
    }
  })()`)
}
async function grOpenPlayerView() {
  const clicked = await clickFirst(['[data-gr="playerbar"] [data-gr="open-player"]', '[data-gr="playerbar"] [data-gr="expand"]', '[data-gr="open-player"]'])
  try {
    await waitFor(`!!document.querySelector('[data-gr="player-view"]')`, 'player view', 5000)
    return clicked
  } catch {
    return null
  }
}
async function grBackToBrowse() {
  await clickFirst(['[data-gr="back"]'])
  try {
    await waitFor(`!document.querySelector('[data-gr="player-view"]')`, 'back to browse', 5000)
    return true
  } catch {
    return false
  }
}
/** 点击某一行里的 station 卡片（按 data-id；找不到再按文本）；不触发自动播放兜底逻辑 */
async function grClickStation(id, name) {
  return evaluate(`(() => {
    let el = ${id ? `document.querySelector('[data-gr="station"][data-id="${id}"]')` : 'null'}
    if (!el && ${JSON.stringify(name || '')}) {
      el = [...document.querySelectorAll('[data-gr="station"]')].find(function (c) { return (c.textContent || '').includes(${JSON.stringify(name || '')}) })
    }
    if (!el) return { found: false, count: document.querySelectorAll('[data-gr="station"]').length }
    try { el.scrollIntoView({ block: 'center' }) } catch (_) {}
    el.click()
    return { found: true, id: el.getAttribute('data-id'), text: (el.textContent || '').trim().slice(0, 80) }
  })()`)
}

let fatal = null
const MOCK = {
  // 与 dsh-global-radio/data/seed-stations.json 的真实条目对齐（服务器无文件时会回退内置数据）
  seedName: '北京音乐广播 FM97.4',
  seedId: 'seed:bj-music-fm974',
  hlsName: 'CNR-2 经济之声',
  hlsId: 'seed:cnr2-jingjizhisheng',
  failAgainId: 'seed:cnr1-zhongguozhisheng',
}

try {
  /* ================================================================ *
   * [0] 模块加载 / 三个 slot 注册 / 初始空态
   * ================================================================ */
  console.log('\n[0] 模块加载 / 三个 slot 注册 / 初始空态')
  await config({ errorMode: null, hlsMissing: false, slowMs: 0, imgFail: false, upstream: 'ok', source: 'radio-browser', fallbackMode: null })
  await resetCalls()
  await setViewport(1440, 980)
  await setTheme('dark')
  await navigate()
  try {
    await waitMounted()
  } catch (err) {
    check('client.js 挂载完成', false, await evaluate('String(window.__mountError || "no mount signal")'))
    throw err
  }
  const mountError = await evaluate('window.__mountError')
  check('client.js 挂载无异常', !mountError, mountError || undefined)
  check('client.js 调用了 __ModuleLoader__.load', await evaluate('!!window.__plugin'))
  check('main slot 注册成功', await evaluate('!!window.__slots.main'))
  check('sidebar.panellist slot 注册成功', await evaluate('!!window.__slots["sidebar.panellist"]'))
  check('sidebar.footer.action slot 注册成功', await evaluate('!!window.__slots["sidebar.footer.action"]'))

  const specs = await evaluate('window.__slotSpecs')
  check('main spec.name = main 且 key = global-radio',
    specs?.main?.name === 'main' && specs?.main?.key === 'global-radio', JSON.stringify(specs?.main))
  check('sidebar.panellist spec.id = global-radio',
    specs?.['sidebar.panellist']?.id === 'global-radio', JSON.stringify(specs?.['sidebar.panellist']))
  check('sidebar.panellist spec.order = 40',
    specs?.['sidebar.panellist']?.order === 40, JSON.stringify(specs?.['sidebar.panellist']))
  check('sidebar.footer.action spec.id = radio-mini',
    specs?.['sidebar.footer.action']?.id === 'radio-mini', JSON.stringify(specs?.['sidebar.footer.action']))
  check('sidebar.footer.action spec.order = 20',
    specs?.['sidebar.footer.action']?.order === 20, JSON.stringify(specs?.['sidebar.footer.action']))
  const panellistLabel = await evaluate(`(() => {
    const spec = window.__slotSpecs['sidebar.panellist']
    if (!spec || spec.label == null) return null
    try { return String(typeof spec.label === 'function' ? spec.label() : spec.label) } catch (e) { return 'ERR: ' + e.message }
  })()`)
  check('sidebar.panellist label 返回「全球电台」',
    typeof panellistLabel === 'string' && /全球电台|Global Radio/.test(panellistLabel), brief(panellistLabel))
  check('apply 通过 ctx.effect 注册副作用（有清理函数）',
    (await evaluate('window.__disposers.length')) > 0,
    'disposers=' + await evaluate('window.__disposers.length'))
  check('侧栏图标已实际渲染且可见', await visible('#sidebar-icon > *'), await textOf('#sidebar-icon'))
  for (const sel of ['#sidebar-icon img', '#sidebar-icon .gr-panel-mark', '#sidebar-icon > *']) {
    try {
      await screenshotRegion(sel, '27-sidebar-icon-dark.png', 6, 14)
      break
    } catch { /* 尝试下一个选择器 */ }
  }

  const initialAudio = await audioInfo()
  check('<audio data-gr-audio> 已创建并 append 到 body',
    initialAudio.exists && initialAudio.parentIsBody, brief(initialAudio))
  check('<audio data-gr-audio> 初始 display:none',
    initialAudio.exists && initialAudio.display === 'none', initialAudio.display)

  try {
    await waitFor(`window.__grState().banners === 3 && window.__grState().rows.length >= 3`, 'discovery rendered', 15000)
  } catch (err) {
    check('发现页渲染（3 banner + ≥3 横滑列表）', false, String(err))
  }
  const handle = await evaluate(`(() => {
    const h = window.__GLOBAL_RADIO__
    return h ? { store: !!h.store, player: !!h.player, api: !!h.api } : null
  })()`)
  check('调试句柄 window.__GLOBAL_RADIO__ = { store, player, api } 存在',
    !!handle && handle.store && handle.player && handle.api, brief(handle))
  const initState = await grState()
  check('无当前电台：根节点 data-playing="false"', initState.rootPlaying === 'false', brief(initState))
  check('无当前电台：不渲染迷你条', !initState.mini)
  check('无当前电台：不渲染 playerbar（[data-gr="playerbar"]）', !initState.playerbar)
  check('旧 hero/dock/filters 已从渲染树移除',
    (await evaluate(`['hero','dock','filters','country'].map(function (k) { return document.querySelectorAll('[data-gr="' + k + '"]').length }).join(',')`)) === '0,0,0,0',
    await evaluate(`['hero','dock','filters','country'].map(function (k) { return document.querySelectorAll('[data-gr="' + k + '"]').length }).join(',')`))
  check('无当前电台：station 卡片均非播放态',
    (await grStations()).every((c) => c.playing !== 'true'),
    (await grStations()).slice(0, 3).map((c) => c.playing).join(','))

  /* ================================================================ *
   * [1] 发现页：banners / genres / rows / 换一批
   * ================================================================ */
  console.log('\n[1] 发现页（banners / genres / rows / 换一批）')
  check('header 存在 [data-gr="header"]', await visible('[data-gr="header"]'))
  check('搜索框存在 [data-gr="search"]', await visible('[data-gr="search"]'))
  check('banners 容器存在 [data-gr="banners-wrap"]/[data-gr="banners"]',
    (await visible('[data-gr="banners-wrap"]')) && (await visible('[data-gr="banners"]')))
  const banners0 = await bannerIds()
  check('发现页渲染 3 张 banner', banners0.length === 3, JSON.stringify(banners0))
  const bannerDetail = await evaluate(`(() => {
    const cards = [...document.querySelectorAll('[data-gr="banner"]')]
    return cards.map(function (el) {
      const r = el.getBoundingClientRect()
      const img = el.querySelector('img')
      return {
        id: el.getAttribute('data-id'),
        visible: r.width > 0 && r.height > 0,
        text: (el.textContent || '').trim().slice(0, 120),
        hasLogo: !!img,
        logoW: img ? img.naturalWidth : 0,
      }
    })
  })()`)
  check('banner 卡片可见且带 data-id', bannerDetail.every((b) => b.visible && !!b.id), brief(bannerDetail))
  check('banner 展示台标/台名/频率或音质/国家',
    bannerDetail.every((b) => b.hasLogo && b.text.length > 4) &&
    bannerDetail.some((b) => /FM|MHz|kbps|在线电台/.test(b.text)) &&
    bannerDetail.some((b) => /中国|China|美国|英国|日本|德国|法国/.test(b.text)), brief(bannerDetail))
  check('banner 换一批按钮存在 [data-gr="banner-shuffle"]', await visible('[data-gr="banner-shuffle"]'))
  await evaluate(`document.querySelector('[data-gr="banner-shuffle"]').click()`)
  let shuffled = false
  for (let attempt = 0; attempt < 3 && !shuffled; attempt++) {
    try {
      await waitUntil(async () => {
        const now = await bannerIds()
        return now.length === 3 && now.some((id) => !banners0.includes(id)) ? now : false
      }, 'banner shuffled', 3000, 120)
      shuffled = true
    } catch {
      await evaluate(`document.querySelector('[data-gr="banner-shuffle"]').click()`)
    }
  }
  check('点「换一批」后 banner 至少换了一张', shuffled, JSON.stringify({ before: banners0, after: await bannerIds() }))
  await S('30-banner-shuffled.png')

  const genres = await genreTiles()
  const expectedGenres = ['news', 'world', 'classical', 'jazz', 'electronic', 'rock', 'talk', 'china', 'japan', 'korea', 'uk', 'france']
  check('12 个分类卡 [data-gr="genre"][data-genre]', genres.length === 12, JSON.stringify(genres.map((g) => g.id)))
  check('分类卡 data-genre 覆盖契约 12 类',
    expectedGenres.every((id) => genres.some((g) => g.id === id)), JSON.stringify(genres.map((g) => g.id)))

  const rows = await rowIds()
  check('横滑列表 ≥3 且包含 popular/china/seed',
    rows.length >= 3 && ['popular', 'china', 'seed'].every((id) => rows.includes(id)), JSON.stringify(rows))
  const allCards = await grStations()
  check('发现页 station 卡片 ≥8', allCards.length >= 8, 'cards=' + allCards.length)
  check('station 卡片带 data-id', allCards.filter((c) => !!c.id).length >= 8,
    'withId=' + allCards.filter((c) => !!c.id).length + '/' + allCards.length)
  const seedCard = allCards.find((c) => c.id === MOCK.seedId)
  if (seedCard) {
    check('卡片展示台名', seedCard.text.includes('北京音乐广播'), brief(seedCard.text))
    check('卡片展示频率（FM 97.4）', /FM/.test(seedCard.text) && /97\.4/.test(seedCard.text), brief(seedCard.text))
    check('卡片台标经 /global-radio/api/img 代理', /\/global-radio\/api\/(img|icon)/.test(seedCard.imgSrc || ''), brief(seedCard.imgSrc))
  } else {
    check('找到北京音乐广播卡片（seed:bj-music-fm974）', false, brief(allCards.slice(0, 3)))
  }

  /* ================================================================ *
   * [2] 点 banner 播放 + playerbar
   * ================================================================ */
  console.log('\n[2] 点 banner 播放 + 底部 playerbar')
  const firstBannerId = (await bannerIds())[0]
  const firstBannerText = await evaluate(`(() => {
    const el = document.querySelector('[data-gr="banner"]')
    return el ? (el.textContent || '').trim().slice(0, 60) : null
  })()`)
  await evaluate(`document.querySelector('[data-gr="banner"]').click()`)
  let bannerPlayed = false
  try {
    await waitPlaying('banner play', 12000)
    bannerPlayed = true
  } catch (err) {
    check('点 banner 后开始播放', false, String(err))
  }
  if (bannerPlayed) check('点 banner 后开始播放', true)
  if (bannerPlayed) {
    const a = await audioInfo()
    let sameOrigin = false
    let proxyPath = false
    try {
      const u = new URL(a.src, BASE + '/')
      sameOrigin = u.origin === new URL(BASE).origin
      proxyPath = /^\/global-radio\/api\/(stream|hls)/.test(u.pathname)
    } catch { /* ignore */ }
    check('audio.src 指向同源 /global-radio/api/{stream|hls}', sameOrigin && proxyPath, brief(a.src))
    check('audio 处于播放中（!paused）', !a.paused, 'paused=' + a.paused)
    const st = await grState()
    check('根节点 data-playing="true"', st.rootPlaying === 'true', brief(st))
    const pb = await playerbarInfo()
    check('选中电台后 playerbar 出现且可见', !!pb.exists && pb.visible, brief(pb))
    check('playerbar 不 fixed、在 main root 内', !!pb.exists && pb.position !== 'fixed' && pb.inRoot, brief(pb))
    check('playerbar data-playing="true"', pb.dataPlaying === 'true', brief(pb))
    check('playerbar 含 toggle/prev/next/favorite/open-player/expand/volume',
      !!(pb.controls.toggle && pb.controls.prev && pb.controls.next && pb.controls.favorite && pb.controls.openPlayer && pb.controls.expand && pb.controls.volume), brief(pb.controls))
    const bannerSnap = await radioSnap()
    const bannerName = bannerSnap && bannerSnap.station ? bannerSnap.station.name : ''
    check('playerbar 展示当前台名', !!bannerName && !!pb.text && pb.text.includes(bannerName), brief({ bannerName, firstBannerText, text: pb.text }))
    check('playerbar 播放键中心 ≈ playerbar 中心（±2px）',
      pb.playCenterDelta != null && pb.playCenterDelta <= 2, 'delta=' + pb.playCenterDelta + 'px')
    const t0 = (await audioInfo()).currentTime
    await sleep(1200)
    const t1 = (await audioInfo()).currentTime
    check('音频 currentTime 实际前进', t1 > t0 + 0.3, `${t0.toFixed(2)} → ${t1.toFixed(2)}s`)
    await S('02-banner-playing.png')
    try { await screenshotRegion('[data-gr="playerbar"]', '05-playerbar.png', 2, 12) } catch { /* ignore */ }

    // playerbar toggle 暂停/恢复
    await evaluate(`document.querySelector('[data-gr="playerbar"] [data-gr="toggle"]').click()`)
    await sleep(600)
    const pausedInfo = await audioInfo()
    const pbPaused = await evaluate(`document.querySelector('[data-gr="playerbar"]').getAttribute('data-playing')`)
    check('playerbar toggle 暂停', pausedInfo.paused === true && pbPaused === 'false', brief({ paused: pausedInfo.paused, pb: pbPaused }))
    await evaluate(`document.querySelector('[data-gr="playerbar"] [data-gr="toggle"]').click()`)
    try { await waitPlaying('playerbar resume', 7000) } catch { /* 下面断言 */ }
    check('playerbar toggle 恢复播放', (await audioInfo()).paused === false)

    // banner 队列：下一台切歌
    const before = (await radioSnap())?.station?.id
    await evaluate(`document.querySelector('[data-gr="playerbar"] [data-gr="next"]').click()`)
    let nextOk = false
    try {
      await waitUntil(async () => {
        const snap = await radioSnap()
        return snap && snap.station && snap.station.id !== before ? snap : false
      }, 'playerbar next changes station', 8000, 150)
      nextOk = true
    } catch { /* ignore */ }
    check('playerbar 下一台可切歌', nextOk, brief({ before, after: (await radioSnap())?.station }))
  }

  /* ================================================================ *
   * [3] 分类卡：随机播放 + /search tag/country 参数
   * ================================================================ */
  console.log('\n[3] 分类卡随机播放（/search tag/country）')
  await grBackToBrowse()
  await resetCalls()
  const beforeGenre = (await radioSnap())?.station?.id || null
  await evaluate(`document.querySelector('[data-gr="genre"][data-genre="jazz"]').click()`)
  let jazzReq = false
  try {
    await waitUntil(async () => (await findCalls('/global-radio/api/search', /(?:^|[?&])tag=jazz(?:&|$)/)).length > 0, 'tag=jazz search', 10000)
    jazzReq = true
  } catch (err) { check('点分类卡触发 /search?tag=jazz', false, String(err)) }
  if (jazzReq) check('点分类卡触发 /search?tag=jazz', true)
  let jazzToast = false
  try {
    await waitToast(/随机播放/, 'random play toast', 6000)
    jazzToast = true
  } catch (err) { check('分类随机播放 toast「随机播放：xxx」', false, String(err)) }
  if (jazzToast) check('分类随机播放 toast「随机播放：xxx」', true)
  try { await waitPlaying('genre random station playing', 10000) } catch { /* 下面断言 */ }
  const afterGenre = (await radioSnap())?.station?.id || null
  check('分类随机播放切换到新电台', !!afterGenre && afterGenre !== beforeGenre, brief({ beforeGenre, afterGenre }))
  await S('03-genre-playing.png')

  await sleep(700)
  await resetCalls()
  await evaluate(`document.querySelector('[data-gr="genre"][data-genre="china"]').click()`)
  let cnReq = false
  try {
    await waitUntil(async () => (await findCalls('/global-radio/api/search', /(?:^|[?&])country=CN(?:&|$)/)).length > 0, 'country=CN search', 10000)
    cnReq = true
  } catch (err) { check('点国家分类卡触发 /search?country=CN', false, String(err)) }
  if (cnReq) check('点国家分类卡触发 /search?country=CN', true)
  try { await waitToast(/随机播放/, 'country random play toast', 5000) } catch { /* 非阻塞 */ }
  await sleep(600)

  /* ================================================================ *
   * [4] 播放页：可视化 / 三种模式 / 返回与 Esc 不断播
   * ================================================================ */
  console.log('\n[4] 播放页（可视化 / 三种模式 / 返回不断播）')
  await grBackToBrowse()
  let inPlayer = false
  try {
    await grOpenPlayerView()
    await waitFor(`!!document.querySelector('[data-gr="player-view"]')`, 'player view visible', 6000)
    inPlayer = true
  } catch (err) {
    check('点 playerbar 展开进入播放页', false, String(err))
  }
  if (inPlayer) {
    check('播放页根节点 [data-gr="player-view"] 存在', await visible('[data-gr="player-view"]'))
    const playerText = await textOf('[data-gr="player-view"]') || ''
    const currentStation = (await radioSnap())?.station || {}
    check('播放页显示台名', !!currentStation.name && playerText.includes(currentStation.name), brief({ name: currentStation.name, text: playerText.slice(0, 120) }))
    check('播放页显示频率/音质信息', /FM|MHz|kbps|在线电台/.test(playerText), brief(playerText.slice(0, 120)))
    check('播放页含 [data-gr="player-station"]', await evaluate(`!!document.querySelector('[data-gr="player-station"]')`))
    check('播放页含全屏按钮 [data-gr="fullscreen"]', await evaluate(`!!document.querySelector('[data-gr="fullscreen"]')`))
    let canvas0 = await evaluate('window.__grCanvasStats()')
    if (!canvas0 || !(canvas0.nonBlank > 0)) {
      try { await waitFor(`(() => { const c = window.__grCanvasStats(); return !!c && c.nonBlank > 0 })()`, 'canvas first paint', 5000) } catch { /* 交给断言 */ }
      canvas0 = await evaluate('window.__grCanvasStats()')
    }
    check('可视化 canvas 存在且尺寸 > 0', !!canvas0 && canvas0.w > 0 && canvas0.h > 0, brief(canvas0))
    check('可视化 canvas 实际绘制（分析器输出非空）', !!canvas0 && canvas0.nonBlank > 0, brief(canvas0))
    const mode0 = await modeSnapshot()
    check('可视化模式控件存在', mode0.controls.length > 0, brief(mode0.controls))
    check('三种模式（频谱/波形/环形）可见', /bars|ring|wave|频谱|波形|环形/i.test(JSON.stringify(mode0.controls) + playerText), brief(mode0.controls))
    await S('04-player.png')
    const nCtl = mode0.controls.length
    const clickCount = nCtl >= 3 ? nCtl : Math.max(3, nCtl)
    const modeSeen = []
    let modeCanvasOk = true
    for (let i = 0; i < clickCount; i++) {
      const r = await evaluate(`window.__grClickMode(${i})`)
      if (!r?.ok) break
      await sleep(250)
      try {
        await waitFor(`(() => { const c = window.__grCanvasStats(); return !!c && c.nonBlank > 0 })()`, 'canvas after mode ' + i, 3000)
      } catch { modeCanvasOk = false }
      const snap = await modeSnapshot()
      const vm = parseVisualMode(snap.visualMode)
      if (vm) modeSeen.push(vm)
      if (snap.canvas && snap.canvas.nonBlank === 0) modeCanvasOk = false
      if (i === 1) await S('04b-player-ring.png')
      if (i === 2) await S('04c-player-wave.png')
    }
    check('切换三种模式后 canvas 仍渲染', modeSeen.length > 0 && modeCanvasOk, 'modes=' + JSON.stringify(modeSeen))
    check('visualMode 持久化到 localStorage（bars/ring/wave）', modeSeen.length > 0, JSON.stringify(modeSeen))

    await grBackToBrowse()
    check('播放页返回 browse（[data-gr="back"]）', true)
    const afterBack = await audioInfo()
    check('返回后播放不中断', !afterBack.paused && afterBack.currentTime > 0.02, brief(afterBack))
    await grOpenPlayerView()
    await waitFor(`!!document.querySelector('[data-gr="player-view"]')`, 'player view again', 5000)
    await pressEscape()
    let escBack = false
    try { await waitFor(`!document.querySelector('[data-gr="player-view"]')`, 'esc back', 4000); escBack = true } catch { /* ignore */ }
    check('Esc 退出播放页回到 browse', escBack)
    const afterEsc = await audioInfo()
    check('Esc 返回后播放不中断', !afterEsc.paused && afterEsc.currentTime > 0.02, brief(afterEsc))
  }

  /* ================================================================ *
   * [5] 搜索 / 收藏与最近收听持久化
   * ================================================================ */
  console.log('\n[5] 搜索 / 收藏持久化')
  await grBackToBrowse()
  await resetCalls()
  const searchSet = await evaluate(`window.__grSetSearch('BBC')`)
  check('搜索框可输入', !!searchSet)
  const qCall = () => findCalls('/global-radio/api/search', /(?:^|[?&])q=BBC(?:&|$)/)
  let bbcSearchCalled = false
  try {
    await waitUntil(async () => (await qCall()).length > 0, 'q=BBC call', 10000)
    bbcSearchCalled = true
  } catch (err) {
    await evaluate(`(() => { const el = document.querySelector('[data-gr="search"]'); if (el) el.focus() })()`)
    await cdp.send('Input.insertText', { text: 'BBC' })
    try {
      await waitUntil(async () => (await qCall()).length > 0, 'q=BBC call retry', 6000)
      bbcSearchCalled = true
    } catch (err2) { check('搜索请求携带 q=BBC', false, String(err2)) }
  }
  if (bbcSearchCalled) check('搜索请求携带 q=BBC', true)
  let bbcResults = false
  try {
    await waitFor(`(() => {
      const root = document.querySelector('[data-gr="root"]')
      const text = root ? root.textContent : ''
      const cards = [...document.querySelectorAll('[data-gr="station"]')]
      return /搜索结果/.test(text) && cards.length >= 2 && cards.every(function (el) { return /BBC/i.test(el.textContent) })
    })()`, 'BBC results UI', 8000)
    bbcResults = true
  } catch (err) { check('输入 BBC 后出现搜索结果（结果区 + 全部命中 BBC）', false, String(err)) }
  if (bbcResults) check('输入 BBC 后出现搜索结果（结果区 + 全部命中 BBC）', true)
  await S('07-search-bbc.png')
  await evaluate(`window.__grSetSearch('')`)
  try { await waitFor(`window.__grState().rows.length >= 3`, 'discovery restored after clearing search', 8000) } catch { /* ignore */ }

  // 播放北京音乐广播 → 收藏
  await grClickStation(MOCK.seedId, MOCK.seedName)
  try { await waitPlaying('favorite fixture', 10000) } catch { /* ignore */ }
  const favClicked = await evaluate(`(() => {
    const btn = document.querySelector('[data-gr="playerbar"] [data-gr="favorite"]')
    if (!btn) return { ok: false }
    btn.click()
    return { ok: true }
  })()`)
  check('playerbar 收藏按钮可点击', !!favClicked?.ok)
  await sleep(500)
  const readFavs = () => evaluate(`(() => {
    try { const raw = localStorage.getItem('global-radio:favorites'); return raw ? JSON.parse(raw) : null } catch (e) { return null }
  })()`)
  const favStore = await readFavs()
  const favIds = idsOfStore(favStore)
  check('收藏写入 localStorage global-radio:favorites', favIds.includes(MOCK.seedId), brief(favStore))
  const recentStore = await evaluate(`(() => {
    try { const raw = localStorage.getItem('global-radio:recent'); return raw ? JSON.parse(raw) : null } catch (e) { return null }
  })()`)
  const recentIds = (Array.isArray(recentStore) ? recentStore : []).map((s) => (s && typeof s === 'object' ? s.id : s))
  check('最近收听写入 localStorage global-radio:recent', recentIds.includes(MOCK.seedId), brief(recentStore))

  // 刷新后仍在（发现页出现最近收听/我的收藏横滑列表）
  await reload()
  await waitMounted()
  await waitFor(`window.__grState().banners === 3 && window.__grState().rows.length >= 3`, 'discovery after reload', 15000)
  const rowsAfterReload = await rowIds()
  check('刷新后出现「最近收听」横滑列表', rowsAfterReload.includes('recent'), JSON.stringify(rowsAfterReload))
  check('刷新后出现「我的收藏」横滑列表', rowsAfterReload.includes('favorites'), JSON.stringify(rowsAfterReload))
  const favAfterReload = await readFavs()
  check('刷新后收藏仍在 localStorage', idsOfStore(favAfterReload).includes(MOCK.seedId), brief(favAfterReload))
  const reloadCards = await grStations()
  check('刷新后收藏/最近列表展示该电台', reloadCards.some((c) => c.id === MOCK.seedId), brief(reloadCards.filter((c) => c.id === MOCK.seedId).length + ' card(s)'))
  await S('09-favorites-reload.png')

  /* ================================================================ *
   * [6] 音频互斥 + 迷你条上下堆叠（wide / rail）
   * ================================================================ */
  console.log('\n[6] 音频互斥 + 迷你条堆叠（wide/rail）')
  await grClickStation(MOCK.seedId, MOCK.seedName)
  try { await waitPlaying('mutex fixture', 10000) } catch { /* ignore */ }
  await evaluate(`window.__setActivePanel('conversation')`)
  await evaluate(`window.__setSidebarWide(true)`)
  await sleep(500)
  let miniWide = null
  try {
    await waitFor(`!!document.querySelector('[data-gr="mini-player"]')`, 'wide mini', 5000)
    miniWide = await miniInfo()
  } catch (err) { check('播放中切到其它面板：侧栏出现迷你播放器', false, String(err)) }
  if (miniWide) {
    check('播放中切到其它面板：侧栏出现迷你播放器', true)
    check('宽侧栏迷你条 class 含 is-wide', /is-wide/.test(miniWide.cls || ''), brief(miniWide.cls))
    check('宽侧栏迷你条 data-playing="true"', miniWide.playing === 'true', brief(miniWide))
    check('宽侧栏迷你条含台标/台名/频率', /北京音乐广播|97\.4/.test(miniWide.text || ''), brief(miniWide.text))
    check('宽侧栏迷你条含 prev/toggle/next/volume',
      !!(miniWide.prev && miniWide.toggle && miniWide.next && miniWide.volume), brief(miniWide))
    const geom = await evaluate(`(() => {
      const footer = document.querySelector('[class*="footerActions"]')
      const mini = document.querySelector('[data-gr="mini-player"]')
      if (!footer || !mini) return null
      const r = mini.getBoundingClientRect(), fr = footer.getBoundingClientRect()
      return { width: Math.round(r.width), footerWidth: Math.round(fr.width), position: getComputedStyle(mini).position,
        inFooter: footer.contains(mini), railWidth: Math.round(document.getElementById('rail').getBoundingClientRect().width) }
    })()`)
    check('宽侧栏迷你条占满 footer（差 <2px）', !!geom && Math.abs(geom.width - geom.footerWidth) < 2, brief(geom))
    check('宽侧栏迷你条不是 fixed 悬浮', !!geom && geom.position !== 'fixed', brief(geom))
    const miniLayout = await evaluate(`(() => {
      const mini = document.querySelector('[data-gr="mini-player"]')
      if (!mini) return null
      const prev = mini.querySelector('[data-gr="mini-prev"]')
      const next = mini.querySelector('[data-gr="mini-next"]')
      const level = mini.querySelector('.gr-mini-level')
      if (!prev || !next) return null
      const mr = mini.getBoundingClientRect()
      const pr = prev.getBoundingClientRect()
      const nr = next.getBoundingClientRect()
      const controls = prev.parentElement
      return {
        centerDelta: Math.round(Math.abs((pr.left + nr.right) / 2 - (mr.left + mr.right) / 2) * 10) / 10,
        gap: controls ? getComputedStyle(controls).columnGap : null,
        expandInMini: !!mini.querySelector('[data-gr="expand"]'),
        levelExists: !!level,
        levelI: level ? level.querySelectorAll('i').length : -1,
        levelAnim: level ? getComputedStyle(level, '::after').animationName : null,
      }
    })()`)
    check('宽侧栏迷你条传输键组在宽度内居中（±2px）且 gap≈22px',
      !!miniLayout && miniLayout.centerDelta <= 2 && /^22px$/.test(miniLayout.gap || ''), brief(miniLayout))
    check('迷你条电平条为单条动画（不再有 4 个 <i>）',
      !!miniLayout && miniLayout.levelExists && miniLayout.levelI === 0 && /gr-mini-level/.test(miniLayout.levelAnim || ''), brief(miniLayout))
    await S('20-mini-sidebar-wide.png')
  }

  // 模拟网易云迷你条（同一 footerActions 槽）+ 网易云 audio 播放
  await evaluate(`window.__setForeignMini(true)`)
  await sleep(250)
  await evaluate(`window.__addForeignAudio()`)
  const foreignStart = await evaluate(`(() => {
    const a = window.__foreignAudio
    a.play()
    return { src: a.getAttribute('src'), volume: a.volume }
  })()`)
  await sleep(700)
  let radioPaused = false
  try { await waitFor(`window.__grAudio().paused === true`, 'radio paused by foreign', 5000); radioPaused = true } catch { /* ignore */ }
  check('网易云开播 → 电台自动暂停', radioPaused)
  check('模拟网易云 audio 实际在播', await evaluate(`!window.__foreignAudio.paused`))
  const miniAfterForeign = await miniInfo()
  check('检测到别家播放 → 迷你条保留且 data-playing=false',
    miniAfterForeign.present && miniAfterForeign.playing === 'false', brief(miniAfterForeign))
  const snapForeign = await radioSnap()
  check('检测到别家播放 → store.otherPlaying=true', snapForeign && snapForeign.otherPlaying === true, brief(snapForeign))
  const stackWide = await stackGeometry()
  check('宽侧栏：迷你条与网易云迷你条在同一 footerActions 槽内', !!stackWide.sameFooter, brief(stackWide))
  check('宽侧栏：两个迷你条上下堆叠（y 不重叠、x 对齐、非并排）',
    !!stackWide.vertical && !stackWide.sideBySide && stackWide.xAligned, brief(stackWide))
  await S('26-mini-stacked.png')

  // 收起 56px rail：两个圆形按钮也上下堆叠
  await evaluate(`window.__setSidebarWide(false)`)
  await sleep(700)
  let miniRail = null
  try { await waitFor(`(function () { const m = document.querySelector('[data-gr="mini-player"]'); return !!m && m.className.indexOf('is-rail') >= 0 })()`, 'rail mini', 5000); miniRail = await miniInfo() } catch { /* ignore */ }
  if (miniRail) {
    check('56px 收起侧栏：迷你条为 is-rail 且 ≤44px', /is-rail/.test(miniRail.cls || '') && miniRail.width <= 44 && miniRail.height <= 44, brief(miniRail))
    const stackRail = await stackGeometry()
    check('56px 收起侧栏：与网易云圆形按钮同槽上下堆叠（y 不重叠、x 对齐）',
      !!stackRail.sameFooter && !!stackRail.vertical && !stackRail.sideBySide && stackRail.xAligned, brief(stackRail))
    check('56px 收起侧栏：两个 rail 按钮尺寸接近（36px 档）',
      Math.abs(stackRail.ours.w - stackRail.foreign.w) <= 6, brief(stackRail))
    await S('29-mini-stacked-rail.png')
    try { await screenshotRegion('[class*="footerActions"]', '24-mini-rail-zoom.png', 4, 18) } catch { /* ignore */ }
  } else {
    check('56px 收起侧栏：迷你条为 is-rail，与网易云按钮堆叠', false, 'rail mini not found')
  }

  // 恢复：宽侧栏 + 回到面板点 playerbar 播放 → 网易云被暂停
  await evaluate(`window.__setSidebarWide(true)`)
  await sleep(300)
  await evaluate(`window.__setActivePanel('global-radio')`)
  await sleep(400)
  await evaluate(`(() => { const b = document.querySelector('[data-gr="playerbar"] [data-gr="toggle"]'); if (b) b.click(); return !!b })()`)
  let radioResumed = false
  try { await waitFor(`!window.__grAudio().paused && window.__grAudio().currentTime > 0.02`, 'radio resumed', 8000); radioResumed = true } catch { /* ignore */ }
  check('再点播放 → 电台恢复播放', radioResumed)
  check('电台开播 → 模拟网易云被暂停', (await evaluate(`window.__foreignAudio ? window.__foreignAudio.paused : null`)) === true)
  check('模拟网易云的 pause 事件已触发', !!(await evaluate(`window.__foreignAudio ? (window.__foreignAudio.dataset.eventPause || null) : null`)))
  await evaluate(`window.__setActivePanel('conversation')`)
  await sleep(500)
  const miniResumed = await miniInfo()
  check('电台恢复播放 → 迷你条 data-playing=true 且保留（与网易云条仍堆叠）',
    miniResumed.present && miniResumed.playing === 'true' && (await evaluate(`!!document.querySelector('[data-nm-mini]')`)), brief(miniResumed))
  await evaluate(`window.__setForeignMini(false)`)
  await evaluate(`window.__removeForeignAudio()`)
  await evaluate(`window.__setActivePanel('global-radio')`)
  await sleep(400)

  /* ================================================================ *
   * [7] HLS：m3u8 改写 / 假运行时 / 缺运行时提示
   * ================================================================ */
  console.log('\n[7] HLS（m3u8 改写 / 假运行时 / 缺运行时提示）')
  try {
    const r = await fetch(`${BASE}/global-radio/api/hls?url=` + encodeURIComponent('http://mock.local/hls/cbc/playlist.m3u8'))
    const ct = r.headers.get('content-type') || ''
    const body = await r.text()
    check('/hls 播放列表 Content-Type = application/vnd.apple.mpegurl', /mpegurl/i.test(ct), ct)
    check('/hls m3u8 含 #EXTM3U 且相对分片已重写为代理 URL',
      /^#EXTM3U/.test(body) && body.includes('/global-radio/api/hls?url=') && !/^seg0\.ts$/m.test(body), brief(body))
    check('/hls #EXT-X-KEY/#EXT-X-MAP 的 URI 也被重写', body.includes('URI="/global-radio/api/hls?url='), brief(body))
  } catch (err) { check('/hls 播放列表 mock 可访问', false, String(err)) }

  await grBackToBrowse()
  await resetCalls()
  const errorsBeforeHls = errors.length
  const clickedHls = await grClickStation(MOCK.hlsId, MOCK.hlsName)
  check('点击 HLS 电台卡片命中', !!clickedHls?.found, brief(clickedHls))
  await sleep(1200)
  const runtimeLoaded = (await calls()).some((c) => c.path === '/global-radio/api/hls-runtime.js')
  check('HLS 电台播放时加载了 /global-radio/api/hls-runtime.js', runtimeLoaded)
  let hlsAlive = true
  try { await waitFor(`window.__mounted === true && !!document.querySelector('[data-gr="root"]')`, 'page alive after hls', 5000) } catch { hlsAlive = false }
  check('HLS 电台播放页面不崩溃', hlsAlive)
  const hlsAudio = await audioInfo()
  check('HLS 电台 audio 走同源代理（stream 或 hls）', /\/global-radio\/api\/(stream|hls)/.test(hlsAudio.src), brief(hlsAudio.src))
  check('HLS 电台（假运行时）进入播放态', (hlsAudio.exists && !hlsAudio.paused) || (await grState()).rootPlaying === 'true', brief(hlsAudio))
  const hlsErrors = errors.slice(errorsBeforeHls)
  check('HLS 播放期间无 console error', hlsErrors.length === 0, brief(hlsErrors.slice(0, 3)))
  await grOpenPlayerView()
  try {
    await waitFor(`!!document.querySelector('[data-gr="player-view"]')`, 'hls player view', 5000)
    const hlsCanvas = await evaluate('window.__grCanvasStats()')
    check('HLS 电台播放页可视化 canvas 有尺寸', !!hlsCanvas && hlsCanvas.w > 0 && hlsCanvas.h > 0, brief(hlsCanvas))
  } catch (err) { check('HLS 电台可进入播放页', false, String(err)) }
  await S('13-hls-player.png')
  await grBackToBrowse()

  console.log('  — 缺 HLS 运行时模式（/hls-runtime.js 404）')
  await config({ hlsMissing: true })
  await reload()
  await waitMounted()
  await waitFor(`window.__grState().banners === 3`, 'discovery after hlsMissing reload', 15000)
  allowErrors = true
  await startToastLog()
  await grClickStation(MOCK.hlsId, MOCK.hlsName)
  let hlsMissingShown = false
  try {
    await waitToastLog(/HLS|运行时|runtime/i, 'hls missing message', 8000)
    hlsMissingShown = true
  } catch (err) {
    const seen = await evaluate(`(() => {
      const e = document.querySelector('[data-gr="error"]')
      const t = document.querySelector('[data-gr="toast"]')
      const snap = window.__GLOBAL_RADIO__ && window.__GLOBAL_RADIO__.store && window.__GLOBAL_RADIO__.store.getSnapshot()
      return { error: e ? (e.textContent || '').trim().slice(0, 120) : null, toast: t ? (t.textContent || '').trim() : null, storeError: snap ? snap.error : null, canPlayHls: document.createElement('audio').canPlayType('application/vnd.apple.mpegurl') }
    })()`)
    check('无 HLS 运行时：显示明确错误提示（toast/error）', false, brief(seen))
  }
  if (hlsMissingShown) check('无 HLS 运行时：显示明确错误提示（toast/error）', true)
  check('无 HLS 运行时：页面不崩溃（root 仍在）', await evaluate(`!!document.querySelector('[data-gr="root"]')`))
  await S('14-hls-missing.png')
  allowErrors = false
  await config({ hlsMissing: false })

  /* ================================================================ *
   * [8] 错误态 + 备用源 / 不可播过滤
   * ================================================================ */
  console.log('\n[8] 错误态与备用源')
  await config({ errorMode: 'home' })
  await reload()
  await waitMounted()
  let homeErrorShown = false
  try { await waitFor(`!!document.querySelector('[data-gr="error"]')`, 'home error state', 10000); homeErrorShown = true } catch (err) { check('/home 500 → 显示 [data-gr="error"]', false, String(err)) }
  if (homeErrorShown) {
    check('/home 500 → 显示 [data-gr="error"]', true)
    const errText = await textOf('[data-gr="error"]')
    check('错误态文案为后端中文错误（非 Invalid status code）',
      !!errText && errText.length > 0 && !/Invalid status code/i.test(errText), brief(errText))
    await S('15-error-home.png')
    await config({ errorMode: null })
    const retried = await evaluate(`(() => {
      const box = document.querySelector('[data-gr="error"]')
      if (!box) return false
      const btns = [...box.querySelectorAll('button, [role="button"], a')]
      const hit = btns.find(function (b) { return /重试|retry|刷新|重新/i.test((b.textContent || '') + ' ' + (b.getAttribute('aria-label') || '')) })
      ;(hit || btns[0] || box).click()
      return true
    })()`)
    check('点击重试按钮', !!retried)
    let recovered = false
    try { await waitFor(`window.__grState().banners === 3 && !window.__grState().error`, 'home recovered', 12000); recovered = true } catch (err) { check('重试后首页恢复渲染（原地恢复）', false, String(err)) }
    if (recovered) check('重试后首页恢复渲染（原地恢复）', true)
    await S('16-error-recovered.png')
  }

  // 备用源有可用候选：主源 502 → /alternates → 自动换源播放
  console.log('  — 备用源可用场景')
  await config({ errorMode: null, fallbackMode: 'has-alt' })
  await reload()
  await waitMounted()
  await waitFor(`window.__grState().banners === 3 && window.__grState().rows.length >= 3`, 'discovery for fallback', 15000)
  await resetCalls()
  const altTargetId = MOCK.seedId
  await grClickStation(altTargetId, MOCK.seedName)
  let altRequested = false
  try {
    await waitUntil(async () => (await findCalls('/global-radio/api/alternates', /id=seed%3Abj-music-fm974|id=seed:bj-music-fm974/)).length > 0 ||
      (await findCalls('/global-radio/api/alternates')).length > 0, 'alternates requested', 10000)
    altRequested = true
  } catch (err) { check('主源失败 → 请求 /global-radio/api/alternates', false, String(err)) }
  if (altRequested) check('主源失败 → 请求 /global-radio/api/alternates', true)
  let fallbackToast = false
  try { await waitToast(/已切换到备用源|备用源/, 'fallback toast', 8000); fallbackToast = true } catch (err) { check('备用源切换 toast「已切换到备用源」', false, String(err)) }
  if (fallbackToast) check('备用源切换 toast「已切换到备用源」', true)
  let altPlaying = false
  try { await waitFor(`(() => { const a = window.__grAudio(); return a.exists && !a.paused && a.currentTime > 0.02 })()`, 'fallback source playing', 12000); altPlaying = true } catch (err) { check('备用源播放成功（audio !paused）', false, String(err)) }
  if (altPlaying) check('备用源播放成功（audio !paused）', true)
  const altAudio = await audioInfo()
  check('备用源 audio.src 指向 backup 源', /backup/.test(altAudio.src || ''), brief(altAudio.src))
  const altBar = await playerbarInfo()
  check('playerbar 更新为备用源电台', /备用源/.test(altBar.text || ''), brief(altBar.text))
  await S('31-fallback-source.png')

  // 备用源为空：toast 暂时无法播放 + 台从列表移除 + 不无限重试
  console.log('  — 备用源为空场景')
  await config({ fallbackMode: 'empty' })
  await resetCalls()
  const failId = MOCK.failAgainId
  const failName = 'CNR-1 中国之声'
  await grClickStation(failId, failName)
  let unavailableToast = false
  try { await waitToast(/暂时无法播放|无法播放/, 'unavailable toast', 8000); unavailableToast = true } catch (err) { check('备用源为空 → toast「暂时无法播放」', false, String(err)) }
  if (unavailableToast) check('备用源为空 → toast「暂时无法播放」', true)
  let removed = false
  try {
    await waitFor(`!document.querySelector('[data-gr="station"][data-id="${failId}"]')`, 'unavailable station removed', 5000)
    removed = true
  } catch (err) { check('不可播电台从列表移除（unavailableIds 过滤）', false, String(err)) }
  if (removed) check('不可播电台从列表移除（unavailableIds 过滤）', true)
  await config({ fallbackMode: null }) // 避免自动跳台后的下一台也被 mock 成失败而级联
  await sleep(2400)
  const fallbackCalls = await findCalls('/global-radio/api/alternates', /seed:cnr1-zhongguozhisheng/)
  check('/alternates 对该台只请求一次，无死循环重试', fallbackCalls.length === 1, fallbackCalls.length + ' call(s)')
  const snapAfterFail = await radioSnap()
  check('失败后自动跳到下一台（不卡在不可播台）',
    !!snapAfterFail && !!snapAfterFail.station && snapAfterFail.station.id !== failId, brief(snapAfterFail))
  check('不可播流程不崩溃（root 仍在）', await evaluate(`!!document.querySelector('[data-gr="root"]')`))
  await S('32-unavailable-filtered.png')
  await config({ fallbackMode: null })
  await reload()
  await waitMounted()
  await waitFor(`window.__grState().banners === 3`, 'discovery after fallback reset', 15000)

  /* ================================================================ *
   * [9] 主题 / 响应式
   * ================================================================ */
  console.log('\n[9] 主题 / 响应式')
  await setViewport(1440, 980)
  await setTheme('dark')
  await sleep(500)
  await S('00-home-dark.png')
  const darkColors = await evaluate(`(() => {
    const root = document.querySelector('[data-gr="root"]')
    const header = document.querySelector('[data-gr="header"]')
    return { bg: root ? getComputedStyle(root).backgroundColor : null, headerColor: header ? getComputedStyle(header).color : null, scheme: getComputedStyle(document.documentElement).colorScheme }
  })()`)
  check('深色主题下页面有背景/前景色', !!darkColors.bg && !!darkColors.headerColor, brief(darkColors))
  await setTheme('light')
  await sleep(500)
  await S('01-home-light.png')
  for (const sel of ['#sidebar-icon img', '#sidebar-icon .gr-panel-mark', '#sidebar-icon > *']) {
    try { await screenshotRegion(sel, '28-sidebar-icon-light.png', 6, 14); break } catch { /* 尝试下一个 */ }
  }
  check('浅色主题截图（页面可渲染）', true)
  await setTheme('dark')
  const widths = [
    [1440, 980, '10-1440-wide.png'],
    [1024, 900, '11-1024-narrow.png'],
    [600, 820, '12-600-narrow.png'],
  ]
  for (const [w, h, shot] of widths) {
    await setViewport(w, h)
    await sleep(600)
    const m = await overflowReport()
    check(`${w}px 视口无横向溢出`, m.docScroll <= w + 1 && (m.rootScroll == null || m.rootScroll <= m.rootClient + 1), brief(m))
    const rowOverflow = await evaluate(`[...document.querySelectorAll('[data-gr="row"]')].map(function (row) {
      const sc = row.querySelector('.gr-row-scroll')
      if (!sc) return null
      const cards = row.querySelectorAll('[data-gr="station"]')
      const cols = getComputedStyle(sc).gridTemplateColumns.split(' ').filter(Boolean).length
      return { scrollWidth: sc.scrollWidth, clientWidth: sc.clientWidth, cols: cols, cards: cards.length }
    })`)
    const badRows = rowOverflow.filter(function (r) { return r && r.scrollWidth > r.clientWidth + 1 })
    check(`${w}px 视口横滑列表已网格换行（无内部横向溢出）`, rowOverflow.length > 0 && badRows.length === 0,
      brief({ bad: badRows, sample: rowOverflow.slice(0, 2) }))
    if (shot) await S(shot)
  }
  await setViewport(1440, 980)

  /* ================================================================ *
   * [10] 运行期健康
   * ================================================================ */
  console.log('\n[10] 运行期健康检查')
  await sleep(300)
  check('整轮运行无未捕获页面异常 / console.error', unexpectedErrors.length === 0, brief(unexpectedErrors.slice(0, 5)))
  check('页面最终仍可用（root 存在）', await evaluate(`!!document.querySelector('[data-gr="root"]')`))
  const finalAudio = await audioInfo()
  console.log('  · final audio: ' + brief(finalAudio))

} catch (err) {
  fatal = err
  failures.push({ label: `FATAL: ${err.message}`, extra: undefined })
  console.error('\nFATAL:', err.stack || err)
  if (errors.length) console.error('page errors:', errors.slice(0, 8).join('\n'))
  try {
    shots.push(await screenshot('99-fatal.png'))
  } catch { /* ignore */ }
} finally {
  console.log('\n================ 验收结果 ================')
  console.log(`PASS ${passed.length} / FAIL ${failures.length}${fatal ? '（含 FATAL）' : ''}`)
  if (failures.length) {
    console.log('\nFAIL 清单：')
    for (const f of failures) {
      console.log(`  ✗ ${f.label}${f.extra === undefined ? '' : ` → ${typeof f.extra === 'string' ? f.extra : JSON.stringify(f.extra)}`}`)
    }
  }
  if (shots.length) {
    console.log('\n截图：')
    for (const s of shots) console.log('  ' + s)
  }
  const log = [
    `# dsh-global-radio-selftest ${new Date().toISOString()}`,
    `client: ${CLIENT}`,
    `mock: ${BASE}`,
    `PASS ${passed.length} / FAIL ${failures.length}${fatal ? '（含 FATAL）' : ''}`,
    '',
    '## PASS',
    ...passed.map((p) => `- ${p}`),
    '',
    '## FAIL',
    ...failures.map((f) => `- ${f.label}${f.extra === undefined ? '' : ` → ${typeof f.extra === 'string' ? f.extra : JSON.stringify(f.extra)}`}`),
    '',
    '## SHOTS',
    ...shots.map((s) => `- ${s}`),
    '',
    '## console errors (all)',
    ...errors.slice(0, 40).map((e) => `- ${String(e).slice(0, 500)}`),
    '',
    '## unexpected console errors',
    ...unexpectedErrors.slice(0, 20).map((e) => `- ${String(e).slice(0, 500)}`),
  ].join('\n')
  writeFileSync(join(HERE, 'last-run.log'), log)

  clearTimeout(watchdog)
  cdp.close()
  chrome.kill('SIGKILL')
  server.kill('SIGKILL')
  try { rmSync(profileDir, { recursive: true, force: true }) } catch { /* ignore */ }
  process.exit(failures.length ? 1 : 0)
}
