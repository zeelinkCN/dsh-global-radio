/**
 * 基础设施自测用 smoke client（不是插件实现！）
 *
 * 用途：在 dsh-global-radio/client.js 尚未交付 / 仍在迭代时，验证 harness 的
 * server / mock API / 假 ctx / CDP 驱动 / 截图 / 断言链路本身是通的。
 *
 * 用法：GR_CLIENT=fixtures/smoke-client.js node run.mjs
 * 它刻意只实现契约的一小部分（slots、home、播放、播放页/可视化、搜索/过滤/收藏、
 * 互斥、错误态、迷你条），因此 run.mjs 会有一批断言 FAIL —— 那是预期结果，
 * 用来检查 harness 的每条断言是否真的能采集到数据，而不是用来判定插件质量。
 */
window.__ModuleLoader__.load({
  id: '@local/global-radio-smoke-fixture',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const API = '/global-radio/api'
    const readStore = (k, d) => {
      try {
        const raw = localStorage.getItem('global-radio:' + k)
        return raw == null ? d : JSON.parse(raw)
      } catch { return d }
    }
    const writeStore = (k, v) => {
      try { localStorage.setItem('global-radio:' + k, JSON.stringify(v)) } catch { /* ignore */ }
    }

    const state = {
      home: null,
      homeError: '',
      homeLoading: false,
      playing: false,
      station: null,
      volume: readStore('volume', 0.8),
      muted: readStore('muted', false),
      favorites: readStore('favorites', []),
      recent: readStore('recent', []),
      visualMode: ['bars', 'ring', 'wave'].includes(readStore('visualMode', 'bars')) ? readStore('visualMode', 'bars') : 'bars',
      view: 'browse',
      query: { q: '', country: 'ALL', tag: '' },
      results: null,
      toast: '',
      foreignPlaying: false,
    }
    const listeners = new Set()
    let snapshot = { ...state }
    const emit = () => {
      snapshot = { ...state }
      listeners.forEach((fn) => { try { fn() } catch { /* ignore */ } })
    }
    const setState = (patch) => { Object.assign(state, patch); emit() }
    const useStore = () => React.useSyncExternalStore(
      (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
      () => snapshot,
    )

    let audioEl = null
    const apiGet = async (path) => {
      const r = await fetch(API + path)
      const j = await r.json()
      if (!j || !j.ok) throw new Error((j && j.error) || '请求失败')
      return j.data
    }

    function ensureAudio() {
      if (audioEl) return audioEl
      audioEl = document.createElement('audio')
      audioEl.setAttribute('data-gr-audio', '')
      audioEl.style.display = 'none'
      audioEl.preload = 'auto'
      audioEl.volume = state.muted ? 0 : state.volume
      audioEl.addEventListener('playing', () => setState({ playing: true }))
      audioEl.addEventListener('play', () => {
        setState({ playing: true })
        // 音频互斥：暂停所有非自家媒体
        document.querySelectorAll('audio,video').forEach((el) => {
          if (el !== audioEl && !el.paused) { try { el.pause() } catch { /* ignore */ } }
        })
      })
      audioEl.addEventListener('pause', () => setState({ playing: false }))
      audioEl.addEventListener('error', () => setState({ playing: false, toast: '播放失败，请试试别的电台' }))
      document.body.appendChild(audioEl)
      return audioEl
    }

    function onForeignPlay() { setState({ foreignPlaying: true }); if (audioEl && !audioEl.paused) audioEl.pause() }

    function playStation(st) {
      if (!st) return
      const a = ensureAudio()
      if (state.station && state.station.id !== st.id) {
        const next = [state.station, ...state.recent.filter((x) => x.id !== state.station.id)].slice(0, 12)
        setState({ recent: next }); writeStore('recent', next)
      }
      setState({ station: st, toast: '', playing: false })
      if (st.hls) {
        const load = () => {
          try {
            const hls = new window.Hls()
            hls.on(window.Hls.Events.MANIFEST_PARSED, () => { a.play().catch(() => {}) })
            hls.attachMedia(a)
            hls.loadSource(API + '/hls?url=' + encodeURIComponent(st.url))
          } catch (e) { setState({ toast: 'HLS 播放失败: ' + e.message }) }
        }
        if (window.Hls) load()
        else {
          const s = document.createElement('script')
          s.src = API + '/hls-runtime.js'
          s.onload = load
          s.onerror = () => setState({ toast: '当前构建缺少 HLS 运行时' })
          document.head.appendChild(s)
        }
        return
      }
      a.src = API + '/stream?url=' + encodeURIComponent(st.url) + '&id=' + encodeURIComponent(st.id)
      try { a.load() } catch { /* ignore */ }
      a.play().catch((e) => setState({ toast: '播放失败：' + e.message }))
    }

    function togglePlay() {
      const a = ensureAudio()
      if (state.playing) { a.pause(); return }
      if (state.station) {
        if (!a.src) playStation(state.station)
        else a.play().catch((e) => setState({ toast: '播放失败：' + e.message }))
      } else if (state.home) {
        playStation(state.home.seed[0])
      }
    }

    function toggleFavorite(st) {
      if (!st) return
      const exists = state.favorites.some((x) => x && x.id === st.id)
      const next = exists ? state.favorites.filter((x) => x.id !== st.id) : [st, ...state.favorites]
      setState({ favorites: next }); writeStore('favorites', next)
      setState({ toast: exists ? '已取消收藏' : '已收藏' })
      setTimeout(() => { if (state.toast) setState({ toast: '' }) }, 1600)
    }

    function setVolume(v) {
      const num = Math.max(0, Math.min(1, Number(v) || 0))
      const a = ensureAudio()
      a.volume = num
      setState({ volume: num, muted: num === 0 })
      writeStore('volume', num)
    }

    function runSearch(patch) {
      const q = Object.assign({}, state.query, patch || {})
      setState({ query: q })
      if (!q.q && q.country === 'ALL' && !q.tag) { setState({ results: null }); return }
      const qs = new URLSearchParams()
      if (q.q) qs.set('q', q.q)
      if (q.country && q.country !== 'ALL') qs.set('country', q.country)
      if (q.tag) qs.set('tag', q.tag)
      apiGet('/search?' + qs.toString())
        .then((data) => setState({ results: data.items || [] }))
        .catch((e) => setState({ toast: e.message }))
    }

    function loadHome(refresh) {
      setState({ homeLoading: true, homeError: '' })
      apiGet('/home' + (refresh ? '?refresh=1' : ''))
        .then((home) => setState({ home, homeLoading: false }))
        .catch((e) => setState({ homeError: e.message, homeLoading: false }))
    }

    /* ---------------- 组件 ---------------- */
    const StationCard = ({ st, t }) => h('button', {
      className: 'sm-station',
      'data-gr': 'station',
      'data-id': st.id,
      'data-playing': String(state.station && state.station.id === st.id && state.playing),
      onClick: () => playStation(st),
    },
    h('img', { src: API + '/img?url=' + encodeURIComponent(st.logo || st.id), alt: '', width: 48, height: 48 }),
    h('span', { className: 'sm-st-name' }, st.name),
    h('span', null, st.frequency || (st.codec + ' ' + st.bitrate)),
    h('span', null, st.country || ''),
    h('span', null, (st.tags || []).join(' ')))

    function Header() {
      const s = useStore()
      const [input, setInput] = React.useState('')
      React.useEffect(() => {
        const t = setTimeout(() => runSearch({ q: input.trim() }), 350)
        return () => clearTimeout(t)
      }, [input])
      return h('div', { 'data-gr': 'header' },
        h('img', { src: API + '/icon?size=64', width: 22, height: 22, alt: '' }),
        h('strong', null, '全球电台'),
        h('input', {
          'data-gr': 'search', value: input, placeholder: '搜索 BBC / 北京 / 爵士',
          onChange: (e) => setInput(e.target.value),
        }),
        h('button', { onClick: () => loadHome(true) }, '刷新'),
        h('span', null, '正在播出 · ' + (s.status || 'ok')))
    }

    function Hero() {
      const s = useStore()
      const st = s.station || (s.home && s.home.seed[0])
      if (!st) return null
      return h('div', { 'data-gr': 'hero' },
        h('img', { src: API + '/img?url=' + encodeURIComponent(st.logo || st.id), alt: '', width: 96, height: 96 }),
        h('div', { 'data-gr': 'player-station' }, st.name),
        h('div', null, st.frequency || ''),
        h('div', null, (st.country || '') + ' · ' + st.codec + ' ' + st.bitrate),
        h('button', { 'data-gr': 'play', onClick: togglePlay }, s.playing ? '暂停' : '播放'),
        h('button', { 'data-gr': 'favorite', onClick: () => toggleFavorite(st) }, '收藏'),
        h('input', {
          'data-gr': 'volume', type: 'range', min: 0, max: 1, step: 0.01, value: s.volume,
          onChange: (e) => setVolume(e.target.value),
        }),
        h('button', { 'data-gr': 'open-player', onClick: () => setState({ view: 'player' }) }, '全屏播放'))
    }

    function Filters() {
      const s = useStore()
      const countries = (s.home && s.home.countries) || []
      const tags = (s.home && s.home.tags) || []
      return h('div', { 'data-gr': 'filters' },
        h('button', { 'data-gr': 'country', 'data-country': 'ALL', onClick: () => runSearch({ country: 'ALL' }) }, '全球'),
        countries.map((c) => h('button', {
          key: c.code, 'data-gr': 'country', 'data-country': c.code,
          onClick: () => runSearch({ country: c.code }),
        }, c.name)),
        tags.map((tag) => h('button', {
          key: tag.id, 'data-gr': 'tag', 'data-tag': tag.id,
          onClick: () => runSearch({ tag: tag.id }),
        }, tag.id)))
    }

    function Section({ title, items }) {
      if (!items || !items.length) return null
      return h('section', null,
        h('h3', null, title + ' (' + items.length + ')'),
        h('div', null, items.map((st) => h(StationCard, { key: st.id, st }))))
    }

    function HomeSections() {
      const s = useStore()
      if (s.results) return h(Section, { title: '搜索结果', items: s.results })
      if (!s.home) return s.homeError
        ? h('div', { 'data-gr': 'error' }, h('div', null, s.homeError), h('button', { onClick: () => loadHome(true) }, '重试'))
        : h('div', null, '加载中…')
      const sections = []
      if (s.favorites.length) sections.push(h(Section, { key: 'fav', title: '我的收藏', items: s.favorites }))
      if (s.recent.length) sections.push(h(Section, { key: 'recent', title: '最近收听', items: s.recent }))
      sections.push(h(Section, { key: 'seed', title: '编辑精选', items: s.home.seed }))
      sections.push(h(Section, { key: 'popular', title: '全球热门', items: s.home.popular }))
      sections.push(h(Section, { key: 'china', title: '华语电台', items: s.home.china }))
      return h('div', null, sections)
    }

    function Visualizer({ mode }) {
      const ref = React.useRef(null)
      React.useEffect(() => {
        const canvas = ref.current
        if (!canvas) return undefined
        let raf = 0
        const draw = () => {
          const w = canvas.clientWidth || 320
          const hgt = canvas.clientHeight || 120
          if (canvas.width !== w) canvas.width = w
          if (canvas.height !== hgt) canvas.height = hgt
          const c = canvas.getContext('2d')
          if (c) {
            c.clearRect(0, 0, w, hgt)
            c.fillStyle = '#4d6bfe'
            const t = Date.now() / 200
            for (let i = 0; i < 24; i++) {
              const bh = 8 + Math.abs(Math.sin(t + i * 0.4)) * (hgt * 0.6)
              c.fillRect(i * (w / 24) + 2, hgt - bh, w / 24 - 4, bh)
            }
          }
          raf = requestAnimationFrame(draw)
        }
        draw()
        return () => cancelAnimationFrame(raf)
      }, [mode])
      return h('div', { 'data-gr': 'visualizer' }, h('canvas', { ref }))
    }

    function PlayerView() {
      const s = useStore()
      const st = s.station || (s.home && s.home.seed[0])
      React.useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') setState({ view: 'browse' }) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [])
      if (!st) return null
      return h('div', { 'data-gr': 'player-view' },
        h('div', { 'data-gr': 'player-station' }, st.name),
        h('div', null, st.frequency || st.codec + ' ' + st.bitrate),
        h('div', null, (st.country || '') + ' · ' + (st.tags || []).join(' ')),
        h(Visualizer, { mode: s.visualMode }),
        h('div', null, ['bars', 'ring', 'wave'].map((mode) => h('button', {
          key: mode, 'data-gr': 'visual-mode', 'data-mode': mode,
          'aria-pressed': s.visualMode === mode,
          onClick: () => { setState({ visualMode: mode }); writeStore('visualMode', mode) },
        }, mode))),
        h('button', { 'data-gr': 'prev', onClick: () => { const list = s.home ? s.home.seed : []; const i = list.findIndex((x) => x.id === st.id); playStation(list[(i - 1 + list.length) % list.length]) } }, '上一台'),
        h('button', { 'data-gr': 'play', onClick: togglePlay }, s.playing ? '暂停' : '播放'),
        h('button', { 'data-gr': 'next', onClick: () => { const list = s.home ? s.home.seed : []; const i = list.findIndex((x) => x.id === st.id); playStation(list[(i + 1) % list.length]) } }, '下一台'),
        h('button', { 'data-gr': 'favorite', onClick: () => toggleFavorite(st) }, '收藏'),
        h('input', { 'data-gr': 'volume', type: 'range', min: 0, max: 1, step: 0.01, value: s.volume, onChange: (e) => setVolume(e.target.value) }),
        h('button', { 'data-gr': 'fullscreen', onClick: () => { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}) } }, '全屏'),
        h('button', { 'data-gr': 'back', onClick: () => setState({ view: 'browse' }) }, '返回'))
    }

    function Toast() {
      const s = useStore()
      return s.toast ? h('div', { 'data-gr': 'toast' }, s.toast) : null
    }

    function Page() {
      const s = useStore()
      React.useEffect(() => { if (!state.home && !state.homeLoading) loadHome(false) }, [])
      if (s.view === 'player') return h('div', { className: 'gr-root', 'data-gr': 'root', 'data-playing': String(s.playing) }, h(PlayerView), s.toast ? h(Toast) : null)
      return h('div', { className: 'gr-root', 'data-gr': 'root', 'data-playing': String(s.playing) },
        h(Header),
        h('div', null, h(Hero), h(Filters), h(HomeSections)),
        s.toast ? h(Toast) : null)
    }

    function MiniPlayer(props) {
      const s = useStore()
      const panelInfo = props && typeof props.usePanelInfo === 'function' ? props.usePanelInfo() : null
      const activePanel = panelInfo && (panelInfo.activePanelId || panelInfo.panelId)
      if (!s.station || s.foreignPlaying || activePanel === 'global-radio') return null
      const wide = props && props.wide !== false
      if (!wide) {
        return h('button', {
          'data-gr': 'mini-player', 'data-playing': String(s.playing), title: s.station.name,
          onClick: () => { if (winLayout) winLayout.selectPanel('global-radio'); setState({ view: 'player' }) },
        }, h('img', { src: API + '/img?url=' + encodeURIComponent(s.station.logo || s.station.id), width: 36, height: 36, alt: '' }))
      }
      return h('div', { 'data-gr': 'mini-player', 'data-playing': String(s.playing) },
        h('img', { src: API + '/img?url=' + encodeURIComponent(s.station.logo || s.station.id), width: 40, height: 40, alt: '' }),
        h('div', null,
          h('div', null, s.station.name),
          h('div', null, s.station.frequency || '')),
        h('button', { 'data-gr': 'mini-prev', onClick: () => { const list = s.home ? s.home.seed : []; const i = list.findIndex((x) => x.id === s.station.id); playStation(list[(i - 1 + list.length) % list.length]) } }, '⏮'),
        h('button', { 'data-gr': 'mini-toggle', onClick: togglePlay }, s.playing ? '⏸' : '▶'),
        h('button', { 'data-gr': 'mini-next', onClick: () => { const list = s.home ? s.home.seed : []; const i = list.findIndex((x) => x.id === s.station.id); playStation(list[(i + 1) % list.length]) } }, '⏭'),
        h('input', { 'data-gr': 'volume', type: 'range', min: 0, max: 1, step: 0.01, value: s.volume, onChange: (e) => setVolume(e.target.value) }))
    }

    function PanelIcon(props) {
      return h('img', { src: API + '/icon?size=' + (props && props.size === 20 ? 64 : 128), width: 20, height: 20, alt: '全球电台' })
    }

    let winLayout = null
    return {
      apply(ctx) {
        winLayout = ctx.layout
        const t = ctx.locale.bind('global-radio')
        ctx.effect(() => {
          const style = document.createElement('style')
          style.textContent = '.gr-root{height:100%;overflow:auto} .sm-station{display:inline-flex;gap:8px;align-items:center;margin:4px}'
          document.head.appendChild(style)
          const a = ensureAudio()
          const onAnyPlay = () => {} // document capture 兜底由 MutationObserver 覆盖
          const observer = new MutationObserver((mutations) => {
            for (const m of mutations) for (const node of m.addedNodes) {
              if (node.nodeType !== 1) continue
              const media = node.matches && node.matches('audio,video') ? [node] : []
              if (node.querySelectorAll) media.push(...node.querySelectorAll('audio,video'))
              for (const el of media) {
                if (el === a) continue
                el.addEventListener('play', onForeignPlay)
              }
            }
          })
          observer.observe(document.body, { childList: true, subtree: true })
          document.addEventListener('play', (event) => {
            const el = event.target
            if (el && (el.tagName === 'AUDIO' || el.tagName === 'VIDEO') && el !== a) onForeignPlay()
          }, true)
          return () => {
            observer.disconnect()
            try { a.pause() } catch { /* ignore */ }
            a.remove()
            audioEl = null
            style.remove()
          }
        })
        function registerAll() {
          ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'global-radio' }, Page))
          ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
            name: 'sidebar.panellist', id: 'global-radio', order: 40, label: () => t('meta.title'),
          }, PanelIcon))
          ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
            name: 'sidebar.footer.action', id: 'radio-mini', order: 20,
          }, MiniPlayer))
        }
        ctx.locale.register('global-radio', 'zh', { 'meta.title': '全球电台', 'meta.tagline': '世界在耳边' })
        ctx.locale.register('global-radio', 'en', { 'meta.title': 'Global Radio', 'meta.tagline': 'The world in your ears' })
        registerAll()
        loadHome(false)
        fetch(API + '/status').then((r) => r.json()).then((j) => { if (j.ok) setState({ status: j.data.service }) }).catch(() => {})
      },
    }
  },
})
