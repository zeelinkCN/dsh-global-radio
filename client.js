window.__ModuleLoader__.load({
  id: '@local/global-radio',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'global-radio'
    const API = '/global-radio/api'
    const ICON_SRC = API + '/icon?size=128&v=7'
    const LS_PREFIX = 'global-radio:'
    const VISUAL_MODES = ['bars', 'wave', 'ring']

    /* ------------------------------------------------------------------ *
     * 文案：中文为默认与兜底；英文走 locale 注册
     * ------------------------------------------------------------------ */
    const ZH = {
      'meta.title': '全球电台',
      'meta.tagline': '世界在耳边',
      'app.subtitle': '实时 · 全球 · 免费',
      'welcome.title': '从世界各地的电台开始',
      'welcome.desc': '实时新闻、音乐与谈话，挑一个精选电台即刻收听',
      'action.playPicks': '播放精选',
      'action.viewAll': '查看全部',
      'action.loadMore': '加载更多',
      'action.more': '更多',
      'section.genres': '按类型听',
      'section.genresHint': '点一下，随机挑一个电台开始播放',
      'section.trending': '全球热门',
      'section.chinese': '华语电台',
      'section.picks': '编辑精选',
      'genre.news': '新闻资讯',
      'genre.news.sub': '随时听最新消息',
      'genre.world': '世界之声',
      'genre.world.sub': '全球热门随机播放',
      'genre.classical': '古典音乐',
      'genre.classical.sub': '大师与交响',
      'genre.jazz': '爵士蓝调',
      'genre.jazz.sub': '慵懒与即兴',
      'genre.electronic': '电子律动',
      'genre.electronic.sub': '电音与舞曲',
      'genre.rock': '摇滚现场',
      'genre.rock.sub': '经典与独立',
      'genre.talk': '谈话电台',
      'genre.talk.sub': '聊天与故事',
      'genre.china': '华语电台',
      'genre.china.sub': '中国大陆/香港/台湾',
      'genre.japan': '日本电台',
      'genre.japan.sub': 'J-Pop 与城市之声',
      'genre.korea': '韩国电台',
      'genre.korea.sub': 'K-Pop 与音乐',
      'genre.uk': '英国电台',
      'genre.uk.sub': 'BBC 与英伦摇滚',
      'genre.france': '法国电台',
      'genre.france.sub': '香颂与古典',
      'section.cities': '城市电台',
      'section.citiesHint': '点城市，查看当地广播与地方台',
      'city.collectionHint': '当地广播与网络地方台',
      'city.beijing': '北京', 'city.shanghai': '上海', 'city.guangzhou': '广州', 'city.shenzhen': '深圳',
      'city.chengdu': '成都', 'city.wuhan': '武汉', 'city.hangzhou': '杭州', 'city.nanjing': '南京',
      'city.tianjin': '天津', 'city.chongqing': '重庆', 'city.xian': '西安', 'city.changsha': '长沙',
      'city.zhengzhou': '郑州', 'city.suzhou': '苏州', 'city.xiamen': '厦门', 'city.hongkong': '香港',
      'city.taipei': '台北', 'city.macau': '澳门', 'city.qingdao': '青岛', 'city.kunming': '昆明',
      'banner.pick': '为你精选',
      'banner.shuffle': '换一批',
      'banner.hint': '从精选里随机挑选 3 个',
      'banner.play': '立即收听',
      'status.randomPlay': '随机播放：{name}',
      'status.noGenre': '这个分类暂时没有可播电台',
      'status.picking': '正在挑选电台…',
      'status.fallback': '已切换到备用源：{name}',
      'status.unavailable': '「{name}」暂时无法播放',
      'status.skip': '已自动换台：{name}',
      'search.placeholder': '搜索电台、城市或类型，例如 BBC / 北京 / 爵士',
      'search.clear': '清空搜索',
      'search.loading': '正在搜索电台…',
      'search.empty': '没有找到与「{q}」匹配的电台',
      'search.emptyHint': '换个关键词，或点「全球」看看热门电台',
      'search.results': '搜索结果',
      'section.seed': '编辑精选',
      'section.favorites': '我的收藏',
      'section.recent': '最近收听',
      'section.popular': '全球热门',
      'section.china': '华语电台',
      'section.popularHint': '按收听量排序的世界各地电台',
      'section.chinaHint': '中国大陆、香港与台湾地区',
      'section.seedHint': '人工挑选、实测可播的电台',
      'label.nowPlaying': '正在播出',
      'label.notPlaying': '未播放',
      'label.onAir': '直播中',
      'label.connecting': '连接中…',
      'label.live': 'LIVE',
      'label.frequency': '频率',
      'label.country': '国家/地区',
      'label.bitrate': '音质',
      'label.tags': '类型',
      'label.volume': '音量',
      'label.visual': '可视化',
      'label.allCountries': '全球',
      'label.allGenres': '全部类型',
      'label.stationCount': '{n} 个电台',
      'label.listening': '正在收听',
      'label.back': '返回',
      'label.online': '在线电台',
      'action.play': '播放',
      'action.pause': '暂停',
      'action.resume': '继续播放',
      'action.prev': '上一个电台',
      'action.next': '下一个电台',
      'action.retry': '重试',
      'action.refresh': '刷新',
      'action.favorite': '收藏',
      'action.unfavorite': '取消收藏',
      'action.mute': '静音',
      'action.unmute': '取消静音',
      'action.openPlayer': '进入全屏播放',
      'action.fullscreen': '全屏',
      'action.closePlayer': '收起播放页',
      'action.openPanel': '打开全球电台',
      'action.playStation': '播放 {name}',
      'view.bars': '频谱',
      'view.wave': '波形',
      'view.ring': '环形',
      'player.title': '正在收听',
      'player.hint': 'Esc 返回列表，播放不中断',
      'player.volume': '音量',
      'player.paused': '已暂停 · 按空格或点击继续',
      'mini.title': '全球电台 · 迷你播放器',
      'mini.open': '打开全球电台',
      'mini.expand': '进入全屏播放',
      'status.error': '连接失败',
      'status.retrying': '正在重连…',
      'status.favoriteAdded': '已加入收藏',
      'status.favoriteRemoved': '已取消收藏',
      'error.network': '网络错误，请检查网络后重试',
      'error.playback': '该电台暂时无法播放，换一个试试',
      'error.hlsMissing': '当前构建缺少 HLS 运行时，无法播放 m3u8 电台',
      'error.empty': '这里还没有内容',
      'error.offline': '正在等待网络…',
      'error.missingStation': '找不到这个电台',
      'country.CN': '中国',
      'country.HK': '中国香港',
      'country.TW': '中国台湾',
      'country.US': '美国',
      'country.GB': '英国',
      'country.FR': '法国',
      'country.DE': '德国',
      'country.JP': '日本',
      'country.KR': '韩国',
      'country.RU': '俄罗斯',
      'country.IT': '意大利',
      'country.ES': '西班牙',
      'country.CA': '加拿大',
      'country.AU': '澳大利亚',
      'country.BR': '巴西',
      'country.IN': '印度',
      'tag.news': '新闻',
      'tag.music': '音乐',
      'tag.talk': '谈话',
      'tag.jazz': '爵士',
      'tag.classical': '古典',
      'tag.electronic': '电子',
      'tag.rock': '摇滚',
      'tag.pop': '流行',
      'tag.sports': '体育',
      'tag.culture': '文化',
    }

    const EN = {
      'meta.title': 'Global Radio',
      'meta.tagline': 'The world, on air',
      'app.subtitle': 'Live · Worldwide · Free',
      'welcome.title': 'Start with a station from somewhere in the world',
      'welcome.desc': 'Live news, music and talk — pick one of these verified stations',
      'action.playPicks': 'Play picks',
      'action.viewAll': 'View all',
      'action.loadMore': 'Load more',
      'action.more': 'More',
      'section.genres': 'Listen by genre',
      'section.genresHint': 'Tap one to start a random station',
      'section.trending': 'Trending worldwide',
      'section.chinese': 'Chinese-language',
      'section.picks': 'Editor’s picks',
      'genre.news': 'News',
      'genre.news.sub': 'Headlines around the clock',
      'genre.world': 'World voices',
      'genre.world.sub': 'Random worldwide hits',
      'genre.classical': 'Classical',
      'genre.classical.sub': 'Masters & symphonies',
      'genre.jazz': 'Jazz & blues',
      'genre.jazz.sub': 'Smooth and improvised',
      'genre.electronic': 'Electronic',
      'genre.electronic.sub': 'Beats & dance',
      'genre.rock': 'Rock',
      'genre.rock.sub': 'Classic & indie',
      'genre.talk': 'Talk radio',
      'genre.talk.sub': 'Chats and stories',
      'genre.china': 'Chinese-language',
      'genre.china.sub': 'Mainland, HK & Taiwan',
      'genre.japan': 'Japan',
      'genre.japan.sub': 'J-Pop & city sounds',
      'genre.korea': 'Korea',
      'genre.korea.sub': 'K-Pop & music',
      'genre.uk': 'United Kingdom',
      'genre.uk.sub': 'BBC & Britrock',
      'genre.france': 'France',
      'genre.france.sub': 'Chanson & classics',
      'section.cities': 'City stations',
      'section.citiesHint': 'Pick a city to browse its local radio',
      'city.collectionHint': 'Local broadcast and online city stations',
      'city.beijing': 'Beijing', 'city.shanghai': 'Shanghai', 'city.guangzhou': 'Guangzhou', 'city.shenzhen': 'Shenzhen',
      'city.chengdu': 'Chengdu', 'city.wuhan': 'Wuhan', 'city.hangzhou': 'Hangzhou', 'city.nanjing': 'Nanjing',
      'city.tianjin': 'Tianjin', 'city.chongqing': 'Chongqing', 'city.xian': "Xi'an", 'city.changsha': 'Changsha',
      'city.zhengzhou': 'Zhengzhou', 'city.suzhou': 'Suzhou', 'city.xiamen': 'Xiamen', 'city.hongkong': 'Hong Kong',
      'city.taipei': 'Taipei', 'city.macau': 'Macau', 'city.qingdao': 'Qingdao', 'city.kunming': 'Kunming',
      'banner.pick': 'Featured',
      'banner.shuffle': 'Shuffle',
      'banner.hint': 'Three random picks from the editor’s list',
      'banner.play': 'Listen now',
      'status.randomPlay': 'Shuffled: {name}',
      'status.noGenre': 'No playable station in this category yet',
      'status.picking': 'Picking a station…',
      'status.fallback': 'Switched to backup source: {name}',
      'status.unavailable': '“{name}” is unavailable right now',
      'status.skip': 'Skipped to: {name}',
      'search.placeholder': 'Search a station, city or genre, e.g. BBC / Beijing / jazz',
      'search.clear': 'Clear search',
      'search.loading': 'Searching stations…',
      'search.empty': 'No stations match “{q}”',
      'search.emptyHint': 'Try another keyword, or tap “Worldwide” to browse popular stations',
      'search.results': 'Search results',
      'section.seed': 'Editor’s picks',
      'section.favorites': 'Favorites',
      'section.recent': 'Recently played',
      'section.popular': 'Trending worldwide',
      'section.china': 'Chinese-language stations',
      'section.popularHint': 'Most-listened stations from around the world',
      'section.chinaHint': 'Mainland China, Hong Kong and Taiwan',
      'section.seedHint': 'Hand-picked, verified-playable stations',
      'label.nowPlaying': 'Now playing',
      'label.notPlaying': 'Not playing',
      'label.onAir': 'On air',
      'label.connecting': 'Connecting…',
      'label.live': 'LIVE',
      'label.frequency': 'Frequency',
      'label.country': 'Country / region',
      'label.bitrate': 'Quality',
      'label.tags': 'Genres',
      'label.volume': 'Volume',
      'label.visual': 'Visualizer',
      'label.allCountries': 'Worldwide',
      'label.allGenres': 'All genres',
      'label.stationCount': '{n} stations',
      'label.listening': 'Listening',
      'label.back': 'Back',
      'label.online': 'Online radio',
      'action.play': 'Play',
      'action.pause': 'Pause',
      'action.resume': 'Resume',
      'action.prev': 'Previous station',
      'action.next': 'Next station',
      'action.retry': 'Retry',
      'action.refresh': 'Refresh',
      'action.favorite': 'Favorite',
      'action.unfavorite': 'Remove from favorites',
      'action.mute': 'Mute',
      'action.unmute': 'Unmute',
      'action.openPlayer': 'Open immersive player',
      'action.fullscreen': 'Fullscreen',
      'action.closePlayer': 'Back to list',
      'action.openPanel': 'Open Global Radio',
      'action.playStation': 'Play {name}',
      'view.bars': 'Spectrum',
      'view.wave': 'Waveform',
      'view.ring': 'Radial',
      'player.title': 'Now listening',
      'player.hint': 'Press Esc to go back — playback continues',
      'player.volume': 'Volume',
      'player.paused': 'Paused · press space or tap to resume',
      'mini.title': 'Global Radio · mini player',
      'mini.open': 'Open Global Radio',
      'mini.expand': 'Open immersive player',
      'status.error': 'Connection failed',
      'status.retrying': 'Reconnecting…',
      'status.favoriteAdded': 'Added to favorites',
      'status.favoriteRemoved': 'Removed from favorites',
      'error.network': 'Network error. Check your connection and retry.',
      'error.playback': 'This station cannot be played right now. Try another one.',
      'error.hlsMissing': 'This build has no HLS runtime, so m3u8 stations cannot play.',
      'error.empty': 'Nothing here yet',
      'error.offline': 'Waiting for the network…',
      'error.missingStation': 'This station is missing',
      'country.CN': 'China',
      'country.HK': 'Hong Kong',
      'country.TW': 'Taiwan',
      'country.US': 'United States',
      'country.GB': 'United Kingdom',
      'country.FR': 'France',
      'country.DE': 'Germany',
      'country.JP': 'Japan',
      'country.KR': 'South Korea',
      'country.RU': 'Russia',
      'country.IT': 'Italy',
      'country.ES': 'Spain',
      'country.CA': 'Canada',
      'country.AU': 'Australia',
      'country.BR': 'Brazil',
      'country.IN': 'India',
      'tag.news': 'News',
      'tag.music': 'Music',
      'tag.talk': 'Talk',
      'tag.jazz': 'Jazz',
      'tag.classical': 'Classical',
      'tag.electronic': 'Electronic',
      'tag.rock': 'Rock',
      'tag.pop': 'Pop',
      'tag.sports': 'Sports',
      'tag.culture': 'Culture',
    }

    let translate = (key, params) => interpolate(ZH[key] || key, params)
    const localeListeners = new Set()
    let localeVersion = 0

    function interpolate(text, params) {
      if (!params) return text
      return String(text).replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))
    }

    function useT() {
      const [, setTick] = React.useState(0)
      React.useEffect(() => {
        const listener = () => setTick((value) => value + 1)
        localeListeners.add(listener)
        return () => {
          localeListeners.delete(listener)
        }
      }, [])
      return translate
    }

    function bumpLocale() {
      localeVersion += 1
      localeListeners.forEach((listener) => {
        try {
          listener()
        } catch {
          /* ignore */
        }
      })
    }

    /* ------------------------------------------------------------------ *
     * 通用工具
     * ------------------------------------------------------------------ */
    const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0))
    const cx = (...parts) => parts.filter(Boolean).join(' ')
    const safeText = (value) => (typeof value === 'string' ? value : '')

    function qs(params) {
      const search = new URLSearchParams()
      Object.keys(params || {}).forEach((key) => {
        const value = params[key]
        if (value === undefined || value === null || value === '') return
        search.set(key, String(value))
      })
      return search.toString()
    }

    function apiUrl(path, params) {
      const query = params ? qs(params) : ''
      return API + path + (query ? '?' + query : '')
    }

    async function apiGet(path, params) {
      const response = await fetch(apiUrl(path, params), {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      let payload = null
      try {
        payload = await response.json()
      } catch {
        throw new Error(translate('error.network'))
      }
      if (!payload || payload.ok !== true) {
        const err = new Error((payload && payload.error) || translate('error.network'))
        err.code = payload && payload.code
        throw err
      }
      return payload.data
    }

    async function apiPost(path, body) {
      const response = await fetch(apiUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body || {}),
        cache: 'no-store',
      })
      let payload = null
      try {
        payload = await response.json()
      } catch {
        return null
      }
      if (!payload || payload.ok !== true) return null
      return payload.data
    }

    const streamUrl = (station) => apiUrl('/stream', { url: station && station.url, id: station && station.id })
    const hlsUrl = (station) => apiUrl('/hls', { url: station && station.url })
    const imageUrl = (station) => (station && station.logo ? apiUrl('/img', { url: station.logo }) : '')

    function countryLabel(code, fallback) {
      if (!code) return safeText(fallback)
      const key = 'country.' + String(code).toUpperCase()
      const text = translate(key)
      return text === key ? safeText(fallback) || code : text
    }

    function tagLabel(tag) {
      if (!tag) return ''
      const key = 'tag.' + String(tag).toLowerCase()
      const text = translate(key)
      return text === key ? tag : text
    }

    function formatBitrate(station) {
      if (!station) return ''
      if (station.bitrate > 0) return station.codec && station.codec !== 'UNKNOWN' ? `${station.codec} ${station.bitrate} kbps` : `${station.bitrate} kbps`
      if (station.codec && station.codec !== 'UNKNOWN') return station.codec
      return translate('label.online')
    }

    function stationFrequency(station) {
      if (!station) return ''
      return station.frequency || formatBitrate(station)
    }

    function frequencyInfo(station) {
      if (!station) return null
      const raw = safeText(station.frequency).trim()
      if (!raw) return null
      const match = raw.match(/^(FM|AM|MW|LW|SW)\s*[:：\-]?\s*([\d.,]+)/i)
      if (match) {
        const type = /^(A|M|L|S)/i.test(match[1]) ? 'AM' : 'FM'
        const value = match[2].replace(',', '.')
        return { type, value, unit: type === 'AM' ? 'kHz' : 'MHz' }
      }
      const numeric = raw.match(/([\d.,]+)/)
      if (!numeric) return null
      const type = /中波|短波|\bAM\b/i.test(raw) ? 'AM' : 'FM'
      const value = numeric[1].replace(',', '.')
      return { type, value, unit: type === 'AM' ? 'kHz' : 'MHz' }
    }

    function frequencyText(station) {
      const info = frequencyInfo(station)
      if (info) return `${info.type} ${info.value}`
      return station ? translate('label.online') : ''
    }

    function stationMeta(station) {
      if (!station) return ''
      const parts = []
      if (station.country) parts.push(countryLabel(station.countryCode, station.country))
      if (station.city && station.city !== station.country) parts.push(station.city)
      const bitrate = formatBitrate(station)
      if (bitrate) parts.push(bitrate)
      return parts.join(' · ')
    }

    function initials(name) {
      const text = safeText(name).trim()
      if (!text) return '·'
      const latin = text.split(/\s+/).filter(Boolean)
      if (latin.length > 1 && /^[\x20-\x7f]+$/.test(text)) {
        return (latin[0][0] + latin[1][0]).toUpperCase()
      }
      return Array.from(text).slice(0, 2).join('')
    }

    function hashHue(text) {
      let hash = 0
      const source = safeText(text) || 'radio'
      for (let i = 0; i < source.length; i += 1) hash = (hash * 31 + source.charCodeAt(i)) % 360
      return hash
    }

    function stationPalette(station) {
      const hue = hashHue(station && (station.name || station.id))
      return {
        hue,
        a: `hsl(${hue} 82% 58%)`,
        b: `hsl(${(hue + 42) % 360} 88% 46%)`,
        glow: `hsla(${hue} 90% 60% / 0.45)`,
      }
    }

    function stationArtworkStyle(station) {
      const palette = stationPalette(station)
      return { background: `linear-gradient(145deg, ${palette.a}, ${palette.b})` }
    }

    /* ------------------------------------------------------------------ *
     * 持久化
     * ------------------------------------------------------------------ */
    function readStore(key, fallback) {
      try {
        const raw = window.localStorage.getItem(LS_PREFIX + key)
        if (!raw) return fallback
        const value = JSON.parse(raw)
        return value === undefined || value === null ? fallback : value
      } catch {
        return fallback
      }
    }

    function writeStore(key, value) {
      try {
        window.localStorage.setItem(LS_PREFIX + key, JSON.stringify(value))
      } catch {
        /* ignore */
      }
    }

    /* ------------------------------------------------------------------ *
     * 全局 store（模块级单例；页面 / 迷你条 / 播放页共享）
     * ------------------------------------------------------------------ */
    const initialVolume = clamp(readStore('volume', 0.8), 0, 1)
    const initialMuted = !!readStore('muted', false)
    const initialVisual = VISUAL_MODES.includes(readStore('visualMode', 'bars')) ? readStore('visualMode', 'bars') : 'bars'

    let state = {
      station: null,
      playing: false,
      loading: false,
      error: '',
      volume: initialVolume,
      muted: initialMuted,
      favorites: readStore('favorites', []),
      recent: readStore('recent', []),
      visualMode: initialVisual,
      otherPlaying: false,
      view: 'browse',
      collection: null,
      toast: null,
      home: null,
      homeLoading: false,
      homeError: '',
      results: null,
      resultsLoading: false,
      resultsError: '',
      query: { q: '', country: 'ALL', tag: '' },
      pageMounted: false,
      queue: [],
      queueIndex: -1,
      unavailableIds: [],
    }

    const storeListeners = new Set()
    const getSnapshot = () => state
    const subscribeStore = (listener) => {
      storeListeners.add(listener)
      return () => storeListeners.delete(listener)
    }

    function emitStore() {
      storeListeners.forEach((listener) => {
        try {
          listener()
        } catch {
          /* ignore */
        }
      })
    }

    function setState(patch) {
      const next = typeof patch === 'function' ? patch(state) : patch
      if (!next) return
      state = Object.assign({}, state, next)
      emitStore()
    }

    function useRadioStore() {
      if (typeof React.useSyncExternalStore === 'function') {
        return React.useSyncExternalStore(subscribeStore, getSnapshot, getSnapshot)
      }
      const [snapshot, setSnapshot] = React.useState(getSnapshot)
      React.useEffect(() => subscribeStore(() => setSnapshot(getSnapshot())), [])
      return snapshot
    }

    let toastTimer = null
    function toast(text, kind) {
      if (!text) return
      setState({ toast: { text, kind: kind || 'info', id: Date.now() } })
      if (toastTimer) clearTimeout(toastTimer)
      toastTimer = setTimeout(() => setState({ toast: null }), kind === 'error' ? 6000 : 3400)
    }

    function isFavorite(id) {
      return (state.favorites || []).some((item) => item && item.id === id)
    }

    function toggleFavorite(station) {
      if (!station) return
      const exists = isFavorite(station.id)
      const next = exists
        ? state.favorites.filter((item) => item && item.id !== station.id)
        : [station, ...state.favorites].slice(0, 100)
      setState({ favorites: next })
      writeStore('favorites', next)
      toast(exists ? translate('status.favoriteRemoved') : translate('status.favoriteAdded'), exists ? 'info' : 'success')
    }

    function addRecent(station) {
      if (!station) return
      const next = [station, ...(state.recent || []).filter((item) => item && item.id !== station.id)].slice(0, 12)
      setState({ recent: next })
      writeStore('recent', next)
    }

    function setVolume(value) {
      const volume = clamp(value, 0, 1)
      setState({ volume, muted: volume === 0 ? state.muted : false })
      writeStore('volume', volume)
      if (audioEl) audioEl.volume = state.muted ? 0 : volume
    }

    function toggleMute() {
      const muted = !state.muted
      setState({ muted })
      writeStore('muted', muted)
      if (audioEl) audioEl.volume = muted ? 0 : state.volume
    }

    function setView(view) {
      setState({ view })
    }

    function setVisualMode(mode) {
      if (!VISUAL_MODES.includes(mode)) return
      setState({ visualMode: mode })
      writeStore('visualMode', mode)
    }

    /* ------------------------------------------------------------------ *
     * 音频引擎 + 全局互斥（谁在播，另一个自动停）
     *
     * 网易云音乐插件使用挂在 document.body 上的 <audio data-nm-audio>，并监听自身
     * 'pause' 事件同步 UI。因此这里采用「通用 media 仲裁」：
     *   - 自家 audio 开始播放 → 暂停页面上其它所有 audio/video（只调 pause，不改其 src/volume）
     *   - 其它 audio/video 开始播放 → 暂停自家 audio
     * 两个方向都不需要修改网易云插件源码。
     * ------------------------------------------------------------------ */
    let audioEl = null
    let hlsInstance = null
    let audioCtx = null
    let analyserNode = null
    let freqBytes = null
    let timeBytes = null
    let analyserFailed = false
    let playToken = 0
    const boundMedia = new WeakSet()
    let mediaObserver = null
    let mediaScanTimer = null

    function mediaElements() {
      const list = []
      try {
        document.querySelectorAll('audio,video').forEach((el) => list.push(el))
      } catch {
        /* ignore */
      }
      return list
    }

    function otherMediaPlaying() {
      return mediaElements().some((el) => el !== audioEl && !el.paused && !el.ended)
    }

    function refreshOtherPlaying() {
      const any = otherMediaPlaying()
      if (any !== state.otherPlaying) setState({ otherPlaying: any })
    }

    function pauseOtherMedia(except) {
      mediaElements().forEach((el) => {
        if (!el || el === except) return
        if (!el.paused) {
          try {
            el.pause()
          } catch {
            /* ignore */
          }
        }
      })
    }

    function onOtherMediaPlay(event) {
      const el = event && (event.currentTarget || event.target)
      if (!el || el === audioEl) return
      if (el.tagName !== 'AUDIO' && el.tagName !== 'VIDEO') return
      if (audioEl && !audioEl.paused) {
        try {
          audioEl.pause()
        } catch {
          /* ignore */
        }
      }
      setState({ otherPlaying: true })
    }

    function bindMediaElement(el) {
      if (!el || el === audioEl || boundMedia.has(el)) return
      boundMedia.add(el)
      el.addEventListener('play', onOtherMediaPlay)
      el.addEventListener('playing', refreshOtherPlaying)
      el.addEventListener('pause', refreshOtherPlaying)
      el.addEventListener('ended', refreshOtherPlaying)
    }

    function scanMedia() {
      mediaElements().forEach(bindMediaElement)
      refreshOtherPlaying()
    }

    function onDocumentPlayCapture(event) {
      const el = event && event.target
      if (!el || el === audioEl) return
      if (el.tagName !== 'AUDIO' && el.tagName !== 'VIDEO') return
      onOtherMediaPlay({ currentTarget: el })
    }

    function setupMediaArbitration() {
      scanMedia()
      try {
        if (typeof MutationObserver !== 'undefined' && document.body) {
          mediaObserver = new MutationObserver(() => scanMedia())
          mediaObserver.observe(document.body, { childList: true, subtree: true })
        }
      } catch {
        /* ignore */
      }
      mediaScanTimer = setInterval(scanMedia, 2500)
      document.addEventListener('play', onDocumentPlayCapture, true)
    }

    function teardownMediaArbitration() {
      document.removeEventListener('play', onDocumentPlayCapture, true)
      if (mediaObserver) {
        try {
          mediaObserver.disconnect()
        } catch {
          /* ignore */
        }
        mediaObserver = null
      }
      if (mediaScanTimer) {
        clearInterval(mediaScanTimer)
        mediaScanTimer = null
      }
    }

    function destroyHls() {
      const hls = hlsInstance
      hlsInstance = null
      if (!hls) return
      try {
        hls.destroy()
      } catch {
        /* ignore */
      }
    }

    function ensureAnalyser() {
      if (analyserNode || analyserFailed) return analyserNode
      if (!audioEl) return null
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext
        if (!Ctx) {
          analyserFailed = true
          return null
        }
        audioCtx = new Ctx()
        const source = audioCtx.createMediaElementSource(audioEl)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.82
        source.connect(analyser)
        analyser.connect(audioCtx.destination)
        analyserNode = analyser
        freqBytes = new Uint8Array(analyser.frequencyBinCount)
        timeBytes = new Uint8Array(analyser.fftSize)
      } catch {
        analyserFailed = true
        analyserNode = null
      }
      return analyserNode
    }

    function readAnalyserData(kind) {
      if (!analyserNode || !audioEl || audioEl.paused) return null
      try {
        if (kind === 'time') {
          analyserNode.getByteTimeDomainData(timeBytes)
          return timeBytes
        }
        analyserNode.getByteFrequencyData(freqBytes)
        return freqBytes
      } catch {
        return null
      }
    }

    function updateMediaSession(station) {
      if (!station || typeof navigator === 'undefined' || !navigator.mediaSession || typeof MediaMetadata === 'undefined') return
      try {
        const artwork = []
        const logo = imageUrl(station)
        if (logo) artwork.push({ src: logo, sizes: '512x512' })
        navigator.mediaSession.metadata = new MediaMetadata({
          title: station.name || '',
          artist: stationMeta(station),
          album: translate('meta.title'),
          artwork,
        })
      } catch {
        /* ignore */
      }
    }

    function syncMediaSessionState(playing) {
      if (typeof navigator === 'undefined' || !navigator.mediaSession) return
      try {
        navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
      } catch {
        /* ignore */
      }
    }

    function bindMediaSessionActions() {
      if (typeof navigator === 'undefined' || !navigator.mediaSession) return
      try {
        navigator.mediaSession.setActionHandler('play', () => togglePlay())
        navigator.mediaSession.setActionHandler('pause', () => {
          if (state.playing) pauseRadio()
        })
        navigator.mediaSession.setActionHandler('previoustrack', () => playPrev())
        navigator.mediaSession.setActionHandler('nexttrack', () => playNext())
      } catch {
        /* ignore */
      }
    }

    function getAudio() {
      if (audioEl) return audioEl
      audioEl = document.createElement('audio')
      audioEl.setAttribute('data-gr-audio', '')
      audioEl.preload = 'none'
      audioEl.volume = state.muted ? 0 : state.volume
      audioEl.style.display = 'none'
      audioEl.addEventListener('playing', () => {
        clearPlayWatchdog()
        setState({ playing: true, loading: false, error: '' })
        pauseOtherMedia(audioEl)
        refreshOtherPlaying()
        updateMediaSession(state.station)
        syncMediaSessionState(true)
        ensureAnalyser()
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {})
        }
      })
      audioEl.addEventListener('pause', () => {
        clearPlayWatchdog()
        setState({ playing: false, loading: false })
        syncMediaSessionState(false)
      })
      audioEl.addEventListener('waiting', () => setState({ loading: true }))
      audioEl.addEventListener('stalled', () => setState({ loading: true }))
      audioEl.addEventListener('canplay', () => setState({ loading: false }))
      audioEl.addEventListener('error', () => {
        if (!state.station) return
        handlePlaybackFailure('audio-error')
      })
      audioEl.addEventListener('ended', () => {
        setState({ playing: false, loading: false })
        // 直播流理论上不会 ended；若发生，尝试备用源
        if (state.station) handlePlaybackFailure('ended')
      })
      document.body.appendChild(audioEl)
      return audioEl
    }

    async function loadHlsRuntime() {
      if (typeof window === 'undefined') return null
      if (window.Hls) return window.Hls
      if (loadHlsRuntime.pending) return loadHlsRuntime.pending
      loadHlsRuntime.pending = new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.setAttribute('data-gr-hls', '')
        script.src = API + '/hls-runtime.js'
        script.async = true
        script.onload = () => {
          loadHlsRuntime.pending = null
          resolve(window.Hls || null)
        }
        script.onerror = () => {
          loadHlsRuntime.pending = null
          try {
            script.remove()
          } catch {
            /* ignore */
          }
          reject(new Error('hls runtime missing'))
        }
        document.head.appendChild(script)
      })
      return loadHlsRuntime.pending
    }

    let playWatchdog = null
    let fallbackState = { list: [], index: 0, requested: false }

    function clearPlayWatchdog() {
      if (playWatchdog) {
        clearTimeout(playWatchdog)
        playWatchdog = null
      }
    }

    function armPlayWatchdog(token, stationId) {
      clearPlayWatchdog()
      playWatchdog = setTimeout(() => {
        playWatchdog = null
        if (token !== playToken) return
        if (!state.station || state.station.id !== stationId) return
        if (state.playing) return
        handlePlaybackFailure('timeout')
      }, 9000)
    }

    function resetFallback(list) {
      fallbackState = { list: Array.isArray(list) ? list : [], index: 0, requested: false }
    }

    function markUnavailable(id) {
      if (!id) return
      const current = state.unavailableIds || []
      if (current.indexOf(id) >= 0) return
      setState({ unavailableIds: current.concat(id) })
    }

    function availableStations(list) {
      const bad = new Set(state.unavailableIds || [])
      return (list || []).filter((item) => item && !bad.has(item.id))
    }

    function finishPlaybackFailure(station, token) {
      if (token !== playToken) return
      clearPlayWatchdog()
      destroyHls()
      markUnavailable(station.id)
      setState({ loading: false, playing: false, error: 'playback' })
      toast(translate('status.unavailable', { name: station.name }), 'error')
      const queue = state.queue || []
      if (queue.length > 1) {
        const next = queue.find((item) => item && item.id !== station.id && !(state.unavailableIds || []).includes(item.id))
        if (next) {
          setTimeout(() => {
            if (token !== playToken) return
            toast(translate('status.skip', { name: next.name }), 'info')
            playStation(next, { force: true, keepQueue: true })
          }, 1100)
        }
      }
    }

    function handlePlaybackFailure(reason) {
      const station = state.station
      if (!station) return
      const token = playToken
      clearPlayWatchdog()
      setState({ loading: true, playing: false })
      if (fallbackState.list.length && fallbackState.index < fallbackState.list.length) {
        const alt = fallbackState.list[fallbackState.index]
        fallbackState.index += 1
        toast(translate('status.fallback', { name: alt.name }), 'info')
        startPlayback(alt, token, true)
        return
      }
      if (!fallbackState.requested) {
        fallbackState.requested = true
        apiGet('/alternates', {
          name: station.name,
          country: station.countryCode,
          id: station.id,
          url: station.url,
        })
          .then((data) => {
            if (token !== playToken) return
            const items = (data && data.items) || []
            if (!items.length) {
              finishPlaybackFailure(station, token)
              return
            }
            fallbackState.list = items
            fallbackState.index = 1
            const alt = items[0]
            toast(translate('status.fallback', { name: alt.name }), 'info')
            startPlayback(alt, token, true)
          })
          .catch(() => finishPlaybackFailure(station, token))
        return
      }
      finishPlaybackFailure(station, token)
    }

    function playRejected() {
      handlePlaybackFailure('rejected')
    }

    async function startPlayback(station, token, isFallback) {
      const el = getAudio()
      setState({ station, loading: true, error: '' })
      addRecent(station)
      updateMediaSession(station)
      destroyHls()
      try {
        el.pause()
      } catch {
        /* ignore */
      }
      armPlayWatchdog(token, station.id)
      try {
        if (station.hls) {
          const Hls = await loadHlsRuntime().catch(() => null)
          if (token !== playToken) return
          if (!Hls) {
            const nativeHls = typeof el.canPlayType === 'function' && el.canPlayType('application/vnd.apple.mpegurl') === 'probably'
            setState({ loading: false, playing: false, error: 'hls' })
            toast(translate('error.hlsMissing'), 'error')
            if (!nativeHls) {
              handlePlaybackFailure('hls-missing')
              return
            }
            el.src = hlsUrl(station)
            el.load()
            const promise = el.play()
            if (promise && promise.catch) promise.catch(() => handlePlaybackFailure('rejected'))
            return
          }
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
          })
          hlsInstance = hls
          let recovered = 0
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (!data || !data.fatal) return
            recovered += 1
            if (recovered > 1) {
              handlePlaybackFailure('hls-fatal')
              return
            }
            try {
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad()
              else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError()
              else handlePlaybackFailure('hls-fatal')
            } catch {
              handlePlaybackFailure('hls-fatal')
            }
          })
          hls.attachMedia(el)
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (token !== playToken) return
            const promise = el.play()
            if (promise && promise.catch) promise.catch(() => handlePlaybackFailure('rejected'))
          })
          hls.loadSource(hlsUrl(station))
        } else {
          el.src = streamUrl(station)
          el.load()
          const promise = el.play()
          if (promise && promise.catch) promise.catch(() => handlePlaybackFailure('rejected'))
        }
      } catch {
        if (token === playToken) handlePlaybackFailure('throw')
      }
    }

    async function playStation(station, options) {
      const opts = options || {}
      if (!station) return
      const same = state.station && state.station.id === station.id
      if (same && state.playing && !opts.force) {
        pauseRadio()
        return
      }
      const token = ++playToken
      clearPlayWatchdog()
      if (!opts.keepQueue) {
        if (Array.isArray(opts.queue) && opts.queue.length) {
          const index = opts.queue.findIndex((item) => item && item.id === station.id)
          setState({ queue: opts.queue, queueIndex: index >= 0 ? index : 0 })
        } else {
          const existing = (state.queue || []).findIndex((item) => item && item.id === station.id)
          if (existing >= 0) setState({ queueIndex: existing })
        }
      }
      if (!opts.fromFallback) resetFallback()
      await startPlayback(station, token, false)
    }

    function pauseRadio() {
      if (!audioEl) return
      try {
        audioEl.pause()
      } catch {
        /* ignore */
      }
      setState({ playing: false, loading: false })
    }

    function resumeRadio() {
      if (!state.station) return
      const el = getAudio()
      if (!el.src && !hlsInstance) {
        playStation(state.station, { force: true, keepQueue: true })
        return
      }
      try {
        const promise = el.play()
        if (promise && promise.catch) promise.catch(() => playRejected())
      } catch {
        playRejected()
      }
    }

    function togglePlay() {
      if (!state.station) return
      if (state.playing) pauseRadio()
      else resumeRadio()
    }

    function playNext() {
      const queue = state.queue || []
      if (queue.length > 1) {
        const index = ((state.queueIndex >= 0 ? state.queueIndex : 0) + 1) % queue.length
        const next = queue[index]
        setState({ queueIndex: index })
        playStation(next, { force: true, keepQueue: true, queue })
        return
      }
      const pool = (state.recent || []).length > 1 ? state.recent : []
      if (pool.length > 1) {
        const index = pool.findIndex((item) => item && state.station && item.id === state.station.id)
        playStation(pool[(index + 1 + pool.length) % pool.length], { force: true })
      } else if (state.station) {
        playStation(state.station, { force: true, keepQueue: true })
      }
    }

    function playPrev() {
      const queue = state.queue || []
      if (queue.length > 1) {
        const index = ((state.queueIndex > 0 ? state.queueIndex : queue.length) - 1 + queue.length) % queue.length
        const previous = queue[index]
        setState({ queueIndex: index })
        playStation(previous, { force: true, keepQueue: true, queue })
        return
      }
      const pool = (state.recent || []).length > 1 ? state.recent : []
      if (pool.length > 1) {
        const index = pool.findIndex((item) => item && state.station && item.id === state.station.id)
        playStation(pool[(index - 1 + pool.length) % pool.length], { force: true })
      } else if (state.station) {
        playStation(state.station, { force: true, keepQueue: true })
      }
    }

    /* ------------------------------------------------------------------ *
     * 首页 / 搜索数据
     * ------------------------------------------------------------------ */
    async function loadHome(force) {
      if (state.homeLoading) return
      setState({ homeLoading: true, homeError: '' })
      try {
        const data = await apiGet('/home' + (force ? '?refresh=1' : ''))
        setState({ home: data, homeLoading: false, homeError: '' })
      } catch (err) {
        setState({ homeLoading: false, homeError: String((err && err.message) || err) })
      }
    }

    let searchSeq = 0
    async function runSearch(query) {
      const seq = ++searchSeq
      setState({ resultsLoading: true, resultsError: '', query })
      try {
        const data = await apiGet('/search', { q: query.q, country: query.country, tag: query.tag, limit: 48 })
        if (seq !== searchSeq) return
        setState({ results: data, resultsLoading: false })
      } catch (err) {
        if (seq !== searchSeq) return
        setState({ results: null, resultsLoading: false, resultsError: String((err && err.message) || err) })
      }
    }

    function isFilterActive(query) {
      return !!(query && (query.q || (query.country && query.country !== 'ALL') || query.tag))
    }

    /* ------------------------------------------------------------------ *
     * 图标（内联 SVG，随主题 currentColor）
     * ------------------------------------------------------------------ */
    const ICON_SHAPES = {
      play: [['path', { d: 'M8 5.6v12.8L19 12z', fill: 'currentColor', stroke: 'none' }]],
      pause: [
        ['rect', { x: '6.5', y: '5.5', width: '3.6', height: '13', rx: '1.4', fill: 'currentColor', stroke: 'none' }],
        ['rect', { x: '13.9', y: '5.5', width: '3.6', height: '13', rx: '1.4', fill: 'currentColor', stroke: 'none' }],
      ],
      prev: [
        ['path', { d: 'M6 5v14' }],
        ['path', { d: 'M19 6.2v11.6L9.4 12z', fill: 'currentColor', stroke: 'none' }],
      ],
      next: [
        ['path', { d: 'M18 5v14' }],
        ['path', { d: 'M5 6.2v11.6L14.6 12z', fill: 'currentColor', stroke: 'none' }],
      ],
      search: [
        ['circle', { cx: '11', cy: '11', r: '6.2' }],
        ['path', { d: 'M15.6 15.6 20 20' }],
      ],
      close: [['path', { d: 'M6 6l12 12M18 6 6 18' }]],
      refresh: [
        ['path', { d: 'M20 11.4A8 8 0 1 0 18.2 16.4' }],
        ['path', { d: 'M20 5.6v5.9h-5.9' }],
      ],
      star: [['path', { d: 'm12 3.9 2.5 5.3 5.8.8-4.2 4.1 1 5.8L12 17.2l-5.1 2.7 1-5.8L3.7 10l5.8-.8z' }]],
      starFilled: [
        ['path', { d: 'm12 3.9 2.5 5.3 5.8.8-4.2 4.1 1 5.8L12 17.2l-5.1 2.7 1-5.8L3.7 10l5.8-.8z', fill: 'currentColor' }],
      ],
      volume: [
        ['path', { d: 'M4 9.4h3.3L12 5.8v12.4l-4.7-3.6H4z' }],
        ['path', { d: 'M15.6 8.9a4.4 4.4 0 0 1 0 6.2' }],
        ['path', { d: 'M18.3 6.4a8 8 0 0 1 0 11.2' }],
      ],
      mute: [
        ['path', { d: 'M4 9.4h3.3L12 5.8v12.4l-4.7-3.6H4z' }],
        ['path', { d: 'm15.6 9.6 5 4.8M20.6 9.6l-5 4.8' }],
      ],
      radio: [
        ['rect', { x: '3.2', y: '7.5', width: '17.6', height: '12.6', rx: '2.4' }],
        ['circle', { cx: '15.2', cy: '13.8', r: '3.2' }],
        ['path', { d: 'M7 11h3.4M7 14.4h3.4M7 17.6h3' }],
        ['path', { d: 'M15.6 7.3 8.2 3.6' }],
      ],
      globe: [
        ['circle', { cx: '12', cy: '12', r: '8.2' }],
        ['path', { d: 'M4 12h16' }],
        ['path', { d: 'M12 3.8c2.4 2.2 3.7 5.1 3.7 8.2s-1.3 6-3.7 8.2c-2.4-2.2-3.7-5.1-3.7-8.2s1.3-6 3.7-8.2z' }],
      ],
      expand: [
        ['path', { d: 'M9 4H5.5A1.5 1.5 0 0 0 4 5.5V9' }],
        ['path', { d: 'M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9' }],
        ['path', { d: 'M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15' }],
        ['path', { d: 'M4 15v3.5A1.5 1.5 0 0 0 5.5 20H9' }],
      ],
      collapse: [
        ['path', { d: 'M4 9h3.5A1.5 1.5 0 0 0 9 7.5V4' }],
        ['path', { d: 'M20 9h-3.5A1.5 1.5 0 0 1 15 7.5V4' }],
        ['path', { d: 'M15 20v-3.5a1.5 1.5 0 0 1 1.5-1.5H20' }],
        ['path', { d: 'M9 20v-3.5A1.5 1.5 0 0 0 7.5 15H4' }],
      ],
      back: [['path', { d: 'M15 5 8 12l7 7' }]],
      bars: [
        ['path', { d: 'M5 14v4M9.7 9v9M14.3 5v13M19 11v7' }],
      ],
      wave: [
        ['path', { d: 'M3 12h2.2l2.1-5.4 3.4 11 3.1-8.2 2.3 5.2 1.9-3.4H21' }],
      ],
      ring: [
        ['circle', { cx: '12', cy: '12', r: '3.1' }],
        ['path', { d: 'M12 3.6v2.2M12 18.2v2.2M3.6 12h2.2M18.2 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6' }],
      ],
      chevron: [['path', { d: 'm9 6 6 6-6 6' }]],
      pin: [
        ['path', { d: 'M12 21s6-5.6 6-10.2A6 6 0 0 0 6 10.8C6 15.4 12 21 12 21z' }],
        ['circle', { cx: '12', cy: '10.8', r: '2.2' }],
      ],
    }

    function Icon(props) {
      const size = props.size || 16
      const shapes = ICON_SHAPES[props.name] || ICON_SHAPES.radio
      const children = shapes.map((shape, index) =>
        h(shape[0], Object.assign({ key: index }, shape[1])),
      )
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: props.strokeWidth || 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          className: cx('gr-ico', props.className),
          'aria-hidden': 'true',
          focusable: 'false',
        },
        children,
      )
    }

    /* ------------------------------------------------------------------ *
     * 基础组件
     * ------------------------------------------------------------------ */
    function Spinner(props) {
      return h('span', { className: cx('gr-spinner', props && props.className), 'aria-hidden': 'true' })
    }

    function LiveBars(props) {
      return h(
        'span',
        { className: cx('gr-live-bars', props && props.className), 'aria-hidden': 'true' },
        h('i', null),
        h('i', null),
        h('i', null),
        h('i', null),
      )
    }

    function StationLogo(props) {
      const station = props.station
      const size = props.size || 56
      const [broken, setBroken] = React.useState(false)
      const stationId = station && station.id
      React.useEffect(() => {
        setBroken(false)
      }, [stationId])
      const src = imageUrl(station)
      const baseStyle = {
        width: size + 'px',
        height: size + 'px',
        borderRadius: props.round ? '50%' : Math.round(size * 0.26) + 'px',
      }
      if (!src || broken) {
        return h(
          'span',
          {
            className: cx('gr-logo gr-logo-fallback', props.className),
            style: Object.assign(baseStyle, stationArtworkStyle(station)),
            'aria-hidden': 'true',
          },
          h(
            'span',
            { className: 'gr-logo-initials', style: { fontSize: Math.round(size * 0.34) + 'px' } },
            initials(station && station.name),
          ),
        )
      }
      return h('img', {
        className: cx('gr-logo', props.className),
        src,
        alt: '',
        width: size,
        height: size,
        loading: props.eager ? 'eager' : 'lazy',
        draggable: false,
        decoding: 'async',
        style: baseStyle,
        onError: () => setBroken(true),
      })
    }

    function TagChip(props) {
      return h(
        'span',
        { className: cx('gr-tag', props.active && 'is-active', props.className), onClick: props.onClick },
        props.children,
      )
    }

    function Slider(props) {
      const value = clamp(props.value, 0, 1)
      return h(
        'input',
        {
          type: 'range',
          min: 0,
          max: 100,
          step: 1,
          value: Math.round(value * 100),
          className: cx('gr-slider', props.className),
          'data-gr': props.dataGr || undefined,
          'aria-label': props.label || translate('label.volume'),
          'data-gr-fill': Math.round(value * 100),
          style: { backgroundSize: `${Math.round(value * 100)}% 100%` },
          onChange: (event) => {
            if (typeof props.onChange === 'function') props.onChange(Number(event.target.value) / 100)
          },
        },
      )
    }

    function CoverImage(props) {
      const { station } = props
      if (!station) return null
      const src = imageUrl(station)
      return h('div', {
        className: cx('gr-cover', props.className),
        style: src ? { backgroundImage: `url("${src}")` } : stationArtworkStyle(station),
        'aria-hidden': 'true',
      })
    }

    function Toast(props) {
      const toastState = props.toast
      if (!toastState) return null
      return h(
        'div',
        { className: cx('gr-toast', toastState.kind === 'error' && 'is-error', toastState.kind === 'success' && 'is-success'), role: 'status', 'data-gr': 'toast' },
        h(Icon, { name: toastState.kind === 'error' ? 'close' : 'check', size: 14, className: 'gr-toast-ico' }),
        h('span', null, toastState.text),
      )
    }

    function Visualizer(props) {
      const mode = props.mode || 'bars'
      const playing = !!props.playing
      const stationId = props.station && props.station.id
      const canvasRef = React.useRef(null)
      const paletteRef = React.useRef(stationPalette(props.station))
      paletteRef.current = stationPalette(props.station)

      React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return undefined
        const ctx2d = canvas.getContext('2d')
        if (!ctx2d) return undefined
        const palette = paletteRef.current
        let disposed = false
        let raf = 0
        let width = 320
        let height = 200

        const resize = () => {
          const rect = canvas.getBoundingClientRect()
          const dpr = Math.min(2, window.devicePixelRatio || 1)
          width = Math.max(1, Math.round(rect.width))
          height = Math.max(1, Math.round(rect.height))
          canvas.width = Math.round(width * dpr)
          canvas.height = Math.round(height * dpr)
          ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        resize()
        let observer = null
        if (typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(resize)
          observer.observe(canvas)
        } else {
          window.addEventListener('resize', resize)
        }

        const synthetic = (index, count, time) => {
          const phase = (index / Math.max(1, count)) * Math.PI * 2
          const base = 0.3 + 0.16 * Math.sin(time * 1.35 + phase * 2.1)
          const wobble = 0.13 * Math.sin(time * 2.4 + phase * 3.4)
          const pulse = 0.09 * Math.sin(time * 0.7 + phase * 0.9)
          return clamp(base + wobble + pulse, 0.05, 0.92)
        }

        const drawBars = (data, time) => {
          const count = Math.max(28, Math.min(72, Math.floor(width / 12)))
          const gap = width / count
          const barWidth = Math.max(2, gap * 0.5)
          const gradient = ctx2d.createLinearGradient(0, height, 0, 0)
          gradient.addColorStop(0, palette.a)
          gradient.addColorStop(0.55, palette.b)
          gradient.addColorStop(1, 'rgba(255,255,255,0.92)')
          for (let index = 0; index < count; index += 1) {
            let value
            if (data) {
              const at = Math.min(data.length - 1, Math.floor(Math.pow(index / count, 1.5) * data.length * 0.82))
              value = data[at] / 255
            } else {
              value = synthetic(index, count, time)
            }
            const barHeight = Math.max(3, value * height * 0.82)
            const x = index * gap + (gap - barWidth) / 2
            const y = height - barHeight
            ctx2d.fillStyle = gradient
            ctx2d.globalAlpha = playing ? 0.95 : 0.42
            ctx2d.beginPath()
            if (typeof ctx2d.roundRect === 'function') ctx2d.roundRect(x, y, barWidth, barHeight, barWidth / 2)
            else ctx2d.rect(x, y, barWidth, barHeight)
            ctx2d.fill()
          }
          ctx2d.globalAlpha = 1
        }

        const drawWave = (data, time) => {
          const count = Math.max(48, Math.min(160, Math.floor(width / 4)))
          const gradient = ctx2d.createLinearGradient(0, 0, width, 0)
          gradient.addColorStop(0, palette.a)
          gradient.addColorStop(0.5, '#ffffff')
          gradient.addColorStop(1, palette.b)
          ctx2d.lineWidth = 2
          ctx2d.strokeStyle = gradient
          ctx2d.globalAlpha = playing ? 1 : 0.42
          ctx2d.shadowColor = palette.glow
          ctx2d.shadowBlur = 12
          ctx2d.beginPath()
          for (let index = 0; index < count; index += 1) {
            let value
            if (data) {
              const at = Math.floor((index / count) * (data.length - 1))
              value = (data[at] - 128) / 128
            } else {
              value = Math.sin(index / count * Math.PI * 4 + time * 2.2) * synthetic(index, count, time) * 0.9
            }
            const x = (index / (count - 1)) * width
            const y = height / 2 + value * height * 0.34
            if (index === 0) ctx2d.moveTo(x, y)
            else ctx2d.lineTo(x, y)
          }
          ctx2d.stroke()
          ctx2d.shadowBlur = 0
          ctx2d.globalAlpha = 1
        }

        const drawRing = (data, time) => {
          const centerX = width / 2
          const centerY = height / 2
          const radius = Math.min(width, height) * 0.3
          const count = 84
          ctx2d.lineWidth = Math.max(2, radius * 0.045)
          ctx2d.lineCap = 'round'
          for (let index = 0; index < count; index += 1) {
            let value
            if (data) {
              const at = Math.floor((index / count) * data.length * 0.9)
              value = data[at] / 255
            } else {
              value = synthetic(index, count, time)
            }
            const angle = (index / count) * Math.PI * 2 - Math.PI / 2
            const inner = radius + Math.max(2, radius * 0.12)
            const outer = inner + Math.max(3, value * radius * 0.72)
            ctx2d.strokeStyle = index % 3 === 0 ? '#ffffff' : index % 2 === 0 ? palette.a : palette.b
            ctx2d.globalAlpha = playing ? 0.92 : 0.36
            ctx2d.beginPath()
            ctx2d.moveTo(centerX + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner)
            ctx2d.lineTo(centerX + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer)
            ctx2d.stroke()
          }
          ctx2d.globalAlpha = playing ? 0.5 : 0.2
          ctx2d.strokeStyle = 'rgba(255,255,255,0.6)'
          ctx2d.lineWidth = 1
          ctx2d.beginPath()
          ctx2d.arc(centerX, centerY, Math.max(3, radius * 0.34), 0, Math.PI * 2)
          ctx2d.stroke()
          ctx2d.globalAlpha = 1
        }

        const draw = (timestamp) => {
          if (disposed) return
          const time = timestamp / 1000
          ctx2d.clearRect(0, 0, width, height)
          if (mode === 'wave') {
            drawWave(playing ? readAnalyserData('time') : null, time)
          } else if (mode === 'ring') {
            drawRing(playing ? readAnalyserData('freq') : null, time)
          } else {
            drawBars(playing ? readAnalyserData('freq') : null, time)
          }
          raf = requestAnimationFrame(draw)
        }
        raf = requestAnimationFrame(draw)
        return () => {
          disposed = true
          cancelAnimationFrame(raf)
          if (observer) observer.disconnect()
          else window.removeEventListener('resize', resize)
        }
      }, [mode, playing, stationId])

      return h('canvas', { ref: canvasRef, className: 'gr-visualizer-canvas', 'data-gr': 'visualizer' })
    }

    /* ------------------------------------------------------------------ *
     * 页面组件
     * ------------------------------------------------------------------ */
    function Header(props) {
      const t = props.t
      const s = props.s
      const station = s.station
      const info = frequencyInfo(station)
      return h(
        'div',
        { className: 'gr-header-shell', 'data-gr': 'header' },
        h(
          'div',
          { className: 'gr-header' },
          h(
            'div',
            { className: 'gr-brand' },
            h('img', { className: 'gr-brand-logo', src: ICON_SRC, alt: '', width: 30, height: 30, draggable: false }),
            h(
              'div',
              { className: 'gr-brand-text' },
              h('span', { className: 'gr-brand-title' }, t('meta.title')),
              h('span', { className: 'gr-brand-sub' }, t('meta.tagline')),
            ),
          ),
          h(
            'div',
            { className: 'gr-search' },
            h(Icon, { name: 'search', size: 15, className: 'gr-search-ico' }),
            h('input', {
              className: 'gr-search-input',
              type: 'search',
              value: props.input,
              placeholder: t('search.placeholder'),
              'aria-label': t('search.placeholder'),
              'data-gr': 'search',
              onChange: (event) => props.onInput(event.target.value),
              onKeyDown: (event) => {
                if (event.key === 'Escape') props.onInput('')
              },
            }),
            props.input
              ? h(
                'button',
                {
                  type: 'button',
                  className: 'gr-search-clear',
                  title: t('search.clear'),
                  'aria-label': t('search.clear'),
                  onClick: () => props.onInput(''),
                },
                h(Icon, { name: 'close', size: 12 }),
              )
              : null,
          ),
          h(
            'div',
            { className: 'gr-header-tools' },
            station
              ? h(
                'button',
                {
                  type: 'button',
                  className: cx('gr-onair', s.playing && 'is-playing'),
                  'data-gr': 'open-player',
                  title: t('action.openPlayer'),
                  onClick: props.onOpenPlayer,
                },
                h(StationLogo, { station, size: 24, className: 'gr-onair-logo' }),
                h(
                  'span',
                  { className: 'gr-onair-text' },
                  h('span', { className: 'gr-onair-name' }, station.name),
                  h('span', { className: 'gr-onair-freq' }, info ? info.type + ' ' + info.value + ' ' + info.unit : formatBitrate(station)),
                ),
                s.playing ? h(LiveBars, { className: 'gr-onair-bars' }) : null,
              )
              : null,
            h(
              'button',
              {
                type: 'button',
                className: cx('gr-icon-btn', s.homeLoading && 'is-spinning'),
                title: t('action.refresh'),
                'aria-label': t('action.refresh'),
                onClick: props.onRefresh,
              },
              h(Icon, { name: 'refresh', size: 16 }),
            ),
          ),
        ),
      )
    }

    function Hero(props) {
      const t = props.t
      const s = props.s
      const station = s.station
      const home = s.home
      if (!station) {
        const picks = (home && Array.isArray(home.seed) ? home.seed : []).slice(0, 3)
        const first = picks[0]
        return h(
          'section',
          { className: 'gr-hero gr-hero-welcome', 'data-gr': 'hero' },
          h('span', { className: 'gr-welcome-glow', 'aria-hidden': 'true' }),
          h(
            'div',
            { className: 'gr-welcome-main' },
            h('span', { className: 'gr-welcome-mark' }, h(Icon, { name: 'radio', size: 38 })),
            h(
              'div',
              { className: 'gr-welcome-copy' },
              h('h2', null, t('welcome.title')),
              h('p', null, t('welcome.desc')),
            ),
            first
              ? h(
                'button',
                {
                  type: 'button',
                  className: 'gr-btn accent lg',
                  'data-gr': 'play-seed',
                  onClick: () => playStation(first, { queue: home.seed }),
                },
                h(Icon, { name: 'play', size: 15 }),
                t('action.playPicks'),
              )
              : null,
          ),
          picks.length
            ? h(
              'div',
              { className: 'gr-welcome-picks' },
              picks.map((item) =>
                h(
                  'button',
                  {
                    key: item.id,
                    type: 'button',
                    className: 'gr-welcome-pick',
                    onClick: () => playStation(item, { queue: home.seed }),
                  },
                  h(StationLogo, { station: item, size: 34 }),
                  h(
                    'span',
                    { className: 'gr-welcome-pick-text' },
                    h('span', { className: 'gr-welcome-pick-name' }, item.name),
                    h('span', { className: 'gr-welcome-pick-sub' }, frequencyText(item)),
                  ),
                ),
              ),
            )
            : null,
        )
      }
      const favorite = isFavorite(station.id)
      const info = frequencyInfo(station)
      const palette = stationPalette(station)
      return h(
        'section',
        {
          className: 'gr-hero',
          'data-gr': 'hero',
          'data-playing': String(s.playing),
          style: { '--gr-hero-a': palette.a, '--gr-hero-b': palette.b },
        },
        h('span', { className: 'gr-hero-glow', 'aria-hidden': 'true' }),
        h(
          'div',
          { className: 'gr-hero-main' },
          h(
            'div',
            { className: 'gr-hero-art' },
            h(StationLogo, { station, size: 104, eager: true }),
            h(
              'span',
              { className: 'gr-hero-live' },
              s.playing ? h(LiveBars, null) : h('span', { className: 'gr-hero-live-dot' }),
              h('span', null, s.playing ? t('label.onAir') : t('label.notPlaying')),
            ),
          ),
          h(
            'div',
            { className: 'gr-hero-copy' },
            h(
              'div',
              { className: 'gr-hero-kicker' },
              h('span', { className: 'gr-live-dot', 'data-playing': String(s.playing) }),
              h('span', null, s.playing ? t('label.listening') : t('label.nowPlaying')),
            ),
            h('h2', { className: 'gr-hero-name', title: station.name }, station.name),
            h('p', { className: 'gr-hero-sub' }, stationMeta(station)),
            h(
              'div',
              { className: 'gr-hero-tags' },
              (station.tags || []).slice(0, 4).map((tag) => h(TagChip, { key: tag }, tagLabel(tag))),
            ),
          ),
          info
            ? h(
              'div',
              { className: 'gr-freq-plate' },
              h('span', { className: 'gr-freq-type' }, info.type),
              h('span', { className: 'gr-freq-value' }, info.value),
              h('span', { className: 'gr-freq-unit' }, info.unit),
            )
            : h(
              'div',
              { className: 'gr-freq-plate is-online' },
              h('span', { className: 'gr-freq-type' }, 'LIVE'),
              h('span', { className: 'gr-freq-value is-text' }, t('label.online')),
              h('span', { className: 'gr-freq-unit' }, formatBitrate(station)),
            ),
          h(
            'div',
            { className: 'gr-hero-actions' },
            h(
              'button',
              {
                type: 'button',
                className: 'gr-play-hero',
                'data-gr': 'toggle',
                onClick: () => togglePlay(),
                title: s.playing ? t('action.pause') : t('action.play'),
                'aria-label': s.playing ? t('action.pause') : t('action.play'),
              },
              s.loading ? h(Spinner, null) : h(Icon, { name: s.playing ? 'pause' : 'play', size: 22 }),
            ),
            h(
              'button',
              {
                type: 'button',
                className: cx('gr-icon-btn gr-hero-fav', favorite && 'is-on'),
                'data-gr': 'favorite',
                title: favorite ? t('action.unfavorite') : t('action.favorite'),
                'aria-label': favorite ? t('action.unfavorite') : t('action.favorite'),
                onClick: () => toggleFavorite(station),
              },
              h(Icon, { name: favorite ? 'starFilled' : 'star', size: 17 }),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'gr-icon-btn',
                'data-gr': 'open-player',
                title: t('action.openPlayer'),
                'aria-label': t('action.openPlayer'),
                onClick: () => setView('player'),
              },
              h(Icon, { name: 'expand', size: 17 }),
            ),
            h(
              'div',
              { className: 'gr-hero-volume' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'gr-icon-btn',
                  title: s.muted ? t('action.unmute') : t('action.mute'),
                  'aria-label': s.muted ? t('action.unmute') : t('action.mute'),
                  onClick: toggleMute,
                },
                h(Icon, { name: s.muted ? 'mute' : 'volume', size: 16 }),
              ),
              h(Slider, { value: s.muted ? 0 : s.volume, onChange: setVolume, label: t('label.volume'), dataGr: 'volume' }),
            ),
          ),
        ),
      )
    }

    const COUNTRY_FALLBACK = [
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
      ['AU', 'Australia'],
      ['CA', 'Canada'],
      ['BR', 'Brazil'],
      ['IN', 'India'],
    ]

    const TAG_FALLBACK = ['news', 'music', 'talk', 'jazz', 'classical', 'electronic', 'rock', 'pop', 'sports']

    function Filters(props) {
      const t = props.t
      const s = props.s
      const countries = (s.home && Array.isArray(s.home.countries) && s.home.countries.length)
        ? s.home.countries
        : COUNTRY_FALLBACK.map(([code, name]) => ({ code, name, count: 0 }))
      const tags = (s.home && Array.isArray(s.home.tags) && s.home.tags.length)
        ? s.home.tags.map((item) => item.id)
        : TAG_FALLBACK
      const activeCountry = s.query.country || 'ALL'
      const activeTag = s.query.tag || ''
      return h(
        'div',
        { className: 'gr-filters', 'data-gr': 'filters' },
        h(
          'div',
          { className: 'gr-filter-row' },
          h(
            'button',
            {
              type: 'button',
              className: cx('gr-chip', activeCountry === 'ALL' && 'is-active'),
              'data-gr': 'country',
              'data-code': 'ALL',
              onClick: () => props.onCountry('ALL'),
            },
            h(Icon, { name: 'globe', size: 13 }),
            t('label.allCountries'),
          ),
          countries.map((country) =>
            h(
              'button',
              {
                key: country.code,
                type: 'button',
                className: cx('gr-chip', activeCountry === country.code && 'is-active'),
                'data-gr': 'country',
                'data-code': country.code,
                onClick: () => props.onCountry(country.code),
              },
              countryLabel(country.code, country.name),
            ),
          ),
        ),
        h(
          'div',
          { className: 'gr-filter-row gr-filter-tags' },
          h(
            'button',
            {
              type: 'button',
              className: cx('gr-chip gr-chip-soft', !activeTag && 'is-active'),
              'data-gr': 'tag',
              'data-tag': '',
              onClick: () => props.onTag(''),
            },
            t('label.allGenres'),
          ),
          tags.map((tag) =>
            h(
              'button',
              {
                key: tag,
                type: 'button',
                className: cx('gr-chip gr-chip-soft', activeTag === tag && 'is-active'),
                'data-gr': 'tag',
                'data-tag': tag,
                onClick: () => props.onTag(tag),
              },
              tagLabel(tag),
            ),
          ),
        ),
      )
    }

    function StationCard(props) {
      const t = props.t
      const station = props.station
      const s = props.s
      const isCurrent = !!(s.station && station && s.station.id === station.id)
      const isPlaying = isCurrent && s.playing
      const favorite = isFavorite(station && station.id)
      const info = frequencyInfo(station)
      return h(
        'div',
        {
          className: cx('gr-card', isCurrent && 'is-current', isPlaying && 'is-playing'),
          'data-gr': 'station',
          'data-id': station.id,
          'data-playing': String(isPlaying),
          role: 'button',
          tabIndex: 0,
          title: t('action.playStation', { name: station.name }),
          onClick: () => props.onPlay(station),
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              if (event.target !== event.currentTarget) return
              event.preventDefault()
              props.onPlay(station)
            }
          },
        },
        h(
          'span',
          { className: 'gr-card-art' },
          h(StationLogo, { station, size: 58 }),
          h(
            'span',
            { className: 'gr-card-play' },
            isPlaying ? h(Icon, { name: 'pause', size: 16 }) : h(Icon, { name: 'play', size: 16 }),
          ),
          isPlaying ? h(LiveBars, { className: 'gr-card-bars' }) : null,
        ),
        h(
          'span',
          { className: 'gr-card-body' },
          h('span', { className: 'gr-card-name' }, station.name),
          info
            ? h(
              'span',
              { className: 'gr-card-freq' },
              h('em', null, info.type),
              h('b', null, info.value),
              h('i', null, info.unit),
            )
            : h(
              'span',
              { className: 'gr-card-freq is-online' },
              h('em', null, 'LIVE'),
              h('b', null, t('label.online')),
            ),
          h(
            'span',
            { className: 'gr-card-meta' },
            countryLabel(station.countryCode, station.country) || t('label.online'),
            station.bitrate > 0 ? ' · ' + station.bitrate + ' kbps' : '',
          ),
        ),
        h(
          'button',
          {
            type: 'button',
            className: cx('gr-card-fav', favorite && 'is-on'),
            title: favorite ? t('action.unfavorite') : t('action.favorite'),
            'aria-label': favorite ? t('action.unfavorite') : t('action.favorite'),
            onClick: (event) => {
              event.stopPropagation()
              toggleFavorite(station)
            },
          },
          h(Icon, { name: favorite ? 'starFilled' : 'star', size: 13 }),
        ),
      )
    }

    function StationGrid(props) {
      const items = props.items || []
      return h(
        'div',
        { className: 'gr-grid' },
        items.map((station, index) =>
          h(StationCard, {
            key: (station && station.id) || index,
            station,
            t: props.t,
            s: props.s,
            onPlay: (picked) => props.onPlay(picked, index),
          }),
        ),
      )
    }

    function Section(props) {
      return h(
        'section',
        { className: 'gr-section', 'data-gr-section': props.id || '' },
        h(
          'div',
          { className: 'gr-section-head' },
          h('h3', null, props.title),
          props.hint ? h('span', { className: 'gr-section-hint' }, props.hint) : null,
          props.count ? h('span', { className: 'gr-section-count' }, props.count) : null,
        ),
        props.children,
      )
    }

    function EmptyState(props) {
      return h(
        'div',
        { className: 'gr-empty', 'data-gr': 'empty' },
        h(Icon, { name: props.icon || 'radio', size: 34 }),
        h('strong', null, props.title || translate('error.empty')),
        props.hint ? h('span', null, props.hint) : null,
        props.action || null,
      )
    }

    function ErrorState(props) {
      return h(
        'div',
        { className: 'gr-empty gr-error', 'data-gr': 'error' },
        h(Icon, { name: 'radio', size: 34 }),
        h('strong', null, props.title || translate('error.network')),
        props.hint ? h('span', null, props.hint) : null,
        props.onRetry
          ? h(
            'button',
            { type: 'button', className: 'gr-btn', onClick: props.onRetry },
            h(Icon, { name: 'refresh', size: 14 }),
            translate('action.retry'),
          )
          : null,
      )
    }

    function HomeSections(props) {
      const t = props.t
      const s = props.s
      if (!s.home) {
        return s.homeError
          ? h(ErrorState, { title: t('error.network'), hint: s.homeError, onRetry: () => loadHome(true) })
          : h(
            'div',
            { className: 'gr-skeleton-wrap' },
            [0, 1, 2].map((row) =>
              h(
                'div',
                { key: row, className: 'gr-skeleton-section' },
                h('span', { className: 'gr-skeleton-title' }),
                h(
                  'div',
                  { className: 'gr-grid' },
                  [0, 1, 2, 3, 4, 5].map((cell) => h('span', { key: cell, className: 'gr-skeleton-card' })),
                ),
              ),
            ),
          )
      }

      const usedUrls = new Set((s.home.seed || []).map((item) => item && item.url).filter(Boolean))
      const dedupeSection = (items) => {
        const out = []
        ;(items || []).forEach((item) => {
          if (!item) return
          if (item.url && usedUrls.has(item.url)) return
          if (item.url) usedUrls.add(item.url)
          out.push(item)
        })
        return out
      }
      const chinaItems = dedupeSection(s.home.china)
      const popularItems = dedupeSection(s.home.popular)
      const sections = []
      if (s.favorites.length) {
        sections.push(
          h(
            Section,
            { key: 'favorites', id: 'favorites', title: t('section.favorites'), count: s.favorites.length },
            h(StationGrid, { items: s.favorites, t, s, onPlay: (station) => playStation(station, { queue: s.favorites }) }),
          ),
        )
      }
      if (s.recent.length) {
        sections.push(
          h(
            Section,
            { key: 'recent', id: 'recent', title: t('section.recent'), count: s.recent.length },
            h(StationGrid, { items: s.recent, t, s, onPlay: (station) => playStation(station, { queue: s.recent }) }),
          ),
        )
      }
      sections.push(
        h(
          Section,
          { key: 'seed', id: 'seed', title: t('section.seed'), hint: t('section.seedHint') },
          h(StationGrid, { items: s.home.seed || [], t, s, onPlay: (station) => playStation(station, { queue: s.home.seed }) }),
        ),
      )
      if (chinaItems.length) {
        sections.push(
          h(
            Section,
            { key: 'china', id: 'china', title: t('section.china'), hint: t('section.chinaHint') },
            h(StationGrid, { items: chinaItems, t, s, onPlay: (station) => playStation(station, { queue: chinaItems }) }),
          ),
        )
      }
      if (popularItems.length) {
        sections.push(
          h(
            Section,
            { key: 'popular', id: 'popular', title: t('section.popular'), hint: t('section.popularHint') },
            h(StationGrid, { items: popularItems, t, s, onPlay: (station) => playStation(station, { queue: popularItems }) }),
          ),
        )
      }
      if (s.home.source === 'seed') {
        sections.push(
          h(
            'div',
            { key: 'source-note', className: 'gr-source-note' },
            h(Icon, { name: 'radio', size: 13 }),
            t('section.seedHint'),
          ),
        )
      }
      return sections
    }

    function ResultsView(props) {
      const t = props.t
      const s = props.s
      const query = s.query
      if (s.resultsLoading) {
        return h(
          'div',
          { className: 'gr-results' },
          h(
            'div',
            { className: 'gr-loading-row' },
            h(Spinner, null),
            h('span', null, t('search.loading')),
          ),
        )
      }
      if (s.resultsError) {
        return h(
          'div',
          { className: 'gr-results' },
          h(ErrorState, {
            title: t('error.network'),
            hint: s.resultsError,
            onRetry: () => runSearch(query),
          }),
        )
      }
      const items = availableStations((s.results && s.results.items) || [])
      if (!items.length) {
        return h(
          'div',
          { className: 'gr-results' },
          h(EmptyState, {
            title: t('search.empty', { q: query.q || tagLabel(query.tag) || countryLabel(query.country, query.country) }),
            hint: t('search.emptyHint'),
          }),
        )
      }
      return h(
        'div',
        { className: 'gr-results' },
        h(
          'div',
          { className: 'gr-results-head' },
          h('h3', null, query.q ? t('search.results') : tagLabel(query.tag) || countryLabel(query.country, query.country) || t('section.popular')),
          h('span', { className: 'gr-results-count' }, t('label.stationCount', { n: items.length })),
          s.results && s.results.source === 'seed' ? h('span', { className: 'gr-source-pill' }, 'OFFLINE') : null,
        ),
        h(StationGrid, {
          items,
          t,
          s,
          onPlay: (station, index) => playStation(station, { queue: items.slice(index).concat(items.slice(0, index)) }),
        }),
      )
    }

    function PlayerView(props) {
      const t = useT()
      const s = useRadioStore()
      const rootRef = React.useRef(null)
      const [fullscreen, setFullscreen] = React.useState(false)
      const station = s.station
      const favorite = isFavorite(station && station.id)
      const palette = stationPalette(station)
      const info = frequencyInfo(station)
      const logo = station ? imageUrl(station) : ''

      React.useEffect(() => {
        const onChange = () => setFullscreen(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', onChange)
        return () => document.removeEventListener('fullscreenchange', onChange)
      }, [])

      const toggleFullscreen = () => {
        const el = rootRef.current
        if (!el) return
        try {
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
          else if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
        } catch {
          /* ignore */
        }
      }

      if (!station) {
        return h(
          'div',
          { className: 'gr-root gr-player-root', 'data-gr': 'player-view' },
          h(
            'div',
            { className: 'gr-player-inner' },
            h(
              'button',
              { type: 'button', className: 'gr-btn', onClick: () => setView('browse') },
              h(Icon, { name: 'back', size: 15 }),
              t('action.closePlayer'),
            ),
            h(EmptyState, { title: t('error.missingStation'), hint: t('search.emptyHint') }),
          ),
        )
      }

      const backgroundStyle = logo
        ? { backgroundImage: `url("${logo}")` }
        : { background: `linear-gradient(150deg, ${palette.b}, #0a0f1d 70%)` }

      return h(
        'div',
        {
          className: 'gr-root gr-player-root',
          'data-gr': 'player-view',
          'data-playing': String(s.playing),
          ref: rootRef,
          style: { '--gr-p-a': palette.a, '--gr-p-b': palette.b, '--gr-p-glow': palette.glow },
        },
        h('div', { className: 'gr-player-bg', style: backgroundStyle, 'aria-hidden': 'true' }),
        h('div', { className: 'gr-player-scrim', 'aria-hidden': 'true' }),
        h('div', { className: 'gr-player-inner' },
          h(
            'header',
            { className: 'gr-player-head' },
            h(
              'button',
              {
                type: 'button',
                className: 'gr-round-btn',
                'data-gr': 'back',
                onClick: () => setView('browse'),
                title: t('action.closePlayer'),
                'aria-label': t('action.closePlayer'),
              },
              h(Icon, { name: 'back', size: 18 }),
              h('span', null, t('action.closePlayer')),
            ),
            h(
              'div',
              { className: 'gr-player-brand' },
              h('img', { src: ICON_SRC, alt: '', width: 22, height: 22, draggable: false }),
              h('span', null, t('meta.title')),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'gr-round-btn gr-round-btn-icon',
                'data-gr': 'fullscreen',
                onClick: toggleFullscreen,
                title: t('action.fullscreen'),
                'aria-label': t('action.fullscreen'),
              },
              h(Icon, { name: fullscreen ? 'collapse' : 'expand', size: 17 }),
            ),
          ),
          h(
            'div',
            { className: 'gr-player-body' },
            h(
              'div',
              { className: 'gr-player-left' },
              h(
                'div',
                { className: 'gr-disc', style: { '--gr-disc-glow': palette.glow } },
                h('span', { className: cx('gr-disc-ring', s.playing && 'is-spinning') }),
                h(StationLogo, {
                  station,
                  size: 236,
                  round: true,
                  eager: true,
                  className: cx('gr-disc-logo', s.playing && 'is-spinning'),
                }),
                h('span', { className: 'gr-disc-center' }),
              ),
              h(
                'div',
                { className: 'gr-player-live' },
                h(LiveBars, { className: cx(!s.playing && 'is-idle') }),
                h('span', null, s.loading ? t('label.connecting') : s.playing ? t('label.onAir') : t('label.notPlaying')),
              ),
            ),
            h(
              'div',
              { className: 'gr-player-right', 'data-gr': 'player-station' },
              h(
                'div',
                { className: 'gr-player-kicker' },
                h('span', { className: 'gr-live-dot', 'data-playing': String(s.playing) }),
                h('span', null, s.playing ? t('label.listening') : t('label.nowPlaying')),
              ),
              h(
                'div',
                { className: 'gr-player-freq' },
                info
                  ? [
                    h('span', { key: 'type', className: 'gr-freq-type' }, info.type),
                    h('span', { key: 'value', className: 'gr-freq-value' }, info.value),
                    h('span', { key: 'unit', className: 'gr-freq-unit' }, info.unit),
                    h('span', { key: 'caption', className: 'gr-freq-caption' }, t('label.frequency')),
                  ]
                  : [
                    h('span', { key: 'type', className: 'gr-freq-type' }, 'LIVE'),
                    h('span', { key: 'value', className: 'gr-freq-value is-text' }, t('label.online')),
                    h('span', { key: 'caption', className: 'gr-freq-caption' }, formatBitrate(station)),
                  ],
              ),
              h('h1', { className: 'gr-player-name', title: station.name }, station.name),
              h('div', { className: 'gr-player-meta' }, stationMeta(station)),
              h(
                'div',
                { className: 'gr-player-tags' },
                (station.tags || []).slice(0, 5).map((tag) => h(TagChip, { key: tag }, tagLabel(tag))),
              ),
              h(
                'div',
                { className: 'gr-visual-stage' },
                h(
                  'div',
                  { className: 'gr-visual-head' },
                  h('span', { className: 'gr-visual-label' }, t('label.visual')),
                  h(
                    'div',
                    { className: 'gr-visual-modes', 'data-gr': 'visual-mode' },
                    VISUAL_MODES.map((mode) =>
                      h(
                        'button',
                        {
                          key: mode,
                          type: 'button',
                          className: cx('gr-mode-btn', s.visualMode === mode && 'is-active'),
                          onClick: () => setVisualMode(mode),
                          'aria-pressed': s.visualMode === mode,
                          title: t('view.' + mode),
                          'data-mode': mode,
                        },
                        h(Icon, { name: mode, size: 14 }),
                        h('span', null, t('view.' + mode)),
                      ),
                    ),
                  ),
                ),
                h(
                  'div',
                  { className: 'gr-visual-box' },
                  h(Visualizer, { mode: s.visualMode, playing: s.playing, station }),
                ),
              ),
            ),
          ),
          h(
            'div',
            { className: 'gr-player-dock' },
            h(
              'button',
              {
                type: 'button',
                className: cx('gr-player-fav', favorite && 'is-on'),
                'data-gr': 'favorite',
                onClick: () => toggleFavorite(station),
                title: favorite ? t('action.unfavorite') : t('action.favorite'),
              },
              h(Icon, { name: favorite ? 'starFilled' : 'star', size: 17 }),
              h('span', null, favorite ? t('action.unfavorite') : t('action.favorite')),
            ),
            h(
              'div',
              { className: 'gr-player-buttons' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'gr-round-btn gr-round-btn-icon',
                  'data-gr': 'prev',
                  title: t('action.prev'),
                  'aria-label': t('action.prev'),
                  onClick: playPrev,
                },
                h(Icon, { name: 'prev', size: 20 }),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'gr-play-big',
                  'data-gr': 'toggle',
                  title: s.playing ? t('action.pause') : t('action.play'),
                  'aria-label': s.playing ? t('action.pause') : t('action.play'),
                  onClick: togglePlay,
                },
                s.loading ? h(Spinner, null) : h(Icon, { name: s.playing ? 'pause' : 'play', size: 30 }),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'gr-round-btn gr-round-btn-icon',
                  'data-gr': 'next',
                  title: t('action.next'),
                  'aria-label': t('action.next'),
                  onClick: playNext,
                },
                h(Icon, { name: 'next', size: 20 }),
              ),
            ),
            h(
              'div',
              { className: 'gr-player-volume' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'gr-icon-btn gr-player-volume-btn',
                  title: s.muted ? t('action.unmute') : t('action.mute'),
                  'aria-label': s.muted ? t('action.unmute') : t('action.mute'),
                  onClick: toggleMute,
                },
                h(Icon, { name: s.muted ? 'mute' : 'volume', size: 17 }),
              ),
              h(Slider, { value: s.muted ? 0 : s.volume, onChange: setVolume, label: t('player.volume'), dataGr: 'volume' }),
              h('span', { className: 'gr-volume-num' }, Math.round((s.muted ? 0 : s.volume) * 100) + '%'),
            ),
          ),
          h(
            'footer',
            { className: 'gr-player-foot' },
            h('span', null, s.error ? (s.error === 'hls' ? t('error.hlsMissing') : t('error.playback')) : s.playing ? t('player.hint') : t('player.paused')),
            s.error
              ? h(
                'button',
                { type: 'button', className: 'gr-link-btn', onClick: () => playStation(station, { force: true }) },
                t('action.retry'),
              )
              : null,
          ),
        ),
        s.toast ? h(Toast, { toast: s.toast }) : null,
      )
    }

    /* 面板内底部播放条：选中电台后常驻，滚动列表也不会丢掉控制 */
    function PlayerDock(props) {
      const t = props && props.t ? props.t : translate
      const s = useRadioStore()
      const station = s.station
      if (!station) return null
      const favorite = isFavorite(station.id)
      const info = frequencyInfo(station)
      return h(
        'div',
        { className: 'gr-dock-shell', 'data-gr': 'dock', 'data-playing': String(s.playing) },
        h(
          'div',
          { className: 'gr-dock' },
          h(
            'button',
            {
              type: 'button',
              className: 'gr-dock-info',
              'data-gr': 'dock-open',
              title: t('action.openPlayer'),
              'aria-label': t('action.openPlayer'),
              onClick: () => setView('player'),
            },
            h(StationLogo, { station, size: 46, eager: true }),
            h(
              'span',
              { className: 'gr-dock-text' },
              h('span', { className: 'gr-dock-name' }, station.name),
              h(
                'span',
                { className: 'gr-dock-sub' },
                h('em', null, info ? info.type + ' ' + info.value : t('label.online')),
                h('span', null, ' · ' + (countryLabel(station.countryCode, station.country) || t('label.online'))),
              ),
            ),
            s.playing ? h(LiveBars, { className: 'gr-dock-bars' }) : h('span', { className: 'gr-dock-dot' }),
          ),
          h(
            'div',
            { className: 'gr-dock-center' },
            h(
              'button',
              {
                type: 'button',
                className: 'gr-dock-ctrl',
                'data-gr': 'dock-prev',
                title: t('action.prev'),
                'aria-label': t('action.prev'),
                onClick: playPrev,
              },
              h(Icon, { name: 'prev', size: 16 }),
            ),
            h(
              'button',
              {
                type: 'button',
                className: cx('gr-dock-toggle', s.loading && 'is-loading'),
                'data-gr': 'dock-toggle',
                title: s.playing ? t('action.pause') : t('action.play'),
                'aria-label': s.playing ? t('action.pause') : t('action.play'),
                onClick: togglePlay,
              },
              s.loading ? h(Spinner, null) : h(Icon, { name: s.playing ? 'pause' : 'play', size: 18 }),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'gr-dock-ctrl',
                'data-gr': 'dock-next',
                title: t('action.next'),
                'aria-label': t('action.next'),
                onClick: playNext,
              },
              h(Icon, { name: 'next', size: 16 }),
            ),
          ),
          h(
            'div',
            { className: 'gr-dock-right' },
            h(
              'button',
              {
                type: 'button',
                className: cx('gr-dock-ctrl', favorite && 'is-on'),
                title: favorite ? t('action.unfavorite') : t('action.favorite'),
                'aria-label': favorite ? t('action.unfavorite') : t('action.favorite'),
                onClick: () => toggleFavorite(station),
              },
              h(Icon, { name: favorite ? 'starFilled' : 'star', size: 16 }),
            ),
            h(
              'div',
              { className: 'gr-dock-volume' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'gr-dock-ctrl',
                  title: s.muted ? t('action.unmute') : t('action.mute'),
                  'aria-label': s.muted ? t('action.unmute') : t('action.mute'),
                  onClick: toggleMute,
                },
                h(Icon, { name: s.muted ? 'mute' : 'volume', size: 16 }),
              ),
              h(Slider, { value: s.muted ? 0 : s.volume, onChange: setVolume, label: t('label.volume'), dataGr: 'volume', className: 'gr-dock-slider' }),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'gr-dock-ctrl',
                'data-gr': 'dock-expand',
                title: t('mini.expand'),
                'aria-label': t('mini.expand'),
                onClick: () => setView('player'),
              },
              h(Icon, { name: 'expand', size: 15 }),
            ),
          ),
        ),
      )
    }

    function MiniPlayer(props) {
      const t = useT()
      const s = useRadioStore()
      const wide = !!(props && props.wide)
      const usePanelInfo = props && props.usePanelInfo
      const hasPanelInfo = typeof usePanelInfo === 'function'
      let activePanelId = null
      if (hasPanelInfo) {
        try {
          activePanelId = usePanelInfo((info) => (info ? info.activePanelId : null))
        } catch {
          activePanelId = null
        }
      }
      const station = s.station
      const hidden = hasPanelInfo ? activePanelId === NS : s.pageMounted
      if (!station || hidden) return null
      // 与网易云迷你播放器上下堆叠：即使被对方暂停也保留这个空间，只是不发声

      const open = () => {
        openPanel()
        setView('player')
      }
      const toggleLabel = s.playing ? t('action.pause') : t('action.play')
      const frequency = station.frequency || formatBitrate(station)

      if (!wide) {
        return h(
          'button',
          {
            type: 'button',
            className: cx('gr-mini is-rail', s.playing && 'is-playing'),
            'data-gr': 'mini-player',
            'data-playing': String(s.playing),
            title: station.name + ' · ' + t('mini.open'),
            'aria-label': t('mini.open'),
            onClick: open,
          },
          h(StationLogo, { station, size: 34, round: true, className: 'gr-mini-rail-logo' }),
          s.playing ? h('span', { className: 'gr-mini-rail-pulse', 'aria-hidden': 'true' }) : null,
        )
      }

      return h(
        'div',
        { className: 'gr-mini is-wide', 'data-gr': 'mini-player', 'data-playing': String(s.playing) },
        h(
          'div',
          { className: 'gr-mini-top' },
          h(
            'button',
            {
              type: 'button',
              className: 'gr-mini-cover-btn',
              title: t('mini.expand'),
              'aria-label': t('mini.expand'),
              onClick: open,
            },
            h(StationLogo, { station, size: 34, round: true, className: 'gr-mini-logo' }),
            s.playing ? h('span', { className: 'gr-mini-live-dot', 'aria-hidden': 'true' }) : null,
          ),
          h(
            'button',
            { type: 'button', className: 'gr-mini-text', onClick: open, title: station.name },
            h('span', { className: 'gr-mini-name' }, station.name),
            h('span', { className: 'gr-mini-sub' }, frequency),
          ),
          h(
            'div',
            { className: 'gr-mini-volume' },
            h(
              'button',
              {
                type: 'button',
                className: 'gr-mini-ctrl gr-mini-volume-btn',
                title: s.muted ? t('action.unmute') : t('action.mute'),
                'aria-label': s.muted ? t('action.unmute') : t('action.mute'),
                onClick: toggleMute,
              },
              h(Icon, { name: s.muted ? 'mute' : 'volume', size: 14 }),
            ),
            h(
              'div',
              { className: 'gr-mini-volume-pop' },
              h(Slider, { value: s.muted ? 0 : s.volume, onChange: setVolume, label: t('label.volume'), dataGr: 'volume', className: 'gr-mini-slider' }),
            ),
          ),
        ),
        h(
          'div',
          { className: 'gr-mini-controls' },
          h(
            'button',
            {
              type: 'button',
              className: 'gr-mini-ctrl',
              'data-gr': 'mini-prev',
              title: t('action.prev'),
              'aria-label': t('action.prev'),
              onClick: playPrev,
            },
            h(Icon, { name: 'prev', size: 15 }),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'gr-mini-toggle',
              'data-gr': 'mini-toggle',
              title: toggleLabel,
              'aria-label': toggleLabel,
              onClick: togglePlay,
            },
            s.loading ? h(Spinner, null) : h(Icon, { name: s.playing ? 'pause' : 'play', size: 16 }),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'gr-mini-ctrl',
              'data-gr': 'mini-next',
              title: t('action.next'),
              'aria-label': t('action.next'),
              onClick: playNext,
            },
            h(Icon, { name: 'next', size: 15 }),
          ),
        ),
        h('span', { className: cx('gr-mini-level', s.playing && 'is-playing'), 'aria-hidden': 'true' }),
      )
    }

    function PanelIcon(props) {
      const size = (props && props.size) || 20
      const active = !!(props && props.active)
      const glyph = Math.max(10, Math.round(size * 0.64))
      return h(
        'span',
        {
          className: cx('gr-panel-mark', active && 'is-active'),
          'aria-hidden': 'true',
          style: {
            width: size + 'px',
            height: size + 'px',
            borderRadius: Math.round(size * 0.24) + 'px',
          },
        },
        h(Icon, { name: 'radio', size: glyph, strokeWidth: 2 }),
      )
    }

    function openPanel() {
      try {
        if (layoutService && typeof layoutService.selectPanel === 'function') layoutService.selectPanel(NS)
      } catch {
        /* ignore */
      }
    }

    /* ------------------------------------------------------------------ *
     * 每日轮换：编辑精选 / banner 按日期稳定随机，第二天自动换一批
     * ------------------------------------------------------------------ */
    function dayKey() {
      const now = new Date()
      return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
    }

    function seededOrder(list, seedText) {
      const items = (list || []).slice()
      let seed = 0
      const text = String(seedText)
      for (let index = 0; index < text.length; index += 1) seed = (seed * 31 + text.charCodeAt(index)) >>> 0
      const next = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0
        return seed / 4294967296
      }
      for (let index = items.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(next() * (index + 1))
        const temp = items[index]
        items[index] = items[swap]
        items[swap] = temp
      }
      return items
    }

    function dailyPicks(list, count, salt) {
      return seededOrder(availableStations(list), `${dayKey()}:${salt || 'picks'}`).slice(0, count)
    }

    /* ------------------------------------------------------------------ *
     * 发现页（网易云风格首页）：大 banner + 中等分类卡 + 小横滑列表
     * ------------------------------------------------------------------ */
    const GENRE_TILES = [
      { id: 'news', kind: 'tag', tag: 'news', icon: 'radio' },
      { id: 'world', kind: 'popular', icon: 'globe' },
      { id: 'classical', kind: 'tag', tag: 'classical', icon: 'ring' },
      { id: 'jazz', kind: 'tag', tag: 'jazz', icon: 'wave' },
      { id: 'electronic', kind: 'tag', tag: 'electronic', icon: 'bars' },
      { id: 'rock', kind: 'tag', tag: 'rock', icon: 'wave' },
      { id: 'talk', kind: 'tag', tag: 'talk', icon: 'radio' },
      { id: 'china', kind: 'country', country: 'CN', icon: 'globe' },
      { id: 'japan', kind: 'country', country: 'JP', icon: 'globe' },
      { id: 'korea', kind: 'country', country: 'KR', icon: 'globe' },
      { id: 'uk', kind: 'country', country: 'GB', icon: 'globe' },
      { id: 'france', kind: 'country', country: 'FR', icon: 'globe' },
    ]

    const CITY_TILES = [
      { id: 'beijing', query: '北京' },
      { id: 'shanghai', query: '上海' },
      { id: 'guangzhou', query: '广州' },
      { id: 'shenzhen', query: '深圳' },
      { id: 'chengdu', query: '成都' },
      { id: 'wuhan', query: '武汉' },
      { id: 'hangzhou', query: '杭州' },
      { id: 'nanjing', query: '南京' },
      { id: 'tianjin', query: '天津' },
      { id: 'chongqing', query: '重庆' },
      { id: 'xian', query: '西安' },
      { id: 'changsha', query: '长沙' },
      { id: 'zhengzhou', query: '郑州' },
      { id: 'suzhou', query: '苏州' },
      { id: 'xiamen', query: '厦门' },
      { id: 'hongkong', query: '香港' },
      { id: 'taipei', query: '台北' },
      { id: 'macau', query: '澳门' },
      { id: 'qingdao', query: '青岛' },
      { id: 'kunming', query: '昆明' },
    ]

    function cityCollectionDef(city, t) {
      const name = t('city.' + city.id)
      return {
        key: 'city:' + city.id,
        kind: 'search',
        q: city.query,
        title: name + ' · ' + t('section.cities'),
        hint: t('city.collectionHint'),
        items: [],
      }
    }

    function CityGrid(props) {
      const t = props.t
      return h(
        'section',
        { className: 'gr-cities', 'data-gr': 'cities' },
        h(
          'div',
          { className: 'gr-block-head' },
          h('h3', null, t('section.cities')),
          h('span', { className: 'gr-block-hint' }, t('section.citiesHint')),
        ),
        h(
          'div',
          { className: 'gr-city-grid' },
          CITY_TILES.map((city) =>
            h(
              'button',
              {
                key: city.id,
                type: 'button',
                className: 'gr-city',
                'data-gr': 'city',
                'data-city': city.query,
                onClick: () => props.onOpen(cityCollectionDef(city, t)),
                title: t('city.' + city.id) + ' · ' + t('section.citiesHint'),
              },
              h('span', { className: 'gr-city-icon' }, h(Icon, { name: 'pin', size: 14 })),
              h('span', { className: 'gr-city-name' }, t('city.' + city.id)),
              h(Icon, { name: 'chevron', size: 12, className: 'gr-city-chevron' }),
            ),
          ),
        ),
      )
    }

    function BannerCard(props) {
      const t = props.t
      const station = props.station
      const big = !!props.big
      const palette = stationPalette(station)
      const info = frequencyInfo(station)
      const logo = imageUrl(station)
      return h(
        'button',
        {
          type: 'button',
          className: cx('gr-banner', big && 'is-big'),
          'data-gr': 'banner',
          'data-id': station.id,
          onClick: () => props.onPlay(station),
          title: t('action.playStation', { name: station.name }),
          style: { '--gr-banner-a': palette.a, '--gr-banner-b': palette.b },
        },
        logo ? h('span', { className: 'gr-banner-bg', style: { backgroundImage: `url("${logo}")` }, 'aria-hidden': 'true' }) : null,
        h('span', { className: 'gr-banner-scrim', 'aria-hidden': 'true' }),
        h(
          'span',
          { className: 'gr-banner-top' },
          h(StationLogo, { station, size: big ? 56 : 40, eager: true, className: 'gr-banner-logo' }),
          h('span', { className: 'gr-banner-badge' }, big ? t('banner.pick') : t('banner.play')),
        ),
        h(
          'span',
          { className: 'gr-banner-body' },
          h('span', { className: 'gr-banner-name' }, station.name),
          h(
            'span',
            { className: 'gr-banner-sub' },
            info ? info.type + ' ' + info.value + ' ' + info.unit : formatBitrate(station),
          ),
          h(
            'span',
            { className: 'gr-banner-meta' },
            (countryLabel(station.countryCode, station.country) || t('label.online')) +
              ((station.tags || []).length ? ' · ' + (station.tags || []).slice(0, 2).map(tagLabel).join(' / ') : ''),
          ),
        ),
        h('span', { className: 'gr-banner-play' }, h(Icon, { name: 'play', size: 18 })),
      )
    }

    function BannerGrid(props) {
      const t = props.t
      const s = props.s
      const seedList = availableStations(s.home && Array.isArray(s.home.seed) ? s.home.seed : [])
      const [picked, setPicked] = React.useState(null)
      React.useEffect(() => {
        setPicked(null)
      }, [s.home && s.home.updatedAt])
      if (!seedList.length) return null
      const chosen = picked && picked.length ? picked : dailyPicks(seedList, 3, 'banner')
      const shuffle = () => {
        if (seedList.length <= 3) {
          setPicked(seedList)
          return
        }
        const previous = new Set(chosen.map((item) => item.id))
        let next = seedList.slice(0, 3)
        for (let attempt = 0; attempt < 16; attempt += 1) {
          const pool = seedList.slice()
          const pick = []
          while (pick.length < 3 && pool.length) {
            pick.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
          }
          next = pick
          if (pick.some((item) => !previous.has(item.id))) break
        }
        setPicked(next)
      }
      return h(
        'div',
        { className: 'gr-banners-wrap', 'data-gr': 'banners-wrap' },
        h(
          'div',
          { className: 'gr-block-head gr-banner-head' },
          h('h3', null, t('section.picks')),
          h('span', { className: 'gr-block-hint' }, t('banner.hint')),
          h(
            'button',
            {
              type: 'button',
              className: 'gr-banner-shuffle',
              'data-gr': 'banner-shuffle',
              onClick: shuffle,
              title: t('banner.shuffle'),
            },
            h(Icon, { name: 'refresh', size: 14 }),
            h('span', null, t('banner.shuffle')),
          ),
        ),
        h(
          'section',
          { className: 'gr-banners', 'data-gr': 'banners' },
          chosen.map((station, index) =>
            h(BannerCard, {
              key: station.id,
              station,
              big: index === 0,
              t,
              onPlay: (item) => playStation(item, { queue: seedList }),
            }),
          ),
        ),
      )
    }

    function GenreGrid(props) {
      const t = props.t
      return h(
        'section',
        { className: 'gr-genres', 'data-gr': 'genres' },
        h(
          'div',
          { className: 'gr-block-head' },
          h('h3', null, t('section.genres')),
          h('span', { className: 'gr-block-hint' }, t('section.genresHint')),
        ),
        h(
          'div',
          { className: 'gr-genre-grid' },
          GENRE_TILES.map((tile) => {
            const busy = props.busyId === tile.id
            return h(
              'div',
              {
                key: tile.id,
                className: cx('gr-genre', busy && 'is-busy'),
                'data-gr': 'genre',
                'data-genre': tile.id,
                role: 'button',
                tabIndex: 0,
                title: t('genre.' + tile.id),
                onClick: () => props.onPick(tile),
                onKeyDown: (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    props.onPick(tile)
                  }
                },
              },
              h('span', { className: 'gr-genre-icon' }, busy ? h(Spinner, null) : h(Icon, { name: tile.icon, size: 20 })),
              h(
                'span',
                { className: 'gr-genre-body' },
                h('span', { className: 'gr-genre-name' }, t('genre.' + tile.id)),
                h('span', { className: 'gr-genre-sub' }, t('genre.' + tile.id + '.sub')),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'gr-genre-more',
                  'data-gr': 'genre-more',
                  'data-genre': tile.id,
                  title: t('action.viewAll') + ' · ' + t('genre.' + tile.id),
                  onClick: (event) => {
                    event.stopPropagation()
                    props.onMore(tile)
                  },
                },
                h(Icon, { name: 'chevron', size: 14 }),
              ),
            )
          }),
        ),
      )
    }

    function RowCard(props) {
      const t = props.t
      const station = props.station
      const current = !!(props.s.station && props.s.station.id === station.id)
      const playing = current && props.s.playing
      return h(
        'button',
        {
          type: 'button',
          className: cx('gr-row-card', current && 'is-current'),
          'data-gr': 'station',
          'data-id': station.id,
          'data-playing': String(!!playing),
          onClick: () => props.onPlay(station),
          title: t('action.playStation', { name: station.name }),
        },
        h(
          'span',
          { className: 'gr-row-art' },
          h(StationLogo, { station, size: 104 }),
          playing ? h(LiveBars, { className: 'gr-row-eq' }) : h('span', { className: 'gr-row-hover' }, h(Icon, { name: 'play', size: 18 })),
        ),
        h('span', { className: 'gr-row-name' }, station.name),
        h('span', { className: 'gr-row-sub' }, frequencyText(station)),
      )
    }

    function RowSection(props) {
      const t = props.t
      const items = props.items || []
      if (!items.length) return null
      return h(
        'section',
        { className: 'gr-row-section', 'data-gr': 'row', 'data-row': props.id },
        h(
          'div',
          { className: 'gr-block-head' },
          h(
            'button',
            {
              type: 'button',
              className: 'gr-block-title',
              'data-gr': 'row-more',
              'data-row': props.id,
              onClick: props.onMore,
              title: t('action.viewAll') + ' · ' + props.title,
            },
            h('span', { className: 'gr-block-name' }, props.title),
            h(Icon, { name: 'chevron', size: 14, className: 'gr-block-chevron' }),
          ),
          props.hint ? h('span', { className: 'gr-block-hint' }, props.hint) : null,
          h('span', { className: 'gr-block-count' }, items.length),
        ),
        h(
          'div',
          { className: 'gr-row-scroll' },
          items.map((station) =>
            h(RowCard, {
              key: station.id,
              station,
              t,
              s: props.s,
              onPlay: (picked) => playStation(picked, { queue: items }),
            }),
          ),
        ),
      )
    }

    function HomeDiscover(props) {
      const t = props.t
      const s = props.s
      if (!s.home) {
        if (s.homeError) {
          return h(ErrorState, { title: t('error.network'), hint: s.homeError, onRetry: () => loadHome(true) })
        }
        return h(
          'div',
          { className: 'gr-skeleton-wrap' },
          h('span', { className: 'gr-skeleton-banner' }),
          [0, 1, 2].map((row) =>
            h(
              'div',
              { key: row, className: 'gr-skeleton-section' },
              h('span', { className: 'gr-skeleton-title' }),
              h(
                'div',
                { className: 'gr-row-scroll' },
                [0, 1, 2, 3, 4, 5].map((cell) => h('span', { key: cell, className: 'gr-skeleton-rowcard' })),
              ),
            ),
          ),
        )
      }
      const seed = availableStations(s.home.seed || [])
      const popular = availableStations(s.home.popular || [])
      const china = availableStations(s.home.china || [])
      return h(
        'div',
        { className: 'gr-discover' },
        h(BannerGrid, { t, s }),
        h(CityGrid, { t, onOpen: (def) => props.onOpenCollection(def) }),
        h(GenreGrid, { t, busyId: props.busyGenre, onPick: props.onGenre, onMore: (tile) => props.onOpenCollection(genreCollectionDef(tile, t)) }),
        s.recent.length
          ? h(RowSection, { id: 'recent', title: t('section.recent'), hint: '', items: availableStations(s.recent).slice(0, 12), t, s, onMore: () => props.onOpenCollection(rowCollectionDef(s, 'recent', t)) })
          : null,
        s.favorites.length
          ? h(RowSection, { id: 'favorites', title: t('section.favorites'), hint: '', items: availableStations(s.favorites).slice(0, 12), t, s, onMore: () => props.onOpenCollection(rowCollectionDef(s, 'favorites', t)) })
          : null,
        h(RowSection, { id: 'popular', title: t('section.popular'), hint: t('section.popularHint'), items: popular.slice(0, 12), t, s, onMore: () => props.onOpenCollection(rowCollectionDef(s, 'popular', t)) }),
        china.length ? h(RowSection, { id: 'china', title: t('section.china'), hint: t('section.chinaHint'), items: china.slice(0, 12), t, s, onMore: () => props.onOpenCollection(rowCollectionDef(s, 'china', t)) }) : null,
        h(RowSection, { id: 'seed', title: t('section.seed'), hint: t('section.seedHint'), items: dailyPicks(seed, 12, 'seed-row'), t, s, onMore: () => props.onOpenCollection(rowCollectionDef(s, 'seed', t)) }),
        s.home.source === 'seed' ? h('div', { className: 'gr-source-note' }, h(Icon, { name: 'radio', size: 13 }), t('section.seedHint')) : null,
      )
    }

    /* 面板底部的大播放条（替代原先顶部的 hero + 底部小 dock） */
    function PlayerBar(props) {
      const t = props.t || translate
      const s = useRadioStore()
      const station = s.station
      if (!station) return null
      const favorite = isFavorite(station.id)
      const info = frequencyInfo(station)
      const palette = stationPalette(station)
      return h(
        'div',
        {
          className: 'gr-playerbar-shell',
          'data-gr': 'playerbar',
          'data-playing': String(s.playing),
          style: { '--gr-pb-a': palette.a, '--gr-pb-b': palette.b },
        },
        h(
          'div',
          { className: 'gr-playerbar' },
          h(
            'button',
            {
              type: 'button',
              className: 'gr-playerbar-info',
              'data-gr': 'open-player',
              title: t('action.openPlayer'),
              onClick: () => setView('player'),
            },
            h(StationLogo, { station, size: 76, eager: true }),
            h(
              'span',
              { className: 'gr-playerbar-text' },
              h(
                'span',
                { className: 'gr-playerbar-kicker' },
                h('span', { className: 'gr-live-dot', 'data-playing': String(s.playing) }),
                h('span', null, s.playing ? t('label.listening') : t('label.nowPlaying')),
              ),
              h('span', { className: 'gr-playerbar-name' }, station.name),
              h('span', { className: 'gr-playerbar-meta' }, stationMeta(station)),
            ),
            info
              ? h(
                'span',
                { className: 'gr-playerbar-freq' },
                h('em', null, info.type),
                h('b', null, info.value),
                h('i', null, info.unit),
              )
              : null,
            h(
              'span',
              { className: 'gr-playerbar-tags' },
              (station.tags || []).slice(0, 2).map((tag) => h('span', { key: tag, className: 'gr-playerbar-tag' }, tagLabel(tag))),
            ),
          ),
          h(
            'div',
            { className: 'gr-playerbar-center' },
            h(
              'button',
              {
                type: 'button',
                className: 'gr-pb-ctrl',
                'data-gr': 'prev',
                title: t('action.prev'),
                'aria-label': t('action.prev'),
                onClick: playPrev,
              },
              h(Icon, { name: 'prev', size: 18 }),
            ),
            h(
              'button',
              {
                type: 'button',
                className: cx('gr-pb-play', s.loading && 'is-loading'),
                'data-gr': 'toggle',
                title: s.playing ? t('action.pause') : t('action.play'),
                'aria-label': s.playing ? t('action.pause') : t('action.play'),
                onClick: togglePlay,
              },
              s.loading ? h(Spinner, null) : h(Icon, { name: s.playing ? 'pause' : 'play', size: 22 }),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'gr-pb-ctrl',
                'data-gr': 'next',
                title: t('action.next'),
                'aria-label': t('action.next'),
                onClick: playNext,
              },
              h(Icon, { name: 'next', size: 18 }),
            ),
          ),
          h(
            'div',
            { className: 'gr-playerbar-actions' },
            h(
              'button',
              {
                type: 'button',
                className: cx('gr-icon-btn', favorite && 'is-on'),
                'data-gr': 'favorite',
                title: favorite ? t('action.unfavorite') : t('action.favorite'),
                'aria-label': favorite ? t('action.unfavorite') : t('action.favorite'),
                onClick: () => toggleFavorite(station),
              },
              h(Icon, { name: favorite ? 'starFilled' : 'star', size: 17 }),
            ),
            h(
              'div',
              { className: 'gr-playerbar-volume' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'gr-icon-btn',
                  title: s.muted ? t('action.unmute') : t('action.mute'),
                  'aria-label': s.muted ? t('action.unmute') : t('action.mute'),
                  onClick: toggleMute,
                },
                h(Icon, { name: s.muted ? 'mute' : 'volume', size: 16 }),
              ),
              h(Slider, {
                value: s.muted ? 0 : s.volume,
                onChange: setVolume,
                label: t('label.volume'),
                dataGr: 'volume',
                className: 'gr-playerbar-slider',
              }),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'gr-icon-btn',
                'data-gr': 'expand',
                title: t('mini.expand'),
                'aria-label': t('mini.expand'),
                onClick: () => setView('player'),
              },
              h(Icon, { name: 'expand', size: 17 }),
            ),
          ),
        ),
      )
    }

    /* ------------------------------------------------------------------ *
     * 电台集合页（点板块标题 / 分类卡「更多」进入，支持加载更多）
     * ------------------------------------------------------------------ */
    function rowCollectionDef(s, rowId, t) {
      const base = { key: 'row:' + rowId }
      if (rowId === 'popular') {
        return Object.assign(base, { kind: 'popular', title: t('section.popular'), hint: t('section.popularHint'), items: availableStations(s.home.popular || []) })
      }
      if (rowId === 'china') {
        return Object.assign(base, { kind: 'country', country: 'CN', title: t('section.china'), hint: t('section.chinaHint'), items: availableStations(s.home.china || []) })
      }
      if (rowId === 'seed') {
        return Object.assign(base, { kind: 'local', title: t('section.seed'), hint: t('section.seedHint'), items: availableStations(s.home.seed || []) })
      }
      if (rowId === 'recent') {
        return Object.assign(base, { kind: 'local', title: t('section.recent'), hint: '', items: availableStations(s.recent || []) })
      }
      if (rowId === 'favorites') {
        return Object.assign(base, { kind: 'local', title: t('section.favorites'), hint: '', items: availableStations(s.favorites || []) })
      }
      return null
    }

    function genreCollectionDef(tile, t) {
      if (!tile) return null
      const title = t('genre.' + tile.id)
      const hint = t('genre.' + tile.id + '.sub')
      if (tile.kind === 'tag') return { key: 'genre:' + tile.id, kind: 'tag', tag: tile.tag, title, hint, items: [] }
      if (tile.kind === 'country') return { key: 'genre:' + tile.id, kind: 'country', country: tile.country, title, hint, items: [] }
      return { key: 'genre:' + tile.id, kind: 'popular', title, hint, items: [] }
    }

    function openCollection(def) {
      if (!def) return
      const items = availableStations(def.items || [])
      const collection = {
        key: def.key || String(Date.now()),
        title: def.title || '',
        hint: def.hint || '',
        kind: def.kind || 'local',
        country: def.country || '',
        tag: def.tag || '',
        q: def.q || '',
        items,
        offset: items.length,
        limit: 36,
        hasMore: false,
        loading: false,
        error: '',
      }
      setState({ collection, view: 'collection' })
      if (collection.kind !== 'local') loadCollectionPage(true).catch(() => {})
    }

    async function loadCollectionPage(reset) {
      const current = state.collection
      if (!current) return
      if (current.kind === 'local') {
        setState({ collection: Object.assign({}, current, { loading: false, hasMore: false }) })
        return
      }
      const offset = reset ? 0 : current.offset
      setState({ collection: Object.assign({}, current, { loading: true, error: '' }) })
      try {
        const params = { limit: current.limit || 36, offset }
        if (current.kind === 'country') params.country = current.country
        else if (current.kind === 'tag') params.tag = current.tag
        else if (current.kind === 'search') params.q = current.q
        const data = await apiGet('/search', params)
        if (state.collection && state.collection.key !== current.key) return
        const pageItems = availableStations((data && data.items) || [])
        const previous = reset ? [] : (state.collection && state.collection.items) || []
        const seen = new Set(previous.map((item) => item.id))
        const merged = reset ? pageItems : previous.concat(pageItems.filter((item) => !seen.has(item.id)))
        setState({
          collection: Object.assign({}, state.collection, {
            items: merged,
            offset: offset + pageItems.length,
            hasMore: pageItems.length >= (current.limit || 36),
            loading: false,
            error: '',
          }),
        })
      } catch (err) {
        if (!state.collection || state.collection.key !== current.key) return
        setState({ collection: Object.assign({}, state.collection, { loading: false, error: String((err && err.message) || err) }) })
      }
    }

    function CollectionView(props) {
      const t = useT()
      const s = useRadioStore()
      const collection = s.collection
      if (!collection) return null
      const playFrom = (station, index) =>
        playStation(station, {
          queue: collection.items.slice(index).concat(collection.items.slice(0, index)),
        })
      return h(
        'div',
        { className: 'gr-root gr-collection-root', 'data-gr': 'root', 'data-view': 'collection' },
        h(
          'div',
          { className: 'gr-scroll', 'data-gr': 'scroll' },
          h(
            'div',
            { className: 'gr-collection-head', 'data-gr': 'collection' },
            h(
              'button',
              {
                type: 'button',
                className: 'gr-back-btn',
                'data-gr': 'back',
                onClick: () => setState({ view: 'browse' }),
                title: t('label.back'),
              },
              h(Icon, { name: 'back', size: 16 }),
              t('label.back'),
            ),
            h(
              'div',
              { className: 'gr-collection-title' },
              h('h2', null, collection.title),
              h('p', null, collection.hint || t('label.stationCount', { n: collection.items.length })),
            ),
            collection.loading ? h(Spinner, null) : null,
          ),
          h(
            'div',
            { className: 'gr-wrap' },
            collection.error
              ? h(ErrorState, { title: t('error.network'), hint: collection.error, onRetry: () => loadCollectionPage(true) })
              : !collection.items.length && !collection.loading
                ? h(EmptyState, { title: t('error.empty'), hint: t('search.emptyHint') })
                : h(StationGrid, { items: collection.items, t, s, onPlay: playFrom }),
            collection.hasMore
              ? h(
                'div',
                { className: 'gr-load-more-wrap' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'gr-btn',
                    'data-gr': 'load-more',
                    disabled: collection.loading,
                    onClick: () => loadCollectionPage(false),
                  },
                  collection.loading ? h(Spinner, null) : h(Icon, { name: 'refresh', size: 14 }),
                  t('action.loadMore'),
                ),
              )
              : null,
            h(
              'footer',
              { className: 'gr-foot' },
              h('span', null, 'Radio Browser'),
              h('span', { className: 'gr-foot-dot' }, '·'),
              h('span', null, t('meta.tagline')),
            ),
          ),
        ),
        h(PlayerBar, { t }),
        s.toast ? h(Toast, { toast: s.toast }) : null,
      )
    }

    function Page() {
      const t = useT()
      const s = useRadioStore()
      const [input, setInput] = React.useState(() => state.query.q || '')
      const [busyGenre, setBusyGenre] = React.useState(null)
      const pageRef = React.useRef(null)

      React.useEffect(() => {
        setState({ pageMounted: true })
        if (!state.home && !state.homeLoading) loadHome(false)
        return () => setState({ pageMounted: false })
      }, [])

      React.useEffect(() => {
        if (s.view !== 'player' && s.view !== 'collection') return undefined
        const onKey = (event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            setView('browse')
            return
          }
          if (s.view !== 'player') return
          if (event.key === ' ' || event.code === 'Space') {
            const tag = event.target && event.target.tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT') return
            event.preventDefault()
            togglePlay()
          }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [s.view])

      React.useEffect(() => {
        const timer = setTimeout(() => {
          const q = input.trim()
          const country = state.query.country
          const tag = state.query.tag
          if (!q && country === 'ALL' && !tag) {
            if (state.results || state.resultsError || state.resultsLoading) {
              setState({ results: null, resultsError: '', resultsLoading: false, query: { q: '', country, tag } })
            }
            return
          }
          runSearch({ q, country, tag })
        }, 380)
        return () => clearTimeout(timer)
      }, [input])

      /* 分类卡：点一下就从该类型/国家里随机挑一台播放 */
      const playRandomGenre = async (tile) => {
        if (!tile || busyGenre) return
        setBusyGenre(tile.id)
        try {
          let pool = []
          if (tile.kind === 'tag') {
            const data = await apiGet('/search', { tag: tile.tag, limit: 40 })
            pool = (data && data.items) || []
          } else if (tile.kind === 'country') {
            const data = await apiGet('/search', { country: tile.country, limit: 40 })
            pool = (data && data.items) || []
          } else if (state.home) {
            pool = state.home.popular || []
          }
          if (!pool.length && state.home) {
            const all = [].concat(state.home.seed || [], state.home.china || [], state.home.popular || [])
            pool = all.filter((item) => {
              if (!item) return false
              if (tile.kind === 'tag') return (item.tags || []).includes(tile.tag)
              if (tile.kind === 'country') return item.countryCode === tile.country
              return true
            })
          }
          pool = availableStations(pool.filter(Boolean))
          if (!pool.length) {
            toast(t('status.noGenre'), 'error')
            return
          }
          let picked = pool[Math.floor(Math.random() * pool.length)]
          if (pool.length > 1 && state.station && picked.id === state.station.id) {
            picked = pool[(pool.indexOf(picked) + 1) % pool.length]
          }
          playStation(picked, { queue: pool })
          toast(t('status.randomPlay', { name: picked.name }), 'success')
        } catch (err) {
          toast(String((err && err.message) || err), 'error')
        } finally {
          setBusyGenre(null)
        }
      }

      if (s.view === 'player') {
        return h(PlayerView, { t })
      }
      if (s.view === 'collection' && s.collection) {
        return h(CollectionView, { t })
      }

      const searchActive = isFilterActive(s.query)
      return h(
        'div',
        {
          className: 'gr-root',
          'data-gr': 'root',
          'data-playing': String(s.playing),
          ref: pageRef,
        },
        h(
          'div',
          { className: 'gr-scroll', 'data-gr': 'scroll' },
          h(Header, {
            t,
            s,
            input,
            onInput: setInput,
            onRefresh: () => loadHome(true),
            onOpenPlayer: () => setView('player'),
          }),
          h(
            'div',
            { className: 'gr-wrap' },
            searchActive
              ? h(ResultsView, { t, s })
              : h(HomeDiscover, { t, s, busyGenre, onGenre: playRandomGenre, onOpenCollection: openCollection }),
            h(
              'footer',
              { className: 'gr-foot' },
              h('span', null, 'Radio Browser'),
              h('span', { className: 'gr-foot-dot' }, '·'),
              h('span', null, t('meta.tagline')),
            ),
          ),
        ),
        h(PlayerBar, { t }),
        s.toast ? h(Toast, { toast: s.toast }) : null,
      )
    }

    /* ------------------------------------------------------------------ *
     * 样式：全部从 DSH 主题 token 派生；播放页允许自己的深色艺术层
     * ------------------------------------------------------------------ */
    let layoutService = null

    const CSS = `
    .gr-root,.gr-mini{
      --gr-t1:var(--dsw-alias-label-primary,#1d1d1f);
      --gr-t2:var(--dsw-alias-label-secondary,#6e6e73);
      --gr-t3:var(--dsw-alias-label-tertiary,#8e8e93);
      --gr-bg:var(--dsw-alias-bg-base,#ffffff);
      --gr-l1:var(--dsw-alias-bg-layer-1,#f5f5f7);
      --gr-l2:var(--dsw-alias-bg-layer-2,#ffffff);
      --gr-line:var(--dsw-alias-border-l1,rgba(0,0,0,.10));
      --gr-line2:var(--dsw-alias-border-l2,rgba(0,0,0,.06));
      --gr-accent:#f0a12a;
      --gr-accent-2:#e66a12;
      --gr-accent-soft:color-mix(in srgb,var(--gr-accent) 14%,transparent);
      --gr-accent-line:color-mix(in srgb,var(--gr-accent) 42%,transparent);
      --gr-on-accent:#2a1700;
      --gr-success:var(--dsw-alias-state-success-primary,#2fbf71);
      --gr-error:var(--dsw-alias-state-error-primary,#e5534b);
      --gr-fill:color-mix(in srgb,var(--gr-t1) 5%,transparent);
      --gr-fill2:color-mix(in srgb,var(--gr-t1) 9%,transparent);
      --gr-r-xl:26px;
      --gr-r-lg:20px;
      --gr-r-md:16px;
      --gr-r-sm:12px;
      --gr-shadow-1:0 1px 2px rgba(15,12,8,.04),0 14px 34px -28px rgba(15,12,8,.42);
      --gr-shadow-2:0 2px 4px rgba(15,12,8,.05),0 24px 54px -30px rgba(15,12,8,.46);
      font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","PingFang SC","Helvetica Neue","Segoe UI",sans-serif;
      -webkit-font-smoothing:antialiased;
    }
    .gr-root *,.gr-mini *,.gr-mini{box-sizing:border-box}
    .gr-root button,.gr-mini button{font:inherit;color:inherit}
    .gr-root :focus-visible,.gr-mini :focus-visible{
      outline:2px solid var(--dsw-focus-ring-color,var(--gr-accent));outline-offset:2px;
    }
    .gr-root{
      position:relative;height:100%;display:flex;flex-direction:column;overflow:hidden;
      color:var(--gr-t1);font-size:13px;line-height:1.5;
      background:
        radial-gradient(1100px 460px at 8% -12%,color-mix(in srgb,var(--gr-accent) 10%,transparent),transparent 66%),
        radial-gradient(900px 420px at 98% -6%,color-mix(in srgb,var(--gr-accent-2) 6%,transparent),transparent 70%);
    }
    .gr-scroll{
      flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;
      scrollbar-width:thin;scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,var(--gr-fill2)) transparent;
    }
    .gr-wrap{max-width:1440px;margin:0 auto;padding:18px 30px 26px}
    .gr-foot{display:flex;align-items:center;justify-content:center;gap:7px;padding:30px 0 4px;color:var(--gr-t3);font-size:10.5px;flex-wrap:wrap;letter-spacing:.01em}
    .gr-foot-dot{opacity:.55}

    /* ---------------------- 图标 / 基础控件 ---------------------- */
    .gr-ico{display:block;flex:none}
    .gr-icon-btn{
      display:inline-flex;align-items:center;justify-content:center;
      width:32px;height:32px;border-radius:999px;border:1px solid transparent;
      background:transparent;cursor:pointer;flex:none;color:var(--gr-t2);
      transition:background 160ms ease,color 160ms ease,transform 160ms ease;
    }
    .gr-icon-btn:hover{background:var(--gr-fill);color:var(--gr-t1)}
    .gr-icon-btn:active{transform:scale(.94)}
    .gr-icon-btn.is-spinning .gr-ico{animation:gr-spin .9s linear infinite}
    .gr-icon-btn.is-on{color:var(--gr-accent)}
    .gr-btn{
      display:inline-flex;align-items:center;justify-content:center;gap:7px;
      height:34px;padding:0 16px;border-radius:999px;border:1px solid var(--gr-line);
      background:color-mix(in srgb,var(--gr-l1) 62%,transparent);color:var(--gr-t1);
      font-size:12.5px;font-weight:650;letter-spacing:-.01em;cursor:pointer;
      transition:background 160ms ease,border-color 160ms ease,transform 160ms ease;
      white-space:nowrap;
    }
    .gr-btn:hover{background:var(--gr-fill2)}
    .gr-btn:active{transform:scale(.97)}
    .gr-btn.accent{border-color:transparent;background:linear-gradient(135deg,var(--gr-accent),var(--gr-accent-2));color:var(--gr-on-accent);box-shadow:0 12px 26px -14px color-mix(in srgb,var(--gr-accent) 78%,transparent)}
    .gr-btn.accent:hover{filter:brightness(1.04)}
    .gr-btn.lg{height:40px;padding:0 22px;font-size:13px}
    .gr-link-btn{border:0;background:none;padding:0 2px;color:var(--gr-accent);font-size:12px;font-weight:700;cursor:pointer}
    .gr-spinner{width:14px;height:14px;border-radius:50%;display:inline-block;flex:none;border:2px solid color-mix(in srgb,currentColor 28%,transparent);border-top-color:currentColor;animation:gr-spin .8s linear infinite}
    .gr-live-dot{width:6px;height:6px;border-radius:50%;background:var(--gr-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--gr-accent) 16%,transparent);flex:none}
    .gr-live-dot[data-playing="true"]{animation:gr-pulse-dot 1.7s ease-in-out infinite}
    .gr-live-bars{display:inline-flex;align-items:flex-end;gap:2px;height:13px;flex:none}
    .gr-live-bars i{display:block;width:2.5px;border-radius:2px;background:var(--gr-accent);animation:gr-bar-bounce 1s ease-in-out infinite}
    .gr-live-bars i:nth-child(1){height:45%;animation-delay:-.2s}
    .gr-live-bars i:nth-child(2){height:80%;animation-delay:-.5s}
    .gr-live-bars i:nth-child(3){height:60%;animation-delay:-.35s}
    .gr-live-bars i:nth-child(4){height:95%;animation-delay:-.7s}
    .gr-live-bars.is-idle i{animation:none;background:var(--gr-t3);opacity:.5}
    .gr-live-bars.is-idle i:nth-child(1){height:35%}
    .gr-live-bars.is-idle i:nth-child(2){height:55%}
    .gr-live-bars.is-idle i:nth-child(3){height:40%}
    .gr-live-bars.is-idle i:nth-child(4){height:60%}
    .gr-tag{
      display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;
      font-size:10.5px;font-weight:650;letter-spacing:.01em;color:var(--gr-t2);
      background:var(--gr-fill);white-space:nowrap;line-height:1;
    }
    .gr-tag.is-active{background:var(--gr-accent-soft);color:color-mix(in srgb,var(--gr-accent) 82%,var(--gr-t1))}
    .gr-slider{
      -webkit-appearance:none;appearance:none;display:block;width:100%;height:18px;margin:0;
      background:linear-gradient(90deg,var(--gr-accent),var(--gr-accent-2)) no-repeat;
      background-color:color-mix(in srgb,var(--gr-t1) 13%,transparent);
      background-size:0% 100%;border-radius:999px;cursor:pointer;outline-offset:4px;
    }
    .gr-slider::-webkit-slider-runnable-track{height:4px;border-radius:999px;background:transparent}
    .gr-slider::-webkit-slider-thumb{
      -webkit-appearance:none;width:13px;height:13px;margin-top:-4.5px;border-radius:50%;
      background:#fff;border:2px solid var(--gr-accent);box-shadow:0 1px 5px rgba(0,0,0,.28);
    }
    .gr-slider::-moz-range-track{height:4px;border-radius:999px;background:color-mix(in srgb,var(--gr-t1) 13%,transparent)}
    .gr-slider::-moz-range-progress{height:4px;border-radius:999px;background:var(--gr-accent)}
    .gr-slider::-moz-range-thumb{width:13px;height:13px;border-radius:50%;background:#fff;border:2px solid var(--gr-accent)}

    /* ---------------------- 顶栏 ---------------------- */
    .gr-header-shell{
      position:sticky;top:0;z-index:40;width:100%;flex:none;
      padding-top:calc(var(--dsh-frame-top-clearance,0px) + 10px);
      padding-bottom:10px;
      background:color-mix(in srgb,var(--gr-bg) 88%,transparent);
      border-bottom:1px solid var(--gr-line2);
      backdrop-filter:blur(22px) saturate(160%);-webkit-backdrop-filter:blur(22px) saturate(160%);
    }
    .gr-header{
      max-width:1440px;margin:0 auto;padding:0 30px;
      display:grid;grid-template-columns:minmax(150px,1fr) minmax(260px,440px) minmax(150px,1fr);
      align-items:center;gap:18px;min-height:40px;
    }
    .gr-brand{display:flex;align-items:center;gap:10px;min-width:0;justify-self:start}
    .gr-brand-logo{width:30px;height:30px;border-radius:9px;display:block;flex:none;box-shadow:0 5px 14px -8px rgba(226,106,18,.6)}
    .gr-brand-text{display:flex;flex-direction:column;justify-content:center;min-width:0;line-height:1.2}
    .gr-brand-title{font-size:16px;font-weight:760;letter-spacing:-.02em;white-space:nowrap}
    .gr-brand-sub{font-size:10.5px;color:var(--gr-t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gr-search{
      display:flex;align-items:center;gap:8px;height:36px;width:100%;
      padding:0 13px;border-radius:999px;border:1px solid var(--gr-line);
      background:color-mix(in srgb,var(--gr-l1) 56%,transparent);color:var(--gr-t3);
      transition:border-color 180ms ease,box-shadow 180ms ease,background 180ms ease;
    }
    .gr-search:focus-within{
      color:var(--gr-t2);border-color:var(--gr-accent-line);
      box-shadow:0 0 0 3px var(--gr-accent-soft);background:color-mix(in srgb,var(--gr-l1) 82%,transparent);
    }
    .gr-search-ico{color:var(--gr-t3);flex:none}
    .gr-search-input{flex:1;min-width:0;height:100%;border:0;outline:none;background:none;color:var(--gr-t1);font-size:12.5px;padding:0}
    .gr-search-input::placeholder{color:var(--gr-t3)}
    .gr-search-input::-webkit-search-cancel-button{display:none}
    .gr-search-clear{width:19px;height:19px;border-radius:50%;border:0;background:var(--gr-fill2);color:var(--gr-t2);display:grid;place-items:center;cursor:pointer;flex:none;padding:0}
    .gr-search-clear:hover{color:var(--gr-t1)}
    .gr-header-tools{display:flex;align-items:center;gap:8px;min-width:0;justify-self:end}
    .gr-onair{
      display:flex;align-items:center;gap:9px;height:36px;padding:0 13px 0 5px;
      border-radius:999px;border:1px solid var(--gr-line);background:color-mix(in srgb,var(--gr-l1) 52%,transparent);
      cursor:pointer;min-width:0;max-width:320px;transition:background 160ms ease,border-color 160ms ease;
    }
    .gr-onair:hover{background:var(--gr-fill2);border-color:var(--gr-accent-line)}
    .gr-onair.is-playing{border-color:var(--gr-accent-line);background:var(--gr-accent-soft)}
    .gr-onair-logo{flex:none;box-shadow:0 2px 7px -3px rgba(0,0,0,.35)}
    .gr-onair-text{display:flex;flex-direction:column;justify-content:center;min-width:0;line-height:1.25;text-align:left}
    .gr-onair-name{font-size:11.5px;font-weight:680;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}
    .gr-onair-freq{font-size:10px;color:var(--gr-t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}
    .gr-onair-bars{height:11px;margin-right:2px}

    /* ---------------------- Hero：正在播出 / 欢迎 ---------------------- */
    .gr-hero{
      position:relative;overflow:hidden;border-radius:var(--gr-r-xl);
      margin-top:2px;padding:24px;border:1px solid var(--gr-line2);
      background:
        radial-gradient(720px 240px at 4% -50%,color-mix(in srgb,var(--gr-hero-a,var(--gr-accent)) 22%,transparent),transparent 62%),
        radial-gradient(680px 260px at 98% 140%,color-mix(in srgb,var(--gr-hero-b,var(--gr-accent-2)) 16%,transparent),transparent 64%),
        color-mix(in srgb,var(--gr-l1) 66%,var(--gr-bg));
      box-shadow:var(--gr-shadow-1);
    }
    .gr-hero-glow{position:absolute;inset:-42% -8% auto;height:200px;background:radial-gradient(closest-side,var(--gr-hero-a,var(--gr-accent)),transparent);opacity:.14;filter:blur(26px);pointer-events:none}
    .gr-hero-main{
      position:relative;z-index:1;display:grid;
      grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:22px;
    }
    .gr-hero-art{position:relative;display:flex;flex-direction:column;align-items:center;gap:10px;flex:none}
    .gr-hero-art .gr-logo{border-radius:24px;box-shadow:0 20px 40px -22px rgba(0,0,0,.52)}
    .gr-hero-live{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 10px;border-radius:999px;background:color-mix(in srgb,var(--gr-t1) 7%,transparent);font-size:10px;font-weight:700;color:var(--gr-t2);white-space:nowrap;line-height:1}
    .gr-hero-live-dot{width:5px;height:5px;border-radius:50%;background:var(--gr-t3);flex:none}
    .gr-hero-copy{display:flex;flex-direction:column;gap:8px;min-width:0}
    .gr-hero-kicker{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:750;letter-spacing:.08em;text-transform:uppercase;color:var(--gr-t3);line-height:1}
    .gr-hero-name{margin:0;font-size:clamp(21px,2.2vw,28px);font-weight:780;letter-spacing:-.03em;line-height:1.15;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .gr-hero-sub{margin:0;font-size:12px;color:var(--gr-t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gr-hero-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:1px}
    .gr-freq-plate{
      display:flex;align-items:baseline;gap:7px;flex:none;
      padding:13px 18px;border-radius:18px;
      background:color-mix(in srgb,var(--gr-l2) 74%,transparent);
      border:1px solid color-mix(in srgb,var(--gr-hero-a,var(--gr-accent)) 28%,var(--gr-line2));
      box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 40%,transparent);
    }
    .gr-freq-type{font-size:10.5px;font-weight:800;letter-spacing:.08em;color:var(--gr-accent);background:var(--gr-accent-soft);border-radius:6px;padding:3px 6px;line-height:1;align-self:center}
    .gr-freq-value{font-size:32px;font-weight:800;letter-spacing:-.035em;line-height:1;font-variant-numeric:tabular-nums}
    .gr-freq-value.is-text{font-size:18px;letter-spacing:-.02em}
    .gr-freq-unit{font-size:10.5px;font-weight:650;color:var(--gr-t3);letter-spacing:.02em}
    .gr-freq-plate.is-online{align-items:center}
    .gr-hero-actions{display:flex;align-items:center;gap:6px;flex:none}
    .gr-play-hero{
      width:50px;height:50px;border-radius:50%;border:0;cursor:pointer;display:grid;place-items:center;flex:none;
      background:linear-gradient(140deg,var(--gr-accent),var(--gr-accent-2));color:var(--gr-on-accent);
      box-shadow:0 14px 30px -14px color-mix(in srgb,var(--gr-accent) 88%,transparent);
      transition:transform 160ms ease,filter 160ms ease;
    }
    .gr-play-hero:hover{transform:scale(1.05);filter:brightness(1.05)}
    .gr-play-hero:active{transform:scale(.96)}
    .gr-hero-fav.is-on{color:var(--gr-accent)}
    .gr-hero-volume{display:flex;align-items:center;gap:2px;width:118px;margin-left:4px}
    .gr-hero-volume .gr-slider{flex:1}

    /* Hero：欢迎 / 空态 */
    .gr-hero-welcome{
      padding:22px 24px 18px;border-style:solid;
      background:
        radial-gradient(700px 260px at 12% -60%,color-mix(in srgb,var(--gr-accent) 16%,transparent),transparent 68%),
        color-mix(in srgb,var(--gr-l1) 62%,var(--gr-bg));
    }
    .gr-welcome-main{position:relative;z-index:1;display:flex;align-items:center;gap:18px;min-width:0}
    .gr-welcome-mark{
      width:64px;height:64px;border-radius:20px;display:grid;place-items:center;flex:none;
      color:var(--gr-accent);background:linear-gradient(145deg,var(--gr-accent-soft),color-mix(in srgb,var(--gr-accent) 22%,transparent));
      border:1px solid var(--gr-accent-line);
    }
    .gr-welcome-copy{flex:1;min-width:0}
    .gr-welcome-copy h2{margin:0 0 4px;font-size:19px;font-weight:760;letter-spacing:-.025em;line-height:1.25}
    .gr-welcome-copy p{margin:0;font-size:12px;color:var(--gr-t2)}
    .gr-welcome-picks{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:16px}
    .gr-welcome-pick{
      display:flex;align-items:center;gap:10px;min-width:0;padding:9px 11px;text-align:left;
      border-radius:14px;border:1px solid var(--gr-line2);background:color-mix(in srgb,var(--gr-l2) 62%,transparent);
      cursor:pointer;transition:background 150ms ease,border-color 150ms ease,transform 150ms ease;
    }
    .gr-welcome-pick:hover{background:color-mix(in srgb,var(--gr-l2) 92%,transparent);border-color:var(--gr-line);transform:translateY(-1px)}
    .gr-welcome-pick-text{display:flex;flex-direction:column;min-width:0;line-height:1.3}
    .gr-welcome-pick-name{font-size:11.5px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gr-welcome-pick-sub{font-size:10px;color:var(--gr-t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

    /* ---------------------- 过滤 chips ---------------------- */
    .gr-filters{display:flex;flex-direction:column;gap:9px;margin:16px 0 4px}
    .gr-filter-row{display:flex;align-items:center;gap:7px;overflow-x:auto;scrollbar-width:none;padding:1px}
    .gr-filter-row::-webkit-scrollbar{display:none}
    .gr-chip{
      display:inline-flex;align-items:center;justify-content:center;gap:5px;flex:none;height:30px;padding:0 13px;
      border-radius:999px;border:1px solid var(--gr-line);background:color-mix(in srgb,var(--gr-l1) 50%,transparent);
      color:var(--gr-t2);font-size:11.5px;font-weight:650;cursor:pointer;white-space:nowrap;line-height:1;
      transition:background 150ms ease,color 150ms ease,border-color 150ms ease,box-shadow 150ms ease;
    }
    .gr-chip:hover{background:var(--gr-fill2);color:var(--gr-t1)}
    .gr-chip.is-active{
      border-color:transparent;background:linear-gradient(135deg,var(--gr-accent),var(--gr-accent-2));
      color:var(--gr-on-accent);box-shadow:0 8px 18px -12px color-mix(in srgb,var(--gr-accent) 85%,transparent);
    }
    .gr-chip-soft{height:28px;padding:0 11px;background:transparent;border-color:transparent;color:var(--gr-t3)}
    .gr-chip-soft:hover{background:var(--gr-fill)}
    .gr-chip-soft.is-active{background:var(--gr-accent-soft);color:color-mix(in srgb,var(--gr-accent) 82%,var(--gr-t1));border-color:var(--gr-accent-line);box-shadow:none}

    /* ---------------------- 分节 / 卡片网格 ---------------------- */
    .gr-section{margin-top:24px;animation:gr-fade .3s ease both}
    .gr-section-head{display:flex;align-items:center;gap:10px;margin-bottom:11px;min-height:26px}
    .gr-section-head h3{margin:0;font-size:16.5px;font-weight:760;letter-spacing:-.02em;line-height:1.2}
    .gr-section-hint{font-size:11px;color:var(--gr-t3);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .gr-section-count{margin-left:auto;font-size:10.5px;font-weight:700;color:var(--gr-t3);background:var(--gr-fill);height:22px;min-width:22px;padding:0 8px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;line-height:1}
    .gr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(248px,1fr));gap:11px}
    .gr-card{
      position:relative;display:flex;align-items:center;gap:12px;min-width:0;min-height:78px;
      padding:10px 12px 10px 10px;border-radius:var(--gr-r-md);border:1px solid var(--gr-line2);
      background:color-mix(in srgb,var(--gr-l1) 46%,transparent);
      cursor:pointer;text-align:left;color:inherit;
      transition:background 160ms ease,border-color 160ms ease,transform 160ms ease,box-shadow 160ms ease;
    }
    .gr-card:hover{background:color-mix(in srgb,var(--gr-l2) 82%,transparent);border-color:var(--gr-line);transform:translateY(-2px);box-shadow:var(--gr-shadow-2)}
    .gr-card.is-current{border-color:var(--gr-accent-line);background:color-mix(in srgb,var(--gr-accent) 8%,var(--gr-l2))}
    .gr-card-art{position:relative;width:58px;height:58px;flex:none;border-radius:16px}
    .gr-card-art .gr-logo{display:block;border-radius:16px !important;box-shadow:0 8px 18px -14px rgba(0,0,0,.5)}
    .gr-card-play{
      position:absolute;inset:0;border-radius:16px;display:grid;place-items:center;
      background:rgba(16,12,8,.4);color:#fff;opacity:0;transition:opacity 160ms ease;
    }
    .gr-card:hover .gr-card-play{opacity:1}
    .gr-card.is-playing .gr-card-play{opacity:1;background:rgba(16,12,8,.34)}
    .gr-card-bars{position:absolute;left:7px;bottom:6px;height:10px}
    .gr-card-bars i{width:2px}
    .gr-card-body{display:flex;flex-direction:column;justify-content:center;gap:3px;min-width:0;flex:1;padding-right:18px;line-height:1.3}
    .gr-card-name{font-size:12.8px;font-weight:680;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gr-card-freq{display:flex;align-items:baseline;gap:4px;font-size:11px;font-weight:700;color:color-mix(in srgb,var(--gr-accent) 76%,var(--gr-t1));white-space:nowrap;overflow:hidden;line-height:1.25}
    .gr-card-freq em{font-style:normal;font-size:9px;font-weight:800;letter-spacing:.06em;background:var(--gr-accent-soft);border-radius:4px;padding:2px 4px;color:var(--gr-accent);line-height:1}
    .gr-card-freq b{font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
    .gr-card-freq i{font-style:normal;font-size:9px;font-weight:650;color:var(--gr-t3);letter-spacing:.02em}
    .gr-card-freq.is-online b{font-size:11px;font-weight:650;letter-spacing:0}
    .gr-card-meta{font-size:10.5px;color:var(--gr-t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3}
    .gr-card-fav{
      position:absolute;top:8px;right:8px;width:24px;height:24px;border:0;border-radius:50%;
      background:transparent;color:var(--gr-t3);display:grid;place-items:center;cursor:pointer;padding:0;
      opacity:0;transition:opacity 150ms ease,color 150ms ease,background 150ms ease;
    }
    .gr-card:hover .gr-card-fav,.gr-card-fav.is-on{opacity:1}
    .gr-card-fav:hover{background:var(--gr-fill2);color:var(--gr-t1)}
    .gr-card-fav.is-on{color:var(--gr-accent)}
    .gr-logo{display:block;object-fit:cover;flex:none;background:var(--gr-fill)}
    .gr-logo-fallback{display:inline-grid;place-items:center;overflow:hidden;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.2)}
    .gr-logo-initials{font-weight:800;letter-spacing:-.02em;line-height:1}
    .gr-cover{background-size:cover;background-position:center;border-radius:18px}

    /* ---------------------- 结果 / 空态 / 骨架 / toast ---------------------- */
    .gr-results{margin-top:18px;animation:gr-fade .28s ease both}
    .gr-results-head{display:flex;align-items:center;gap:10px;margin-bottom:11px;min-height:26px}
    .gr-results-head h3{margin:0;font-size:16.5px;font-weight:760;letter-spacing:-.02em;line-height:1.2}
    .gr-results-count{font-size:11px;color:var(--gr-t3)}
    .gr-source-pill{font-size:9px;font-weight:800;letter-spacing:.06em;color:var(--gr-t3);border:1px solid var(--gr-line);border-radius:5px;padding:1px 5px}
    .gr-loading-row{display:flex;align-items:center;gap:9px;color:var(--gr-t2);font-size:12.5px;padding:40px 0;justify-content:center}
    .gr-empty{
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
      padding:46px 22px;text-align:center;color:var(--gr-t2);
      border:1px dashed var(--gr-line);border-radius:var(--gr-r-lg);margin-top:16px;
      background:color-mix(in srgb,var(--gr-l1) 30%,transparent);
    }
    .gr-empty .gr-ico{color:var(--gr-t3);margin-bottom:2px}
    .gr-empty strong{font-size:13.5px;font-weight:700;color:var(--gr-t1)}
    .gr-empty span{font-size:12px;color:var(--gr-t2);max-width:440px}
    .gr-empty .gr-btn{margin-top:6px}
    .gr-error{border-color:color-mix(in srgb,var(--gr-error) 32%,transparent);background:color-mix(in srgb,var(--gr-error) 5%,transparent)}
    .gr-error .gr-ico{color:var(--gr-error)}
    .gr-inline-error{display:flex;align-items:center;gap:9px;margin-top:12px;padding:9px 12px;border-radius:12px;border:1px solid color-mix(in srgb,var(--gr-error) 30%,transparent);background:color-mix(in srgb,var(--gr-error) 6%,transparent);color:var(--gr-t2);font-size:11.5px;line-height:1.4}
    .gr-inline-error .gr-ico{color:var(--gr-error);flex:none}
    .gr-inline-error .gr-link-btn{margin-left:auto;flex:none}
    .gr-source-note{display:flex;align-items:center;gap:6px;margin-top:16px;font-size:11px;color:var(--gr-t3)}
    .gr-skeleton-wrap{margin-top:20px}
    .gr-skeleton-section{margin-bottom:26px}
    .gr-skeleton-title{display:block;width:140px;height:16px;border-radius:6px;background:var(--gr-fill);margin-bottom:12px;animation:gr-shimmer 1.4s ease-in-out infinite}
    .gr-skeleton-card{display:block;height:80px;border-radius:var(--gr-r-md);background:var(--gr-fill);animation:gr-shimmer 1.4s ease-in-out infinite}
    .gr-skeleton-card:nth-child(2n){animation-delay:.2s}
    .gr-skeleton-card:nth-child(3n){animation-delay:.4s}
    .gr-toast{
      position:absolute;left:50%;bottom:150px;transform:translateX(-50%);z-index:60;
      display:flex;align-items:center;gap:8px;height:36px;padding:0 15px;border-radius:999px;
      background:color-mix(in srgb,var(--gr-l2) 94%,transparent);color:var(--gr-t1);
      border:1px solid var(--gr-line);box-shadow:0 16px 34px -18px rgba(0,0,0,.45);
      font-size:12px;font-weight:600;backdrop-filter:blur(16px);animation:gr-toast-in .22s ease both;
      max-width:min(520px,80vw);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    }
    .gr-toast-ico{color:var(--gr-accent);flex:none}
    .gr-toast.is-error{border-color:color-mix(in srgb,var(--gr-error) 40%,transparent)}
    .gr-toast.is-error .gr-toast-ico{color:var(--gr-error)}
    .gr-toast.is-success .gr-toast-ico{color:var(--gr-success)}

    /* ---------------------- 面板内底部播放条 ---------------------- */
    .gr-dock-shell{flex:none;width:100%;max-width:1440px;margin:0 auto;padding:8px 30px 16px}
    .gr-dock{
      display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:16px;
      height:72px;padding:0 16px 0 10px;border-radius:var(--gr-r-lg);
      border:1px solid var(--gr-line);background:color-mix(in srgb,var(--gr-l2) 84%,transparent);
      box-shadow:0 18px 44px -28px rgba(0,0,0,.42),inset 0 1px 0 color-mix(in srgb,#fff 55%,transparent);
      backdrop-filter:blur(20px) saturate(160%);
    }
    .gr-dock-info{display:flex;align-items:center;gap:11px;min-width:0;padding:0;border:0;background:none;cursor:pointer;text-align:left;color:inherit;border-radius:14px}
    .gr-dock-info .gr-logo{box-shadow:0 6px 16px -10px rgba(0,0,0,.5)}
    .gr-dock-text{display:flex;flex-direction:column;justify-content:center;gap:1px;min-width:0;line-height:1.3}
    .gr-dock-name{font-size:13px;font-weight:700;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:320px}
    .gr-dock-sub{display:flex;align-items:baseline;gap:4px;font-size:10.5px;color:var(--gr-t3);white-space:nowrap;overflow:hidden}
    .gr-dock-sub em{font-style:normal;font-weight:800;letter-spacing:.05em;font-size:9.5px;color:var(--gr-accent);background:var(--gr-accent-soft);border-radius:4px;padding:2px 4px;line-height:1}
    .gr-dock-bars{height:12px;margin-left:4px}
    .gr-dock-dot{width:6px;height:6px;border-radius:50%;background:var(--gr-t3);margin-left:4px;flex:none}
    .gr-dock-center{display:flex;align-items:center;gap:6px;flex:none}
    .gr-dock-ctrl{
      display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;
      border:0;background:none;color:var(--gr-t2);cursor:pointer;flex:none;padding:0;
      transition:background 140ms ease,color 140ms ease,transform 140ms ease;
    }
    .gr-dock-ctrl:hover{background:var(--gr-fill);color:var(--gr-t1)}
    .gr-dock-ctrl:active{transform:scale(.93)}
    .gr-dock-ctrl.is-on{color:var(--gr-accent)}
    .gr-dock-toggle{
      width:44px;height:44px;border-radius:50%;border:0;display:grid;place-items:center;cursor:pointer;flex:none;
      background:linear-gradient(140deg,var(--gr-accent),var(--gr-accent-2));color:var(--gr-on-accent);
      box-shadow:0 10px 22px -12px color-mix(in srgb,var(--gr-accent) 88%,transparent);
      transition:transform 150ms ease,filter 150ms ease;
    }
    .gr-dock-toggle:hover{filter:brightness(1.05)}
    .gr-dock-toggle:active{transform:scale(.95)}
    .gr-dock-right{display:flex;align-items:center;justify-content:flex-end;gap:2px;min-width:0}
    .gr-dock-volume{display:flex;align-items:center;gap:2px;width:150px;min-width:0;margin:0 4px}
    .gr-dock-slider{flex:1}
    .gr-dock-slider::-webkit-slider-runnable-track{height:3px}
    .gr-dock-slider::-webkit-slider-thumb{width:11px;height:11px;margin-top:-4px}

    /* ---------------------- 发现页：大 banner + 分类卡 + 小横滑列表 ---------------------- */
    .gr-discover{display:flex;flex-direction:column}
    .gr-block-head{display:flex;align-items:center;gap:10px;margin:0 0 12px;min-height:26px}
    .gr-block-head h3{margin:0;font-size:17px;font-weight:760;letter-spacing:-.02em;line-height:1.2}
    .gr-block-hint{font-size:11px;color:var(--gr-t3);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .gr-block-count{margin-left:auto;font-size:10.5px;font-weight:700;color:var(--gr-t3);background:var(--gr-fill);height:22px;min-width:22px;padding:0 8px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;line-height:1}
    .gr-banners-wrap{margin-bottom:24px}
    .gr-banner-head{margin:0 0 10px}
    .gr-banner-shuffle{
      margin-left:auto;display:inline-flex;align-items:center;gap:5px;height:29px;padding:0 12px;
      border-radius:999px;border:1px solid var(--gr-line);background:color-mix(in srgb,var(--gr-l1) 62%,transparent);
      color:var(--gr-t2);font-size:11px;font-weight:650;cursor:pointer;white-space:nowrap;
      transition:background 150ms ease,color 150ms ease,border-color 150ms ease;
    }
    .gr-banner-shuffle:hover{background:var(--gr-fill2);color:var(--gr-t1);border-color:var(--gr-accent-line)}
    .gr-banners{
      display:grid;grid-template-columns:1.5fr 1fr;grid-template-rows:repeat(2,minmax(0,1fr));
      gap:12px;height:280px;
    }
    .gr-banner{
      position:relative;overflow:hidden;border:1px solid var(--gr-line2);border-radius:22px;
      padding:18px;display:flex;flex-direction:column;justify-content:space-between;
      text-align:left;cursor:pointer;color:#fff;isolation:isolate;
      background:linear-gradient(145deg,var(--gr-banner-b),#131009);
      transition:transform 180ms ease,box-shadow 180ms ease,border-color 180ms ease;
    }
    .gr-banner.is-big{grid-row:1 / 3;padding:24px;border-radius:26px}
    .gr-banner:hover{transform:translateY(-2px);box-shadow:var(--gr-shadow-2);border-color:var(--gr-line)}
    .gr-banner-bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:blur(3px) saturate(125%);opacity:.5;z-index:-2;transform:scale(1.06);transition:transform 400ms ease}
    .gr-banner:hover .gr-banner-bg{transform:scale(1.12)}
    .gr-banner-scrim{
      position:absolute;inset:0;z-index:-1;
      background:linear-gradient(140deg,color-mix(in srgb,var(--gr-banner-b) 62%,transparent),rgba(8,10,16,.55) 52%,rgba(8,10,16,.9));
    }
    .gr-banner-top{display:flex;align-items:center;gap:10px;min-width:0}
    .gr-banner-logo{box-shadow:0 10px 24px -12px rgba(0,0,0,.65);border-radius:16px !important}
    .gr-banner-badge{
      margin-left:auto;flex:none;display:inline-flex;align-items:center;height:22px;padding:0 10px;border-radius:999px;
      font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.78);
      background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);line-height:1;white-space:nowrap;
    }
    .gr-banner-body{display:flex;flex-direction:column;gap:4px;min-width:0;padding-right:56px}
    .gr-banner-name{font-size:15px;font-weight:750;letter-spacing:-.02em;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gr-banner.is-big .gr-banner-name{font-size:clamp(20px,2.3vw,26px);line-height:1.18}
    .gr-banner-sub{font-size:11.5px;font-weight:700;color:#ffd9a0;letter-spacing:.01em;line-height:1.2}
    .gr-banner-meta{font-size:10.5px;color:rgba(255,255,255,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gr-banner-play{
      position:absolute;right:16px;bottom:16px;width:44px;height:44px;border-radius:50%;
      display:grid;place-items:center;background:rgba(255,255,255,.94);color:#1c1206;
      box-shadow:0 12px 26px -12px rgba(0,0,0,.7);transition:transform 160ms ease;
    }
    .gr-banner.is-big .gr-banner-play{width:54px;height:54px}
    .gr-banner:hover .gr-banner-play{transform:scale(1.06)}

    .gr-genres{margin:0 0 8px}
    .gr-genre-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:9px}
    .gr-genre{
      display:flex;align-items:center;gap:8px;min-height:66px;padding:11px 8px 11px 12px;
      border-radius:16px;border:1px solid var(--gr-line2);background:color-mix(in srgb,var(--gr-l1) 44%,transparent);
      cursor:pointer;text-align:left;color:inherit;
      transition:background 160ms ease,border-color 160ms ease,transform 160ms ease,box-shadow 160ms ease;
    }
    .gr-genre:hover{background:color-mix(in srgb,var(--gr-l2) 78%,transparent);border-color:var(--gr-line);transform:translateY(-1px);box-shadow:var(--gr-shadow-1)}
    .gr-genre.is-busy{opacity:.68;pointer-events:none}
    .gr-genre-icon{
      width:38px;height:38px;border-radius:12px;display:grid;place-items:center;flex:none;
      color:var(--gr-accent);background:var(--gr-accent-soft);border:1px solid var(--gr-accent-line);
    }
    .gr-genre-body{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;line-height:1.3}
    .gr-genre-name{font-size:12.5px;font-weight:700;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gr-genre-sub{font-size:10px;color:var(--gr-t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gr-genre-arrow{color:var(--gr-t3);flex:none;opacity:.72}

    .gr-row-section{margin-top:24px}
    .gr-row-scroll{
      display:grid;grid-template-columns:repeat(6,minmax(0,1fr));
      gap:12px;padding:2px 2px 6px;overflow:visible;
    }
    .gr-row-card{
      min-width:0;display:flex;flex-direction:column;gap:8px;
      padding:0;border-radius:16px;border:1px solid transparent;background:transparent;
      color:inherit;text-align:left;cursor:pointer;
      transition:background 160ms ease,border-color 160ms ease,transform 160ms ease;
    }
    .gr-row-card:hover{background:var(--gr-fill);border-color:var(--gr-line2);transform:translateY(-1px)}
    .gr-row-card.is-current{background:var(--gr-accent-soft);border-color:var(--gr-accent-line)}
    .gr-row-art{position:relative;display:block;width:100%;aspect-ratio:1;border-radius:15px;overflow:hidden;box-shadow:0 10px 24px -20px rgba(0,0,0,.5)}
    .gr-row-card:hover .gr-row-art{transform:translateY(-1px)}
    .gr-row-art .gr-logo{width:100% !important;height:100% !important;border-radius:15px !important;object-fit:cover}
    .gr-row-art .gr-logo-fallback{width:100%;height:100%;border-radius:15px}
    .gr-row-hover{position:absolute;inset:0;border-radius:15px;display:grid;place-items:center;background:rgba(10,12,18,.34);color:#fff;opacity:0;transition:opacity 150ms ease}
    .gr-row-card:hover .gr-row-hover{opacity:1}
    .gr-row-eq{position:absolute;left:8px;bottom:7px;height:11px}
    .gr-row-name{font-size:11.5px;font-weight:680;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px}
    .gr-row-sub{font-size:10px;font-weight:650;color:var(--gr-t3);line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px}
    .gr-row-card.is-current .gr-row-sub{color:color-mix(in srgb,var(--gr-accent) 72%,var(--gr-t1))}
    .gr-skeleton-banner{display:block;height:280px;border-radius:24px;background:var(--gr-fill);animation:gr-shimmer 1.4s ease-in-out infinite;margin-bottom:24px}
    .gr-skeleton-rowcard{display:block;width:100%;aspect-ratio:.72;border-radius:16px;background:var(--gr-fill);animation:gr-shimmer 1.4s ease-in-out infinite}
    .gr-skeleton-rowcard:nth-child(2n){animation-delay:.2s}

    .gr-block-title{
      display:inline-flex;align-items:center;gap:4px;min-width:0;padding:0;border:0;background:none;
      color:inherit;cursor:pointer;text-align:left;font:inherit;
    }
    .gr-block-title:hover .gr-block-name{color:color-mix(in srgb,var(--gr-accent) 72%,var(--gr-t1))}
    .gr-block-name{font-size:17px;font-weight:760;letter-spacing:-.02em;line-height:1.2;white-space:nowrap}
    .gr-block-chevron{color:var(--gr-t3);opacity:.75;transition:transform 150ms ease,color 150ms ease;flex:none}
    .gr-block-title:hover .gr-block-chevron{transform:translateX(2px);color:var(--gr-accent);opacity:1}
    .gr-genre-more{
      width:26px;height:26px;flex:none;border:1px solid transparent;border-radius:8px;padding:0;
      background:transparent;color:var(--gr-t3);display:grid;place-items:center;cursor:pointer;opacity:.72;
      transition:background 150ms ease,color 150ms ease,opacity 150ms ease;
    }
    .gr-genre-more:hover{background:var(--gr-fill2);color:var(--gr-accent);opacity:1}
    .gr-collection-root .gr-scroll{padding-top:calc(var(--dsh-frame-top-clearance,0px) + 10px)}
    .gr-collection-head{
      max-width:1440px;margin:0 auto;padding:6px 30px 12px;display:flex;align-items:center;gap:14px;
    }
    .gr-collection-title{min-width:0;display:flex;flex-direction:column;gap:1px;line-height:1.25}
    .gr-collection-title h2{margin:0;font-size:22px;font-weight:780;letter-spacing:-.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gr-collection-title p{margin:0;font-size:11px;color:var(--gr-t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gr-back-btn{
      display:inline-flex;align-items:center;gap:5px;height:32px;padding:0 13px 0 9px;flex:none;
      border-radius:999px;border:1px solid var(--gr-line);background:color-mix(in srgb,var(--gr-l1) 58%,transparent);
      color:var(--gr-t2);font-size:11.5px;font-weight:650;cursor:pointer;
    }
    .gr-back-btn:hover{background:var(--gr-fill2);color:var(--gr-t1)}
    .gr-load-more-wrap{display:flex;justify-content:center;padding:24px 0 8px}
    .gr-load-more-wrap .gr-btn{min-width:140px}
    .gr-cities{margin:6px 0 10px}
    .gr-city-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:8px}
    .gr-city{
      display:flex;align-items:center;gap:6px;min-width:0;height:42px;padding:0 9px 0 10px;
      border-radius:12px;border:1px solid var(--gr-line2);background:color-mix(in srgb,var(--gr-l1) 38%,transparent);
      color:var(--gr-t1);cursor:pointer;text-align:left;font-size:11.5px;font-weight:650;
      transition:background 150ms ease,border-color 150ms ease,transform 150ms ease,box-shadow 150ms ease;
    }
    .gr-city:hover{background:color-mix(in srgb,var(--gr-l2) 78%,transparent);border-color:var(--gr-accent-line);transform:translateY(-1px);box-shadow:var(--gr-shadow-1)}
    .gr-city-icon{width:24px;height:24px;border-radius:8px;display:grid;place-items:center;flex:none;color:var(--gr-accent);background:var(--gr-accent-soft)}
    .gr-city-name{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gr-city-chevron{color:var(--gr-t3);flex:none;opacity:.75}
    .gr-city:hover .gr-city-chevron{color:var(--gr-accent);opacity:1}

    /* ---------------------- 面板底部大播放条 ---------------------- */
    .gr-playerbar-shell{flex:none;width:100%;max-width:1440px;margin:0 auto;padding:10px 30px 16px}
    .gr-playerbar{
      position:relative;overflow:hidden;
      display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:18px;
      min-height:112px;padding:12px 14px;border-radius:24px;
      border:1px solid var(--gr-line);background:color-mix(in srgb,var(--gr-l2) 84%,transparent);
      box-shadow:0 20px 48px -30px rgba(0,0,0,.42),inset 0 1px 0 color-mix(in srgb,#fff 50%,transparent);
      backdrop-filter:blur(20px) saturate(160%);
    }
    .gr-playerbar::before{
      content:"";position:absolute;inset:0;pointer-events:none;
      background:radial-gradient(620px 200px at 5% 0%,color-mix(in srgb,var(--gr-pb-a) 14%,transparent),transparent 66%);
    }
    .gr-playerbar-info{
      position:relative;z-index:1;display:flex;align-items:center;gap:12px;min-width:0;
      padding:0;border:0;background:none;cursor:pointer;text-align:left;color:inherit;border-radius:18px;
    }
    .gr-playerbar-info .gr-logo{width:76px !important;height:76px !important;border-radius:20px !important;box-shadow:0 12px 26px -18px rgba(0,0,0,.55)}
    .gr-playerbar-text{display:flex;flex-direction:column;gap:2px;min-width:0;line-height:1.3}
    .gr-playerbar-kicker{display:flex;align-items:center;gap:6px;font-size:9.5px;font-weight:750;letter-spacing:.08em;text-transform:uppercase;color:var(--gr-t3);line-height:1}
    .gr-playerbar-name{font-size:16px;font-weight:760;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.25}
    .gr-playerbar-meta{font-size:10.5px;color:var(--gr-t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3}
    .gr-playerbar-freq{
      display:flex;align-items:baseline;gap:5px;flex:none;margin-left:4px;padding:7px 11px;border-radius:13px;
      background:color-mix(in srgb,var(--gr-pb-a) 9%,transparent);border:1px solid color-mix(in srgb,var(--gr-pb-a) 24%,transparent);
    }
    .gr-playerbar-freq em{font-style:normal;font-size:9px;font-weight:800;letter-spacing:.08em;color:var(--gr-accent);line-height:1}
    .gr-playerbar-freq b{font-size:20px;font-weight:800;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
    .gr-playerbar-freq i{font-style:normal;font-size:9px;font-weight:650;color:var(--gr-t3)}
    .gr-playerbar-tags{display:flex;gap:4px;flex:none;margin-left:2px}
    .gr-playerbar-tag{font-size:9px;font-weight:650;color:var(--gr-t3);background:var(--gr-fill);border-radius:999px;padding:3px 7px;line-height:1;white-space:nowrap}
    .gr-playerbar-center{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:14px;flex:none}
    .gr-pb-ctrl{
      width:38px;height:38px;border-radius:50%;border:1px solid var(--gr-line2);background:transparent;
      color:var(--gr-t2);display:grid;place-items:center;cursor:pointer;flex:none;
      transition:background 150ms ease,color 150ms ease,transform 150ms ease;
    }
    .gr-pb-ctrl:hover{background:var(--gr-fill);color:var(--gr-t1)}
    .gr-pb-ctrl:active{transform:scale(.94)}
    .gr-pb-play{
      width:56px;height:56px;border-radius:50%;border:0;display:grid;place-items:center;cursor:pointer;flex:none;
      background:linear-gradient(140deg,var(--gr-accent),var(--gr-accent-2));color:var(--gr-on-accent);
      box-shadow:0 14px 30px -14px color-mix(in srgb,var(--gr-accent) 85%,transparent);
      transition:transform 150ms ease,filter 150ms ease;
    }
    .gr-pb-play:hover{filter:brightness(1.05);transform:scale(1.03)}
    .gr-pb-play:active{transform:scale(.96)}
    .gr-playerbar-actions{position:relative;z-index:1;display:flex;align-items:center;justify-content:flex-end;gap:4px;min-width:0}
    .gr-playerbar-volume{display:flex;align-items:center;gap:2px;width:140px;margin:0 2px}
    .gr-playerbar-slider{flex:1}
    .gr-playerbar-slider::-webkit-slider-runnable-track{height:3px}
    .gr-playerbar-slider::-webkit-slider-thumb{width:11px;height:11px;margin-top:-4px}

    /* ---------------------- 全屏播放页 ---------------------- */
    .gr-player-root{position:relative;color:#f7f4ee;background:#0a0e17}
    .gr-player-bg{position:absolute;inset:-70px;background-size:cover;background-position:center;filter:blur(60px) saturate(145%);opacity:.5;transform:scale(1.16);pointer-events:none}
    .gr-player-scrim{
      position:absolute;inset:0;pointer-events:none;
      background:
        radial-gradient(900px 420px at 50% -12%,rgba(255,255,255,.1),transparent 62%),
        radial-gradient(760px 520px at 10% 112%,color-mix(in srgb,var(--gr-p-a,#f0a12a) 18%,transparent),transparent 66%),
        linear-gradient(180deg,rgba(8,11,18,.5),rgba(8,11,18,.9) 56%,rgba(8,11,18,.97));
    }
    .gr-player-inner{
      position:relative;z-index:1;height:100%;display:flex;flex-direction:column;
      padding:calc(var(--dsh-frame-top-clearance,0px) + 14px) 32px 16px;overflow-y:auto;scrollbar-width:thin;
    }
    .gr-player-head{display:flex;align-items:center;gap:12px;flex:none;max-width:1440px;width:100%;margin:0 auto}
    .gr-round-btn{
      display:inline-flex;align-items:center;justify-content:center;gap:6px;height:36px;padding:0 15px 0 11px;border-radius:999px;
      border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:rgba(255,255,255,.86);
      font-size:12px;font-weight:650;cursor:pointer;backdrop-filter:blur(12px);transition:background 160ms ease;
      white-space:nowrap;flex:none;
    }
    .gr-round-btn:hover{background:rgba(255,255,255,.14)}
    .gr-round-btn-icon{width:36px;height:36px;padding:0}
    .gr-player-brand{display:flex;align-items:center;gap:8px;margin:0 auto;font-size:11px;font-weight:700;letter-spacing:.08em;color:rgba(255,255,255,.52);text-transform:uppercase}
    .gr-player-brand img{border-radius:6px;opacity:.92}
    .gr-player-body{
      flex:1;min-height:0;display:grid;grid-template-columns:minmax(260px,340px) minmax(0,1fr);
      gap:clamp(28px,4vw,58px);align-items:center;
      max-width:1180px;width:100%;margin:0 auto;padding:14px 0 6px;
    }
    .gr-player-left{display:flex;flex-direction:column;align-items:center;gap:16px;min-width:0}
    .gr-disc{position:relative;width:min(300px,30vw);aspect-ratio:1;display:grid;place-items:center;border-radius:50%;flex:none}
    .gr-disc::before{
      content:"";position:absolute;inset:-14px;border-radius:50%;
      background:conic-gradient(from 0deg,transparent,color-mix(in srgb,var(--gr-p-a,#f0a12a) 62%,transparent),transparent 44%,color-mix(in srgb,var(--gr-p-b,#e66a12) 62%,transparent),transparent 80%);
      opacity:.55;filter:blur(8px);
    }
    .gr-disc-ring{position:absolute;inset:-7px;border-radius:50%;border:1px dashed rgba(255,255,255,.2)}
    .gr-disc-ring.is-spinning{animation:gr-spin 26s linear infinite}
    .gr-disc-logo{position:relative;z-index:2;border-radius:50% !important;box-shadow:0 30px 66px -30px rgba(0,0,0,.82),0 0 0 7px rgba(255,255,255,.05)}
    .gr-disc-logo.is-spinning{animation:gr-spin 24s linear infinite}
    .gr-disc-center{position:absolute;z-index:3;width:12px;height:12px;border-radius:50%;background:rgba(10,12,18,.82);box-shadow:0 0 0 5px rgba(255,255,255,.14)}
    .gr-player-live{display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 13px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);font-size:11px;font-weight:650;color:rgba(255,255,255,.82);line-height:1}
    .gr-player-live .gr-live-bars{height:11px}
    .gr-player-right{min-width:0;display:flex;flex-direction:column;gap:11px}
    .gr-player-kicker{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:750;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.5);line-height:1}
    .gr-player-freq{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;line-height:1}
    .gr-player-freq .gr-freq-type{font-size:12px;padding:4px 8px;border-radius:7px;background:rgba(255,255,255,.1);color:#ffd9a0;letter-spacing:.08em}
    .gr-player-freq .gr-freq-value{font-size:clamp(44px,5.2vw,64px);font-weight:820;letter-spacing:-.045em;color:#fff;font-variant-numeric:tabular-nums}
    .gr-player-freq .gr-freq-value.is-text{font-size:clamp(22px,2.6vw,30px);font-weight:720;letter-spacing:-.02em}
    .gr-player-freq .gr-freq-unit{font-size:13px;font-weight:650;color:rgba(255,255,255,.5);letter-spacing:.02em}
    .gr-freq-caption{font-size:9.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.36);margin-left:2px}
    .gr-player-name{margin:0;font-size:clamp(20px,2.3vw,27px);font-weight:740;letter-spacing:-.02em;line-height:1.2;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .gr-player-meta{font-size:12.5px;color:rgba(255,255,255,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gr-player-tags{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    .gr-player-tags .gr-tag{background:rgba(255,255,255,.09);color:rgba(255,255,255,.72);height:23px}
    .gr-visual-stage{margin-top:4px;border-radius:var(--gr-r-lg);border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);padding:11px 14px 6px;backdrop-filter:blur(12px)}
    .gr-visual-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:1px 2px 0;min-height:26px}
    .gr-visual-label{font-size:9.5px;font-weight:750;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.4);line-height:1}
    .gr-visual-modes{display:flex;align-items:center;gap:2px;background:rgba(0,0,0,.22);border-radius:999px;padding:2px}
    .gr-mode-btn{
      display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 10px;border:0;border-radius:999px;
      background:transparent;color:rgba(255,255,255,.55);font-size:10.5px;font-weight:650;cursor:pointer;line-height:1;
      transition:background 150ms ease,color 150ms ease;
    }
    .gr-mode-btn:hover{color:#fff;background:rgba(255,255,255,.08)}
    .gr-mode-btn.is-active{background:rgba(255,255,255,.16);color:#fff}
    .gr-visual-box{height:184px;margin-top:2px}
    .gr-visualizer-canvas{display:block;width:100%;height:100%}
    .gr-player-dock{
      display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:16px;
      width:min(920px,100%);margin:0 auto;padding:9px 16px;border-radius:999px;
      background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);
      backdrop-filter:blur(18px);flex:none;
    }
    .gr-player-fav{
      display:inline-flex;align-items:center;gap:6px;justify-self:start;height:32px;padding:0 13px;border-radius:999px;
      border:1px solid rgba(255,255,255,.14);background:transparent;color:rgba(255,255,255,.66);
      font-size:11px;font-weight:650;cursor:pointer;line-height:1;white-space:nowrap;
    }
    .gr-player-fav:hover{background:rgba(255,255,255,.1);color:#fff}
    .gr-player-fav.is-on{color:#ffd27a;border-color:rgba(255,210,122,.36);background:rgba(255,210,122,.1)}
    .gr-player-buttons{display:flex;align-items:center;gap:20px;justify-self:center}
    .gr-play-big{
      width:64px;height:64px;border-radius:50%;border:0;cursor:pointer;display:grid;place-items:center;
      background:linear-gradient(140deg,#fff,#ffe9c6);color:#1b1206;
      box-shadow:0 20px 44px -18px rgba(0,0,0,.7),0 0 0 7px rgba(255,255,255,.05);
      transition:transform 160ms ease,filter 160ms ease;
    }
    .gr-play-big:hover{transform:scale(1.05);filter:brightness(1.02)}
    .gr-play-big:active{transform:scale(.96)}
    .gr-player-volume{display:flex;align-items:center;gap:8px;justify-self:end;width:min(240px,26vw)}
    .gr-player-volume .gr-slider{flex:1;background:linear-gradient(90deg,#fff,#ffcf7a) no-repeat;background-color:rgba(255,255,255,.16);background-size:0% 100%}
    .gr-player-volume .gr-slider::-webkit-slider-thumb{border-color:#fff;background:#1c1408}
    .gr-player-volume-btn{color:rgba(255,255,255,.6)}
    .gr-player-volume-btn:hover{background:rgba(255,255,255,.12);color:#fff}
    .gr-volume-num{font-size:10.5px;font-weight:700;color:rgba(255,255,255,.44);min-width:32px;text-align:right;font-variant-numeric:tabular-nums}
    .gr-player-foot{display:flex;align-items:center;justify-content:center;gap:10px;flex:none;padding:10px 0 4px;font-size:11px;color:rgba(255,255,255,.4);min-height:30px}
    .gr-player-foot .gr-link-btn{color:#ffd27a}

    /* ---------------------- 侧栏迷你播放器 ---------------------- */
    /* 宿主 sidebar.footer.action 容器是横向 flex；宽迷你条强制占满一整行，和网易云迷你条上下堆叠 */
    [class*="footerActions"]:has(.gr-mini.is-wide){flex-wrap:wrap;row-gap:6px}
    [class*="footerActions"]:has(.gr-mini.is-wide) > *:has(.gr-mini.is-wide){flex:1 0 100%;max-width:100%}
    [class*="footerActions"]:has(.gr-mini.is-wide) > .gr-mini.is-wide{flex:1 0 100%;max-width:100%}
    [class*="footerActions"]:has(.gr-mini.is-rail){flex-wrap:wrap;row-gap:4px}
    [class*="footerActions"]:has(.gr-mini.is-rail) .gr-mini.is-rail{flex:1 0 100%}
    .gr-mini{
      position:relative;display:flex;flex-direction:column;gap:2px;
      width:100%;box-sizing:border-box;min-height:82px;padding:6px 9px 7px;
      border-radius:12px;border:1px solid var(--gr-line2);overflow:visible;margin:4px 0;
      background:color-mix(in srgb,var(--gr-t1) 4%,transparent);color:var(--gr-t1);text-align:left;
      transition:background 160ms ease;
    }
    .gr-mini:hover{background:color-mix(in srgb,var(--gr-t1) 8%,transparent)}
    .gr-mini-top{display:flex;align-items:center;gap:8px;min-width:0;flex:none;height:40px}
    .gr-mini-cover-btn{position:relative;display:block;flex:none;width:40px;height:40px;padding:0;border:0;border-radius:12px;background:none;cursor:pointer;overflow:visible}
    .gr-mini-logo{display:block;border-radius:12px !important;box-shadow:0 3px 9px -5px rgba(0,0,0,.5)}
    .gr-mini-live-dot{position:absolute;right:-2px;bottom:-2px;width:10px;height:10px;border-radius:50%;background:var(--gr-accent);border:2px solid var(--gr-bg)}
    .gr-mini-text{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:1px;padding:0;border:0;background:none;cursor:pointer;text-align:left;color:inherit;overflow:hidden}
    .gr-mini-name{font-size:11.5px;font-weight:680;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gr-mini-sub{font-size:10px;color:color-mix(in srgb,var(--gr-accent) 66%,var(--gr-t3));font-weight:650;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gr-mini-volume{position:relative;display:flex;align-items:center;flex:none;margin-left:auto}
    .gr-mini-volume-btn{width:26px;height:26px}
    .gr-mini-volume-pop{
      position:absolute;right:0;bottom:calc(100% + 7px);width:118px;padding:9px 10px;
      border-radius:11px;border:1px solid var(--gr-line);background:color-mix(in srgb,var(--gr-l2) 96%,transparent);
      box-shadow:0 16px 34px -18px rgba(0,0,0,.5);backdrop-filter:blur(16px);z-index:20;
      opacity:0;visibility:hidden;transform:translateY(3px);pointer-events:none;
      transition:opacity 140ms ease,transform 140ms ease,visibility 140ms ease;
    }
    .gr-mini-volume:hover .gr-mini-volume-pop,
    .gr-mini-volume:focus-within .gr-mini-volume-pop{opacity:1;visibility:visible;transform:none;pointer-events:auto}
    .gr-mini-slider{flex:1;width:100%}
    .gr-mini-slider::-webkit-slider-runnable-track{height:3px}
    .gr-mini-slider::-webkit-slider-thumb{width:10px;height:10px;margin-top:-3.5px}
    .gr-mini-controls{display:flex;align-items:center;gap:22px;flex:none;width:100%;justify-content:center;margin-top:1px}
    .gr-mini-ctrl{
      width:28px;height:26px;border:0;border-radius:7px;background:none;padding:0;
      display:grid;place-items:center;color:var(--gr-t2);cursor:pointer;flex:none;
    }
    .gr-mini-ctrl:hover{background:var(--gr-fill);color:var(--gr-t1)}
    .gr-mini-toggle{
      width:30px;height:30px;border-radius:50%;border:0;display:grid;place-items:center;cursor:pointer;flex:none;
      background:linear-gradient(140deg,var(--gr-accent),var(--gr-accent-2));color:var(--gr-on-accent);
      box-shadow:0 4px 12px -6px color-mix(in srgb,var(--gr-accent) 80%,transparent);
    }
    .gr-mini-toggle:hover{filter:brightness(1.05)}
    .gr-mini-level{position:absolute;left:9px;right:9px;bottom:1px;height:2px;overflow:hidden;border-radius:2px;background:color-mix(in srgb,var(--gr-t1) 8%,transparent)}
    .gr-mini-level::after{content:"";display:block;height:100%;width:42%;border-radius:2px;background:linear-gradient(90deg,var(--gr-accent),var(--gr-accent-2));opacity:.85;animation:gr-mini-level 2.4s ease-in-out infinite}
    .gr-mini-level.is-playing::after{animation-play-state:running}
    .gr-mini-level:not(.is-playing)::after{animation:none;width:100%;opacity:.28}
    .gr-mini.is-rail{
      position:relative;display:grid;place-items:center;width:36px;max-width:36px;height:38px;
      min-height:0;padding:1px;margin:2px auto;border-radius:11px;overflow:visible;
      border:1px solid var(--gr-line2);background:transparent;
    }
    .gr-mini.is-rail:hover{background:var(--gr-fill)}
    .gr-mini-rail-logo{display:block;border-radius:50% !important}
    .gr-mini-rail-pulse{position:absolute;inset:-3px;border-radius:50%;border:1.5px solid var(--gr-accent);animation:gr-pulse 2s ease-out infinite;pointer-events:none}
    .gr-mini.is-rail[data-playing="false"] .gr-mini-rail-pulse{animation:none;opacity:.35}
    .gr-panel-mark{
      display:grid;place-items:center;flex:none;box-sizing:border-box;overflow:hidden;
      color:#e07a0c;background:linear-gradient(160deg,#fff8ee,#ffe7c9);
      border:1px solid color-mix(in srgb,var(--gr-accent) 22%,transparent);
      transition:transform 160ms ease,box-shadow 160ms ease;
    }
    .gr-panel-mark.is-active{transform:scale(1.05);box-shadow:0 3px 10px -4px color-mix(in srgb,var(--gr-accent) 55%,transparent)}

    /* ---------------------- 动画 ---------------------- */
    @keyframes gr-spin{to{transform:rotate(360deg)}}
    @keyframes gr-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
    @keyframes gr-pulse-dot{0%,100%{box-shadow:0 0 0 2px color-mix(in srgb,var(--gr-accent) 20%,transparent)}50%{box-shadow:0 0 0 5px color-mix(in srgb,var(--gr-accent) 6%,transparent)}}
    @keyframes gr-bar-bounce{0%,100%{transform:scaleY(.5);opacity:.7}50%{transform:scaleY(1);opacity:1}}
    @keyframes gr-pulse{0%{transform:scale(.92);opacity:.8}75%,100%{transform:scale(1.25);opacity:0}}
    @keyframes gr-shimmer{0%,100%{opacity:.55}50%{opacity:.95}}
    @keyframes gr-toast-in{from{opacity:0;transform:translate(-50%,6px)}to{opacity:1;transform:translate(-50%,0)}}
    @keyframes gr-level{0%,100%{transform:scaleX(.25);opacity:.55}50%{transform:scaleX(1);opacity:1}}
    @keyframes gr-mini-level{0%{transform:translateX(-100%)}100%{transform:translateX(260%)}}

    /* ---------------------- 响应式 ---------------------- */
    @media (max-width:1200px){
      .gr-row-scroll{grid-template-columns:repeat(5,minmax(0,1fr))}
    }
    @media (max-width:1080px){
      .gr-genre-grid{grid-template-columns:repeat(auto-fill,minmax(172px,1fr))}
      .gr-row-scroll{grid-template-columns:repeat(4,minmax(0,1fr))}
      .gr-playerbar-freq{display:none}
      .gr-playerbar-tags{display:none}
    }
    @media (max-width:900px){
      .gr-banners{grid-template-columns:1fr;grid-template-rows:none;height:auto}
      .gr-banner{min-height:136px}
      .gr-banner.is-big{grid-row:auto;min-height:190px}
      .gr-playerbar{grid-template-columns:minmax(0,1fr) auto;row-gap:10px;padding:12px 14px}
      .gr-playerbar-center{grid-column:2;grid-row:1}
      .gr-playerbar-actions{grid-column:1 / 3;grid-row:2;justify-content:space-between}
      .gr-playerbar-volume{width:min(240px,40vw)}
      .gr-playerbar-shell{padding:8px 20px 12px}
    }
    @media (max-width:720px){
      .gr-banner.is-big .gr-banner-name{font-size:20px}
      .gr-row-scroll{grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
      .gr-genre-grid{grid-template-columns:repeat(auto-fill,minmax(158px,1fr))}
      .gr-row-art{aspect-ratio:1}
      .gr-playerbar-name{font-size:14px}
      .gr-playerbar-info .gr-logo{width:62px !important;height:62px !important}
      .gr-playerbar{min-height:104px}
    }
    @media (max-width:560px){
      .gr-row-scroll{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .gr-banners{gap:9px}
      .gr-banner{padding:14px;border-radius:18px}
      .gr-banner-meta{display:none}
      .gr-genre-grid{grid-template-columns:1fr 1fr;gap:7px}
      .gr-genre{min-height:58px;padding:9px 10px;gap:9px}
      .gr-genre-icon{width:32px;height:32px;border-radius:10px}
      .gr-genre-sub{display:none}
      .gr-playerbar-name{font-size:13px}
      .gr-playerbar-meta{display:none}
      .gr-playerbar-volume{display:none}
      .gr-playerbar-center{gap:10px}
      .gr-pb-play{width:50px;height:50px}
    }
        @media (max-width:1240px){
      .gr-hero-main{grid-template-columns:auto minmax(0,1fr) auto;row-gap:14px}
      .gr-hero-actions{grid-column:2 / 4;justify-content:flex-start}
      .gr-freq-plate{margin-left:auto}
      .gr-dock{grid-template-columns:minmax(0,1fr) auto auto;gap:10px}
      .gr-dock-volume{width:110px}
    }
    @media (max-width:1080px){
      .gr-header{grid-template-columns:auto minmax(0,1fr) auto;gap:12px}
      .gr-brand-sub{display:none}
      .gr-player-body{grid-template-columns:minmax(220px,280px) minmax(0,1fr);gap:30px}
      .gr-visual-box{height:160px}
    }
    @media (max-width:900px){
      .gr-header{grid-template-columns:auto auto;grid-template-rows:auto auto;gap:8px 10px}
      .gr-brand{grid-column:1;grid-row:1}
      .gr-header-tools{grid-column:2;grid-row:1}
      .gr-search{grid-column:1 / 3;grid-row:2;width:100%}
      .gr-hero-main{grid-template-columns:auto minmax(0,1fr);row-gap:14px}
      .gr-freq-plate{grid-column:2;justify-self:start;margin-left:0;padding:9px 13px}
      .gr-freq-plate .gr-freq-value{font-size:26px}
      .gr-hero-actions{grid-column:1 / 3}
      .gr-welcome-main{flex-wrap:wrap}
      .gr-welcome-picks{grid-template-columns:1fr}
      .gr-player-body{grid-template-columns:1fr;gap:16px;align-items:start;padding-top:8px}
      .gr-player-left{flex-direction:row;justify-content:center;gap:16px}
      .gr-disc{width:min(220px,40vw)}
      .gr-player-freq .gr-freq-value{font-size:clamp(38px,8vw,52px)}
      .gr-visual-box{height:150px}
      .gr-player-dock{grid-template-columns:auto 1fr;grid-template-rows:auto auto;border-radius:22px;padding:10px 14px}
      .gr-player-fav{grid-column:1;grid-row:2;justify-self:start}
      .gr-player-buttons{grid-column:1 / 3;grid-row:1;justify-self:center}
      .gr-player-volume{grid-column:2;grid-row:2;width:min(200px,44vw)}
      .gr-dock{grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto;height:auto;min-height:70px;padding:8px 12px;gap:8px;border-radius:18px}
      .gr-dock-right{grid-column:1 / 3;grid-row:2;justify-content:flex-start}
      .gr-dock-volume{width:150px}
      .gr-dock-shell{padding:8px 20px 14px}
    }
    @media (max-width:720px){
      .gr-wrap{padding:14px 18px 22px}
      .gr-header{padding:0 18px}
      .gr-onair-text{display:none}
      .gr-onair{padding:0;width:36px;justify-content:center}
      .gr-grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:9px}
      .gr-hero{padding:18px;border-radius:22px}
      .gr-hero-art .gr-logo{width:82px !important;height:82px !important}
      .gr-hero-volume{width:110px}
      .gr-dock-shell{padding-left:18px;padding-right:18px}
      .gr-dock-name{max-width:200px}
      .gr-dock-volume{width:110px}
      .gr-player-inner{padding-left:20px;padding-right:20px}
      .gr-player-head .gr-round-btn span{display:none}
      .gr-player-head .gr-round-btn{width:36px;padding:0}
      .gr-player-brand{font-size:10px}
      .gr-player-fav span{display:none}
      .gr-player-fav{width:34px;padding:0;justify-content:center}
      .gr-visual-box{height:136px}
      .gr-player-buttons{gap:16px}
      .gr-play-big{width:56px;height:56px}
      .gr-player-foot{font-size:10.5px}
    }
    @media (max-width:720px){
      .gr-filter-row{
        -webkit-mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - 26px),transparent 100%);
        mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - 26px),transparent 100%);
      }
    }
    @media (max-width:560px){
      .gr-wrap{padding-left:13px;padding-right:13px}
      .gr-grid{grid-template-columns:1fr}
      .gr-hero-actions{flex-wrap:wrap}
      .gr-hero-volume{display:none}
      .gr-welcome-picks{display:none}
      .gr-welcome-mark{width:52px;height:52px;border-radius:16px}
      .gr-filter-row{padding-bottom:2px}
      .gr-player-freq .gr-freq-value{font-size:34px}
      .gr-player-name{font-size:18px}
      .gr-visual-modes .gr-mode-btn span{display:none}
      .gr-mode-btn{padding:0 8px}
      .gr-player-volume{width:min(200px,52vw)}
      .gr-mini-volume{display:none}
      .gr-dock-center{display:none}
      .gr-dock{grid-template-columns:1fr auto;grid-template-rows:auto}
      .gr-dock-right{display:none}
    }
    @media (prefers-reduced-motion:reduce){
      .gr-root *,.gr-mini *{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important}
      .gr-disc-logo.is-spinning,.gr-disc-ring.is-spinning{animation:none !important}
    }
    `

    return {
      inject: ['slots', 'locale', 'layout'],
      apply(ctx) {
        layoutService = (ctx && ctx.layout) || null
        const effect = (fn, label) => (typeof ctx.effect === 'function' ? ctx.effect(fn, label) : fn())

        /* 1) 样式 */
        effect(() => {
          const style = document.createElement('style')
          style.setAttribute('data-gr-style', '')
          style.textContent = CSS
          document.head.appendChild(style)
          return () => {
            try {
              style.remove()
            } catch {
              /* ignore */
            }
          }
        }, 'global-radio: styles')

        /* 2) 全局 <audio> + 与其它播放器的互斥仲裁 */
        effect(() => {
          getAudio()
          setupMediaArbitration()
          bindMediaSessionActions()
          return () => {
            teardownMediaArbitration()
            destroyHls()
            if (audioEl) {
              try {
                audioEl.pause()
              } catch {
                /* ignore */
              }
              try {
                audioEl.removeAttribute('src')
                audioEl.load()
              } catch {
                /* ignore */
              }
              try {
                audioEl.remove()
              } catch {
                /* ignore */
              }
              audioEl = null
            }
            analyserNode = null
            freqBytes = null
            timeBytes = null
            if (audioCtx) {
              try {
                audioCtx.close()
              } catch {
                /* ignore */
              }
              audioCtx = null
            }
            analyserFailed = false
          }
        }, 'global-radio: audio')

        /* 3) 文案 */
        effect(() => {
          const locale = ctx.locale
          const disposers = []
          if (locale && typeof locale.register === 'function') {
            try {
              const disposeZh = locale.register(NS, 'zh', ZH)
              if (typeof disposeZh === 'function') disposers.push(disposeZh)
            } catch {
              /* ignore */
            }
            try {
              const disposeEn = locale.register(NS, 'en', EN)
              if (typeof disposeEn === 'function') disposers.push(disposeEn)
            } catch {
              /* ignore */
            }
          }
          if (locale && typeof locale.bind === 'function') {
            try {
              const bound = locale.bind(NS)
              translate = (key, params) => {
                let text = null
                try {
                  text = bound(key)
                } catch {
                  text = null
                }
                if (!text || text === key) text = ZH[key] || key
                return interpolate(text, params)
              }
            } catch {
              /* ignore */
            }
          }
          if (locale && typeof locale.subscribe === 'function') {
            try {
              const off = locale.subscribe(() => bumpLocale())
              if (typeof off === 'function') disposers.push(off)
            } catch {
              /* ignore */
            }
          }
          bumpLocale()
          return () => {
            disposers.forEach((dispose) => {
              try {
                dispose()
              } catch {
                /* ignore */
              }
            })
          }
        }, 'global-radio: locale')

        /* 4) 三个 slot */
        effect(
          () => ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: NS }, Page)),
          'global-radio: page',
        )
        effect(
          () =>
            ctx.slots.inject('sidebar.panellist', () =>
              ctx.slots.register(
                {
                  name: 'sidebar.panellist',
                  id: NS,
                  order: 40,
                  label: () => translate('meta.title'),
                },
                PanelIcon,
              ),
            ),
          'global-radio: sidebar entry',
        )
        effect(
          () =>
            ctx.slots.inject('sidebar.footer.action', () =>
              ctx.slots.register(
                {
                  name: 'sidebar.footer.action',
                  id: 'radio-mini',
                  order: 20,
                },
                MiniPlayer,
              ),
            ),
          'global-radio: sidebar mini player',
        )

        /* 5) Agent 工具桥：轮询 Host 命令 + 上报播放状态 */
        effect(() => {
          let stopped = false
          let cursor = 0
          let pollTimer = null
          let stateTimer = null
          let postTimer = null
          let posting = false

          const postState = () => {
            if (stopped || posting) return
            posting = true
            const station = state.station
            apiPost('/player/state', {
              station: station
                ? {
                    id: station.id,
                    name: station.name,
                    frequency: station.frequency || '',
                    country: station.country || '',
                    countryCode: station.countryCode || '',
                    codec: station.codec || '',
                    bitrate: station.bitrate || 0,
                    hls: !!station.hls,
                  }
                : null,
              playing: !!state.playing,
              loading: !!state.loading,
              error: state.error || '',
              volume: state.volume,
              muted: state.muted,
            })
              .catch(() => {})
              .finally(() => {
                posting = false
              })
          }

          const schedulePost = () => {
            if (stopped || postTimer) return
            postTimer = setTimeout(() => {
              postTimer = null
              postState()
            }, 300)
          }
          const unsubscribe = subscribeStore(schedulePost)

          const handleCommand = async (command) => {
            if (stopped || !command) return
            if (command.type === 'play' && command.station) {
              const queue = Array.isArray(command.queue) && command.queue.length ? command.queue : undefined
              playStation(command.station, { force: true, queue })
              return
            }
            if (command.type !== 'control') return
            const action = String(command.action || '')
            if (action === 'pause') pauseRadio()
            else if (action === 'resume') resumeRadio()
            else if (action === 'toggle') togglePlay()
            else if (action === 'next') playNext()
            else if (action === 'prev') playPrev()
            else if (action === 'volume') setVolume(command.volume)
          }

          const poll = async () => {
            if (stopped) return
            try {
              const data = await apiGet('/player/commands', { cursor })
              if (data) {
                cursor = Number(data.cursor) || cursor
                const commands = Array.isArray(data.commands) ? data.commands : []
                for (const command of commands) await handleCommand(command)
                if (commands.length) postState()
              }
            } catch {
              /* ignore */
            }
            if (!stopped) pollTimer = setTimeout(poll, 1200)
          }

          poll()
          stateTimer = setInterval(postState, 3000)
          postState()

          return () => {
            stopped = true
            if (pollTimer) clearTimeout(pollTimer)
            if (stateTimer) clearInterval(stateTimer)
            if (postTimer) clearTimeout(postTimer)
            try {
              unsubscribe()
            } catch {
              /* ignore */
            }
          }
        }, 'global-radio: agent bridge')

        /* 6) 调试句柄（验收 / 排障用） */
        effect(() => {
          try {
            window.__GLOBAL_RADIO__ = {
              store: { getSnapshot, subscribe: subscribeStore },
              player: {
                playStation,
                pauseRadio,
                togglePlay,
                playNext,
                playPrev,
                getAudio: () => audioEl,
              },
              api: { get: apiGet },
              // 兼容直接调用
              getSnapshot,
              subscribe: subscribeStore,
              playStation,
              pauseRadio,
              togglePlay,
              playNext,
              playPrev,
              setView,
              loadHome,
              runSearch,
              apiGet,
              getAudio: () => audioEl,
            }
          } catch {
            /* ignore */
          }
          return () => {
            try {
              delete window.__GLOBAL_RADIO__
            } catch {
              /* ignore */
            }
          }
        }, 'global-radio: debug handle')
      },
    }
  },
})
