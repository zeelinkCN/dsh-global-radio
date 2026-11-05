# selftest —— 全球电台 client 离线验收

只验证仓库根目录的 `client.js`（不启动真实 Harness host / Radio Browser / hls.js）。
**真实 Chrome headless + 真实 React 18 UMD + 真实 client.js**，后端全部走本地 mock（`server.mjs`），
断言全部基于契约 `docs/CONTRACT.md` 的 `data-gr` 测试钩子与真实 DOM。

覆盖 `docs/CONTRACT.md` §6 的离线部分（以最新契约 v2「发现页 + 底部大播放条 + 备用源」为准）：

| §6 | 覆盖 |
| --- | --- |
| 6.1 模块 / slot spec | `__ModuleLoader__.load`、main / sidebar.panellist / sidebar.footer.action 的 id/order/label、调试句柄 `{store,player,api}` |
| 6.2 发现页 | 3 张 banner、12 个分类卡、≥3 个自适应网格列表（popular/china/seed/recent/favorites，随窗口 6/5/4/3/2 列换行）、卡片字段（logo/台名/频率/国家）、banner「换一批」 |
| 6.3 播放 | 点 banner/横滑卡片 → `audio.src` 同源、`!paused`、`data-playing=true`、playerbar 更新、播放页可进入；点分类卡 → `/search?tag=` / `?country=` + 随机播放 + toast |
| 6.4 播放页 | 可视化 canvas 存在且实际绘制、三种模式切换 + localStorage、返回/Esc 不中断、全屏按钮 |
| 6.5 高级 | 搜索 BBC（请求参数 + 结果区）、分类随机播放请求带 `tag`/`country`、收藏/最近刷新后持久化 |
| 6.6 互斥 | 模拟网易云 `<audio data-nm-audio>` 播放 → 电台暂停 + 迷你条保留，与网易云迷你条在真实 `footerActions` 槽内**上下堆叠（宽/rail 两态）**；再播电台 → 模拟元素暂停 |
| 6.7 HLS | mock m3u8 改写校验、HLS 电台播放（假运行时）无 console error、缺运行时显示明确错误 |
| 6.8 主题/响应式 | 深/浅色截图、1440/1024/600 无横向溢出、侧栏宽/窄两态迷你条 + 堆叠截图 |
| 6.9 错误态/备用源 | `/home` 500 → error + 重试恢复；主源 502 → 请求 `/alternates`：有候选自动换源播放 + toast「已切换到备用源」；无候选 → toast「暂时无法播放」+ 台从列表移除 + 自动跳下一台 + `/alternates` 不重复请求 |
| 6.10 真实联调 | **不在本脚本范围**：需 Lead 在真实 Harness 页面目视复核 |

## 运行

```bash
cd dsh-global-radio/selftest      # 本仓库的 selftest 目录
node run.mjs
echo $?   # 0 全绿 / 1 有 FAIL / 2 client.js 未交付 / 3 找不到 Chrome / 4 看门狗超时
```

要求 Node 24+ 与 Google Chrome。Chrome 会自动在 macOS / Windows / Linux 的常见路径查找，也可用：
`CHROME_PATH="/path/to/chrome" node run.mjs`。

- 无 npm 依赖：Node 24 自带 `WebSocket` / `fetch`；React 18 production UMD 已离线放在 `assets/`。
- 每次运行清空 `shots/*.png`，结果与 console error 原文落盘 `last-run.log`；Chrome profile 在 `tmp/chrome-profile`，结束清理。
- CDP 开启 `Network.setCacheDisabled`，保证 mock 404/502 不被 HTTP 缓存掩盖。
- 只写本目录；不写 `~/.dsh`、不改插件源码。

### 基础设施自测（client.js 未交付 / 想验证 harness 本身）

```bash
GR_CLIENT="$PWD/fixtures/smoke-client.js" "$NODE" run.mjs
```

`fixtures/smoke-client.js` 是刻意只实现部分契约的 smoke client，用来验证 server / 假 ctx / CDP / 截图 / 断言链路本身；
它跑出一批 FAIL 是预期结果，不代表插件质量（新 UI 下该 fixture 已过时，仅作链路自测）。

## mock 数据

确定性数据（不依赖网络，任何一次运行结果一致）：

- `/global-radio/api/home`：优先读仓库真实 `data/seed-stations.json`（seed 前 12 / CN 前 12 / clicks 前 12），
  文件不存在时回退内置确定性数据；8 个 tags、16 个 countries。断言锚点：`seed:bj-music-fm974`（北京音乐广播 FM 97.4）、`seed:cnr2-jingjizhisheng`（HLS）。
