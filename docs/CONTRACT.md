# 全球电台（Global Radio）· 插件契约 v1

本文是 Host / Client / 数据 / 验收三方共用的唯一契约。改实现前先改这里，或至少同步这里。

## 0. 标识

| 项 | 值 |
| --- | --- |
| npm 包名 | `@local/global-radio` |
| Loader 行 id | `global-radio` |
| main 面板 key | `global-radio` |
| 侧栏图标 id | `global-radio`（order 40） |
| 侧栏迷你播放器 id | `radio-mini`（order 20） |
| Host 路由前缀 | `/global-radio/api` |
| 客户端 locale 命名空间 | `global-radio` |
| 客户端插件文件 | `client.js`（`window.__ModuleLoader__.load({ id: '@local/global-radio', factory(require) {...} })`） |
| 音频元素 | `<audio data-gr-audio>`，append 到 `document.body`，`display:none` |

显示名（插件管理页 / 侧栏 label）：`全球电台`（en: `Global Radio`）。

## 1. 目录

```
dsh-global-radio/
├── package.json
├── cordis.patch.yml
├── index.js                 # Host：路由、Radio Browser 代理、流代理、HLS 重写、图片缓存
├── client.js                # 浏览器：slots、页面、播放器、可视化、音频仲裁
├── locale/{zh,en}.json      # meta.title / meta.description（插件管理页）
├── assets/icon*.png         # 原始图标（64/128/256）
├── vendor/hls.light.min.js  # hls.js light 构建（m3u8 用，运行时由 /hls-runtime.js 提供）
├── data/seed-stations.json  # 精选/兜底电台（由 scout 产出，Host 读取）
├── data/SOURCES.md          # 数据源调研报告（scout）
├── docs/CONTRACT.md
└── README.md
```

## 2. Host HTTP API

所有 JSON 响应统一信封：

```jsonc
{ "ok": true, "data": { ... } }                       // 成功
{ "ok": false, "error": "人类可读中文错误", "code": "NETWORK" }  // 失败（HTTP 502/503/500）
```

`code` ∈ `NETWORK | NOT_FOUND | INTERNAL | TIMEOUT | PROXY`。

客户端 `apiGet(path)` 负责解包：`ok` 返回 `data`；否则抛 `Error(error)`（带 `code`）。

### 2.1 Station（归一化电台对象）

```jsonc
{
  "id": "961f2c9d-...",              // Radio Browser stationuuid；精选源用 "seed:xxx"
  "name": "北京音乐广播 FM97.4",
  "url": "http://.../stream.mp3",    // 原始流地址（直连或 m3u8 播放列表）
  "logo": "http://.../logo.png",     // 可空串；客户端一律经 /img?url= 代理
  "country": "China",                // 英文国名，可空串
  "countryCode": "CN",               // ISO 3166-1 alpha-2，可空串
  "city": "Beijing",                 // 可空串
  "tags": ["music", "pop"],          // 小写、去空、最多 6 个
  "codec": "MP3",                    // MP3/AAC/AAC+/OGG/UNKNOWN
  "bitrate": 128,                    // kbps，0 表示未知
  "frequency": "FM 97.4",            // 可 null；从台名/精选数据解析
  "homepage": "https://...",         // 可空串
  "hls": false,                      // true 时客户端走 hls.js
  "votes": 123,                      // 可 0
  "clicks": 456                      // 可 0
}
```

`frequency` 解析规则（Host 统一实现）：台名里匹配
`/\b(?:FM|AM|MW|LW)\s*[:\-]?\s*(\d{2,4}(?:\.\d{1,2})?)\s*(?:MHz|kHz)?/i`
或中文 `/(调频|中波)\s*(\d{2,4}(?:\.\d{1,2})?)/`；命中输出 `FM 97.4` 形式；否则 `null`。
精选数据可用 `frequency` 字段手工指定，优先于解析。

### 2.2 `GET /global-radio/api/status`

```jsonc
{ "service": "ok", "version": "1.0.0", "upstream": "ok" | "degraded", "seedCount": 32, "hlsRuntime": true }
```