- `/global-radio/api/search`：真实 seed + 合成 BBC 条目过滤；`q=BBC`、`tag=jazz`、`country=CN` 均有稳定结果。
- `/global-radio/api/stream`：75s / 22050Hz / mono WAV，支持 `Range` → `206`；`fallbackMode` 打开时非 backup 源返回 502。
- `/global-radio/api/hls`：m3u8 改写（非注释行 + `#EXT-X-KEY`/`#EXT-X-MAP` 的 URI）、分片按扩展名返回。
- `/global-radio/api/hls-runtime.js`：最小假 `Hls` 类（attachMedia/loadSource/on/destroy），loadSource 把 audio.src 指向 `/stream` mock 并触发 MANIFEST_PARSED/LEVEL_LOADED。
- `/global-radio/api/alternates`：`fallbackMode:'has-alt'` 返回 1 个 backup 源；`'empty'` 返回空列表（§4.3.8）。
- `/global-radio/api/check`：返回 `{ok,hls,contentType,finalUrl,audioLike}`；含 broken/fail 的 URL 返回 `ok:false`。
- `/global-radio/api/img`：本地 SVG 台标占位；`/icon`：优先真实 `assets/icon-{size}.png`，回退 128 / 生成 PNG。
- 控制面：`POST /__config`（`errorMode` / `hlsMissing` / `slowMs` / `imgFail` / `fallbackMode` / `upstream` / `source`）、
  `GET /__calls`、`POST /__clearcalls`、`POST /__reset`、`GET /__health`。

## harness.html 的假框架

- `__ModuleLoader__` stub：`factory(require)` 只提供 `react` / `react-dom`。
- 假 `ctx`：`slots.inject/register`（捕获 3 个 slot 的 spec 与组件）、`locale.register/bind/subscribe`、`layout.selectPanel`、`effect`。
- 假三栏布局：侧栏 280/56 两态；`sidebar.footer.action` **按真实宿主结构** mock 成横向 flex 容器 `.footerActions`，
  里面先放「网易云迷你条」占位（宽 78px / rail 36px 圆形），再放本插件 slot 内容，用于验证 `:has(.gr-mini.is-wide/is-rail)` 的 wrap + 上下堆叠。
- 面板切换会卸载/重挂 main 组件（真实 Harness 行为），保证客户端 `pageMounted` 正确、迷你条会出现。
- 主区内 64px 假输入框；DSH 主题 token 深/浅两套快照；`usePanelInfo` 注入。
- 只读取值助手（`__grState/__grAudio/__grStations/__grCanvasStats/__grModeControls/...`）全部基于契约钩子。

## 截图（`shots/`）

| 文件 | 内容 |
| --- | --- |
| `00-home-dark.png` `01-home-light.png` | 发现页（banner/分类/横滑列表）深/浅色 |
| `02-banner-playing.png` | 点 banner 播放（playerbar 出现） |
| `03-genre-playing.png` | 点分类卡随机播放 + toast |
| `04-player.png` `04b-player-ring.png` `04c-player-wave.png` | 播放页 + 三种可视化模式 |
| `05-playerbar.png` | 底部 playerbar 2x 放大 |
| `07-search-bbc.png` `09-favorites-reload.png` | 搜索 / 刷新后收藏+最近 |
| `10-1440-wide.png` `11-1024-narrow.png` `12-600-narrow.png` | 三档宽度（无横向溢出） |
| `13-hls-player.png` `14-hls-missing.png` | HLS 播放页 / 缺运行时错误条 |
| `15-error-home.png` `16-error-recovered.png` | `/home` 错误态与重试 |
| `20-mini-sidebar-wide.png` | 280px 宽侧栏迷你条 |
| `24-mini-rail-zoom.png` `29-mini-stacked-rail.png` | 56px rail 迷你条 / 与网易云按钮上下堆叠 |
| `26-mini-stacked.png` | 宽侧栏：本插件迷你条与网易云迷你条上下堆叠 |
| `27-sidebar-icon-dark.png` `28-sidebar-icon-light.png` | 侧栏品牌图标 6x 放大 |
| `30-banner-shuffled.png` | 「换一批」后的 banner |
| `31-fallback-source.png` | 主源失败自动切备用源播放 |
| `32-unavailable-filtered.png` | 备用源为空：toast + 台从列表移除 |
| `99-fatal.png` | 脚本 FATAL 时现场 |

## 已知局限

- 音频是 75s 正弦波 WAV，不验证真实音质/编码；HLS 用假 `Hls` 类（契约允许 mock 验证）。
- 分类卡/「换一批」带随机性；断言只校验「有变化 / 请求参数正确」，不锁定具体电台。
- 备用源走 `fallbackMode` 控制面而非真实上游探测；`/check` 只做形状级 mock（客户端目前未调用）。
- `sidebar.footer.action` 的宿主结构（`.footerActions` 横向 flex + `:has()` wrap）是按真实 Host 约定 mock 的；真实 Harness 若有差异需真机复核。
- 主题 token 是离线快照；DSH 主题版本变化时需同步 `harness.html`。
- §6.10 真实联调（真实 Radio Browser、真实网易云互斥）不在本脚本范围。