`upstream` 表示最近一次 Radio Browser 调用是否成功；失败不阻塞启动（用 seed 数据兜底）。

### 2.3 `GET /global-radio/api/home`

一次拿齐首屏（Host 内 TTL 缓存 10 分钟；`?refresh=1` 清缓存）：

```jsonc
{
  "seed": [ Station... ],        // 精选：国内 + 国际混排，精选数据
  "china": [ Station... ],       // countryCode=CN 点击量排序，12~24 条
  "popular": [ Station... ],     // 全球 topclick，12~24 条
  "tags": [ { "id": "news" }, { "id": "music" }, ... ],   // 常用分类（host 固定候选 + 上游）
  "countries": [ { "code": "CN", "name": "China", "count": 123 }, ... ], // 常用国家，含 CN/US/GB/FR/DE/JP/KR/HK/TW/RU/IT/ES/AU/CA/BR/IN
  "updatedAt": 1730000000000,
  "source": "radio-browser" | "seed"
}
```

约束：即使 Radio Browser 完全不可用，也必须返回 `seed`（来自 `data/seed-stations.json`）且 HTTP 200，`source:"seed"`。

### 2.4 `GET /global-radio/api/search?q=&country=&tag=&offset=&limit=`

- `q` 台名关键字（可空）
- `country` 国家码，`""`/`ALL` 表示不限
- `tag` 分类关键字（可空）
- `offset` 默认 0；`limit` 默认 48，上限 100

```jsonc
{ "items": [ Station... ], "offset": 0, "limit": 48, "hasMore": true, "source": "radio-browser" }
```

行为：
- 有 `q` → Radio Browser `stations/search?name=`（排序 clickcount desc, hidebroken=true）
- 只有 `country` → `stations/search?countrycode=`（同上）
- 只有 `tag` → `stations/search?tag=`
- 全空 → `stations/search?order=clickcount&reverse=true`（热门）
- 上游失败且无 q/country/tag → 返回 seed 里的子集，`source:"seed"`；上游失败且有筛选条件 → 502 `{code:"NETWORK"}`

### 2.4b `GET /global-radio/api/check?url=<encoded>`

快速校验流地址（跟随重定向，读取首块字节后取消）：

```jsonc
{ "ok": true, "hls": false, "contentType": "audio/mpeg", "finalUrl": "http://...", "audioLike": true }
```

`hls=true` 表示内容实际是 m3u8（即使原 URL 不是）；`ok=false` 时带 `reason`。
用于客户端预检与 `/alternates` 的候选筛选。

### 2.4c `GET /global-radio/api/alternates?id=&name=&country=&url=`

按台名/国家在 Radio Browser 找同名候选流，过滤自身、做过 `/check` 健康检查后返回最多 3 个备用源：

```jsonc
{ "items": [ Station... ] }   // url 已换成 check 后的 finalUrl，hls 已校正
```

缓存 5 分钟。客户端在主源失败时调用（见 §4.3.8）。

### 2.5 `GET /global-radio/api/stream?url=<encoded>&id=<stationId>`

音频字节流代理（直连 mp3/aac 用）。要求：

- 仅允许 `http:`/`https:`；否则 400 `code:"PROXY"`。
- Host 端用服务端 fetch（Node 内建，跟随重定向），请求头：
  `User-Agent: Mozilla/5.0 ... DSH-GlobalRadio/1.0`、`Accept: */*`、`Accept-Encoding: identity`（**不要**带 `Icy-MetaData`，见下）。
- 响应：`200`，透传/推断 `Content-Type`（无则按扩展名，默认 `audio/mpeg`），
  `Cache-Control: no-store`、`Access-Control-Allow-Origin: *`、`Accept-Ranges: none`，然后持续 pipe，直到客户端断开。
- 客户端断开 / 上游错误时销毁上游请求；同一连接不得无限增长内存（流式，不 buffer 整个响应）。
- **禁止向上游发送 `Icy-MetaData: 1`**：Chrome 的 `<audio>` 无法解码夹带 ICY 元数据块的 MP3 流，会一直 `readyState=0` 不报错（实测所有直链电台都会「没声音」）。
- 若上游返回 3xx 且 Location 指向 `.m3u8`，Host 直接跟随并在 content-type 里返回实际流（fetch 自动跟随即可）。
- `id` 可选：若给出且是 Radio Browser uuid，后台发一次 `GET /json/url/<uuid>` 记录点击（不阻塞、失败忽略），每个 id 每小时最多一次。

### 2.6 `GET /global-radio/api/hls?url=<encoded>`

HLS 播放列表与分片代理（m3u8 用）。要求：

- 仅 http/https。
- 上游 `Content-Type` 含 `mpegurl` 或 URL 路径以 `.m3u8` 结尾 → 视为播放列表：
  - 读取文本 → 以「实际响应 URL」（跟随重定向后的最终 URL）为 base 解析相对地址；
  - 重写：每一行非 `#` 的 URI 行、以及 `#EXT-X-KEY:`/`#EXT-X-MAP:`/`#EXT-X-MEDIA:`/`#EXT-X-I-FRAME-STREAM-INF:` 等标签内的 `URI="..."`，都改成
    `/global-radio/api/hls?url=<encodeURIComponent(绝对URL)>`；
  - 输出 `Content-Type: application/vnd.apple.mpegurl`，`Cache-Control: no-store`。
- 其它（分片 .ts/.aac/.m4s 等）→ 直接 pipe 字节，`Content-Type` 透传或按扩展名（`.ts`→`video/mp2t`，`.aac`→`audio/aac`，`.m4s/.mp4`→`video/mp4`），`Cache-Control: no-store`。
- 所有响应加 `Access-Control-Allow-Origin: *`。
- 上游失败 → 502 `{code:"PROXY"}`（JSON 信封，客户端 hls.js 会报错，UI 显示播放失败）。

### 2.7 `GET /global-radio/api/img?url=<encoded>`

台标/封面代理：

- 仅 http/https。Host fetch（`User-Agent` 同 2.5，12s 超时，最大 4 MB）。
- `Content-Type` 透传（非图片则按 `image/jpeg` 兜底）；`Cache-Control: public, max-age=86400`。
- 内存 LRU 缓存（key=url，最多 200 项 / 32 MB，TTL 24h），命中直接返回。
- 失败返回 404 空响应（不返回 JSON，`<img onError>` 走占位图）。

### 2.8 `GET /global-radio/api/hls-runtime.js`

- 若 `vendor/hls.light.min.js` 存在：`Content-Type: application/javascript; charset=utf-8`、`Cache-Control: public, max-age=604800`、内容原样返回。
- 不存在：404。客户端此时对 hls 电台显示「当前构建缺少 HLS 运行时」，但仍尝试原生播放（Safari 可能成功）。

### 2.9 `GET /global-radio/api/icon?size=64|128|256`

返回 `assets/icon-<size>.png`（找不到回退 `icon-256.png`），`Content-Type: image/png`，长缓存。

## 3. 数据源

- 主源：**Radio Browser**（社区电台目录，无 key，JSON）。
  Host 侧使用服务器列表（启动时按顺序探测，成功即记住）：
  `https://de1.api.radio-browser.info`、`https://at1.api.radio-browser.info`、
  `https://nl1.api.radio-browser.info`、`https://all.api.radio-browser.info`。
  请求头必须带可识别 UA：`DSH-GlobalRadio/1.0 (+https://github.com/)`。
- 兜底：`data/seed-stations.json`（结构 = `{ "stations": [Station] }`），Host 启动即读入内存。
- 网络失败一律降级，不抛未捕获异常、不阻塞插件激活。

## 4. 浏览器端

### 4.1 slots 注册（`client.js` `apply(ctx)`）

```js
inject: ['slots', 'locale', 'layout']
ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'global-radio' }, Page))
ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
  name: 'sidebar.panellist', id: 'global-radio', order: 40,
  label: () => t('meta.title'),
}, PanelIcon))
ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
  name: 'sidebar.footer.action', id: 'radio-mini', order: 20,
}, MiniPlayer))
```

`apply` 内所有副作用（style、audio、listeners、MutationObserver、Web Audio）都要经 `ctx.effect` 注册并返回清理函数；factory 本身零副作用。

### 4.2 页面结构

`main` 面板根节点 `.gr-root[data-gr="root"]`，高度 100%，自己滚动，不固定、不悬浮；顶栏尊重
`var(--dsh-frame-top-clearance, 0px)`（与网易云插件一致）。

- `browse` 视图（默认，网易云风格发现页）：
  - `[data-gr="header"]`：品牌图标 + 「全球电台」+ 搜索框（`data-gr="search"`）+ 刷新 + 「正在播出」状态。
  - 发现页（上方内容，可滚动）：
    - `[data-gr="banners"]`：3 张精选大 banner（第一张跨两行），`[data-gr="banner"]` 展示台标、台名、频率、国家/tags；点击播放该台。
      右侧「换一批」按钮 `[data-gr="banner-shuffle"]` 从精选池随机换 3 个台（初始为精选前 3），不固定。
    - `[data-gr="genres"]`：12 个中等分类卡 `[data-gr="genre"][data-genre]`（新闻/世界之声/古典/爵士/电子/摇滚/谈话/华语/日本/韩国/英国/法国）。**点一下从该分类随机挑一台播放**并 toast 提示。
    - 自适应网格列表 `[data-gr="row"][data-row=popular|china|seed|recent|favorites]`（随窗口宽度 6/5/4/3/2 列换行，不横向裁切、不需要拖动），卡片 `[data-gr="station"]`（logo/台名/频率）。
  - **底部大播放条** `[data-gr="playerbar"]`（选中电台后常驻，占面板自己的布局行，不 fixed、不遮挡内容）：
    - 左侧台标 + 台名 + 频率/国家 + tags；中间 **上一台 / 播放暂停 / 下一台（居中对称）**；右侧 收藏 + 音量 + 展开播放页。
    - 控件 hook：`data-gr="toggle|prev|next|favorite|open-player|expand|volume"`。
    - 无当前电台时不渲染。
  - 搜索结果：搜索激活时用 `[data-gr="station"]` 网格替换发现页；空态 `[data-gr="empty"]`、错误态 `[data-gr="error"]`（带重试）。
- `player` 视图（「全屏播放」，点 banner 播放按钮/底部播放条台标进入）：
  - 全屏沉浸：根节点 `[data-gr="player-view"]`，模糊台标背景 + 深色渐变（跟随主题，但播放页允许深色）。
  - 大封面/圆形台标（可缓慢旋转，`prefers-reduced-motion` 时停）。
  - 台名 + **频率**（大字）+ 国家 · codec · bitrate + tags。
  - 可视化 `[data-gr="visualizer"]`：`<canvas>`，用 Web Audio `AnalyserNode` 绘制实时频谱；**必须**在音频同源（走 /stream 或 /hls 代理）时可用；分析器不可用时自动退化为 CSS/JS 伪动画，不报错。
  - 可视化模式切换 `[data-gr="visual-mode"]`：`频谱柱 bars` / `环形环 ring` / `波形 wave` 三选一，localStorage 记住。
  - 底部玻璃控制条：收藏、上一台/播放暂停/下一台（居中）、音量；右上角浏览器全屏按钮（`Element.requestFullscreen`，失败静默）。
  - Esc 退出播放页（回到 browse，不断播）。
- 迷你播放器（`sidebar.footer.action`）：
  - 宽侧栏：台标 + 台名 + 频率 + 上一台/播放暂停/下一台 + 音量（hover 弹层）；底部 2px 实时电平条。
  - 侧栏收起（`props.wide === false`）：只留 36px 圆形台标按钮（播放态有脉冲环），点击打开面板并进入播放页。
  - 只在「有当前电台」时渲染；`props.usePanelInfo` 可判断当前面板为 `global-radio` 时隐藏。
  - **与网易云迷你播放器上下堆叠**：两个插件都注册在 `sidebar.footer.action`。宿主该 slot 容器默认是横向 flex，本插件给宽迷你条加 `is-wide`，并使用
    `[class*="footerActions"]:has(.gr-mini.is-wide){flex-wrap:wrap}` + `flex:1 0 100%` 强制其独占一整行，排在网易云迷你条下方，**绝不左右并排**；即使被对方暂停，也保留自己的迷你条（只停止发声）。
    侧栏收起（`is-rail`）时同样 `flex-wrap:wrap` 垂直排列，避免两个圆形按钮横向挤在一起。迷你条控制键（上一台/播放/下一台）在宽度内居中对称，不额外放展开按钮（点台标/台名即可展开）。
  - 迷你播放器不得遮挡输入框、不得 fixed 悬浮。

### 4.3 音频互斥仲裁（硬性要求）

目标：**同一时刻只允许一个 app 出声**，且不修改网易云插件源码。

1. 本插件只拥有一个 `<audio data-gr-audio>`，append 到 body。
2. 监听策略：
   - `document` 上 `capture` 监听 `play` 事件（兜底）；
   - `MutationObserver` 监视 `document.body`（childList+subtree），对页面中每个 `audio,video` 元素（含之后插入的网易云 `<audio data-nm-audio>`）直接 `addEventListener('play', onOtherPlay)`；
   - 自家 audio `play` 时：遍历 `document.querySelectorAll('audio,video')`，对非自家元素若 `!paused` 则 `pause()`（网易云监听自身 `pause` 事件同步 UI，因此其 UI 会正确变暂停）。
   - 任何别家 media 的 `play` 事件 → 暂停自家 audio（自家 UI 由自家 `pause` 事件同步）。
3. 自己暂停别家时不得改别家的 `src`、`currentTime`、`volume`；只调 `pause()`。
4. 切台 / 换源：`audio.src = 代理 URL` → `load()` → `play()`；旧请求由浏览器取消。
5. 播放失败：显示 toast/错误态，`playing=false`；不得疯狂重试。
6. 迷你播放器规则：检测到「别家正在播」时本插件自动暂停，但迷你条**仍然保留**，与对方迷你条上下堆叠（见 §4.2）；同一时刻只有一条音频通道在发声，界面上可以同时看到两个「已暂停/播放中」的播放器入口。
7. `navigator.mediaSession`：设置 metadata（台名/国家/台标），`play`/`pause`/`previoustrack`/`nexttrack` action handler；冲突时以最近播放者为准（允许覆盖，不做抢回）。
8. **备用信号源与不可播过滤**：
   - 主源播放失败（audio `error`、HLS fatal、或 9s 内没有进入 `playing`）时，客户端请求 `GET /alternates`，最多取 3 个候选逐个换源重试，并 toast「已切换到备用源：xxx」。
   - 全部候选失败：把台加入内存 `unavailableIds`（本次会话不再展示），toast「xxx 暂时无法播放」，并从队列里自动跳过到下一台（一次，避免循环）。
   - 所有列表（banner/分类随机池/横滑列表/搜索结果）渲染前过滤 `unavailableIds`；失败台不再出现在「可点」列表里。
   - 预检接口 `GET /check` 可用于把重定向到 m3u8 的源纠正为 HLS。

### 4.4 客户端状态与持久化

- 内存 store（模块级单例 + `subscribe`/`getSnapshot`，React 用 `useSyncExternalStore` 或 `useState+useEffect`）：
  `{ status, station, playing, loading, error, volume, muted, favorites, recent, visualMode, unavailableIds, queue }`
- localStorage keys：`global-radio:favorites`（id 数组）、`global-radio:recent`（Station 快照数组，最多 12）、
  `global-radio:volume`（0..1）、`global-radio:muted`、`global-radio:visualMode`（bars|ring|wave）。
- 收藏/最近均以 Station 快照存，离线也能展示。
- 「下一台 / 上一台」基于进入播放页时所在列表顺序 + `recent` 兜底；单台也允许单曲循环式重连。

### 4.5 文案与主题

- 所有可见文案走 `ctx.locale`（`register('global-radio','zh'|'en',dict)` + `bind`），缺失回退中文常量。
- 容器/按钮颜色从 DSH 主题 token 派生（`--dsw-alias-*`），深/浅色都要可读；播放页可用自己的深色艺术层。
- 不使用 CDN 资源（离线可用）；hls.js 仅从本插件 `/hls-runtime.js` 加载。

## 5. 测试钩子

- `[data-gr="..."]` 属性见 4.2；另加：
  `data-gr="play"`、`data-gr="toggle"`、`data-gr="prev"`、`data-gr="next"`、`data-gr="volume"`、
  `data-gr="favorite"`、`data-gr="open-player"`、`data-gr="fullscreen"`、`data-gr="back"`、
  `data-gr="mini-player"`、`data-gr="mini-toggle"`、`data-gr="mini-prev"`、`data-gr="mini-next"`、
  `data-gr="nav"`、`data-gr="country"`、`data-gr="tag"`、`data-gr="toast"`、`data-gr="player-station"`、
  `data-gr="banners"`、`data-gr="banner"`、`data-gr="banner-shuffle"`、`data-gr="genres"`、`data-gr="genre"`（带 `data-genre`）、
  `data-gr="row"`（带 `data-row`）、`data-gr="playerbar"`、`data-gr="expand"`。
  （旧版 `data-gr="dock"` 已移除，底部控件统一为 `playerbar`。）
- 播放状态：根节点 `data-playing="true|false"`；迷你条同样带 `data-playing`。
- 调试句柄：`window.__GLOBAL_RADIO__ = { store, player, api }`（只读用途，测试与排障用）。
- 音频元素：`document.querySelector('audio[data-gr-audio]')`，`src` 必须指向 `/global-radio/api/stream` 或 `/global-radio/api/hls`（同源，Web Audio 可用）。

## 6. 验收矩阵（verifier 覆盖）

1. `client.js` 可被 `__ModuleLoader__` 加载；3 个 slot 注册 spec 正确（`main.key`、`sidebar.panellist.id/order/label`、`sidebar.footer.action.id/order`）。
2. 无当前电台时：不渲染迷你条、不渲染 playerbar；发现页渲染 3 张 banner + ≥8 个分类卡 + ≥3 个横滑列表，卡片字段（logo/台名/频率/国家）齐全。
3. 点 banner/横滑卡片 → 播放：`audio.src` 同源代理、`!paused`、`data-playing=true`、playerbar 更新、播放页可进入；点分类卡 → 触发 `/search` 并随机播放一台，toast 提示。
4. 播放页：可视化 canvas 存在且尺寸 >0、三种模式切换后 canvas 仍渲染、返回/Esc 不中断播放、全屏按钮存在。
5. 高级：搜索「BBC」出现结果；收藏切换持久化（刷新后仍在）；分类随机播放请求带 `tag`/`country` 参数。
6. 互斥：页面里再放一个 `<audio data-nm-audio>`（模拟网易云）→ 播放它 → 电台暂停，但迷你条保留并与之上下堆叠（不隐藏、不左右并排）；再点电台播放 → 模拟元素暂停。
7. HLS：mock `/hls` 返回改写后的 m3u8；hls 电台播放时无 console error（无 hls.js 时显示明确错误而非崩溃）。
8. 主题：深/浅色截图；1440/1024/600 三档无横向溢出；侧栏宽/窄两态迷你条截图。
9. 错误态：`/home` 500 → `[data-gr="error"]` + 重试可恢复；`/stream` 失败 → 自动请求 `/alternates`，无候选时 toast「暂时无法播放」并把台移出列表、不崩溃。
10. 真实联调（Lead/verifier 在真实 Harness 页面上）：侧栏出现图标，点开渲染；真实 Radio Browser 播放 10s 音频 `currentTime` 前进；切到对话后迷你条出现；开始播网易云时电台自动暂停。

## 7. 非目标

- 不做账号、不做节目单（EPG）、不做录音、不做歌词、不做下载。
- 不做移动端原生布局重构（Web 响应式即可）。
- 不修改网易云 / 佳明插件源码（音频互斥通过 4.3 的通用机制完成）。
