# 全球电台 · 数据源与精选电台验证报告

> 作者：station-scout ｜ 实测日期：2026-11-06（Asia/Shanghai）
> 环境：macOS 27.2 / curl 8.7.1 / Python 3.9.6 / Node v24.21.0（Harness 内置 runtime）
> 配套数据：`seed-stations.json`（49 条精选电台，全部在本机实测可播）

本报告 = Radio Browser 数据源可用性 + 种子电台逐条实测证据 + HLS 结构样本 + 已知故障源清单 + 给 Host 代理实现的建议。
契约依据：`docs/CONTRACT.md` §2.1（Station 形状）、§2.5/§2.6（流代理 / HLS 代理）、§3（数据源）。

---

## 1. Radio Browser 可用性

### 1.1 实测结论

| 主机 | DNS | 连通性 | 说明 |
| --- | --- | --- | --- |
| `https://de1.api.radio-browser.info` | ✅ | ✅ **首选** | 3 次采样 `total` 0.68 / 0.70 / 1.01 s |
| `https://de2.api.radio-browser.info` | ✅ | ✅ **备选** | 3 次采样 `total` 1.01 / 0.79 / 0.78 s |
| `https://all.api.radio-browser.info` | ✅ → 91.98.4.78 | ❌ `Connection reset by peer`（TLS 握手阶段） | 能解析但本机被重置，不能作为保底 |
| `https://at1.api.radio-browser.info` | ❌ NXDOMAIN | ❌ | `Could not resolve host` |
| `https://nl1.api.radio-browser.info` | ❌ NXDOMAIN | ❌ | `Could not resolve host` |

> 契约 §3 列了 de1/at1/nl1/all 四台。本机实测 **只有 de1、de2 可用**，at1/nl1 在当前网络下根本无法解析，all 被重置。
> 建议 Host 探测顺序改为：`de1 → de2 → all → at1 → nl1`，即先把两个实测可用主机放前面；每台探测用一个轻量端点（`/json/stats`，~250 B）而不是大查询。

延迟采样（`/json/stats`，`time_total`）：

```
de1: 0.705 / 0.684 / 1.012 s   （TLS 握手 0.43–0.50 s，之后 TTFB ≈ 0.25 s）
de2: 1.011 / 0.789 / 0.781 s   （TLS 握手 0.47–0.72 s）
```

### 1.2 服务端统计（`/json/stats`）

```json
{"supported_version":1,"software_version":"0.7.45","status":"OK",
 "stations":62590,"stations_broken":665,"tags":11995,
 "clicks_last_hour":12437,"clicks_last_day":239864,
 "languages":647,"countries":226}
```

- 总台数 **62,590**，`stations_broken=665`（约 1.1%），所以所有检索都带 `hidebroken=true`。
- 全球日点击 ≈ 24 万，点击量排序（`order=clickcount&reverse=true`）是稳定的质量信号。

### 1.3 已验证可用的端点与参数

所有请求必须带可识别 UA：`-H 'User-Agent: DSH-GlobalRadio/1.0 (+https://github.com/)'`
（实测：不带 UA 也能通，但社区实例会对匿名/默认 curl UA 限流甚至 403，务必带）。

| 用途 | 端点（均已实测 200） | 实测耗时 / 体积 |
| --- | --- | --- |
| 健康检查 | `GET /json/stats` | 0.7–1.0 s / ~250 B |
| 全球热门 | `GET /json/stations/topclick/24?hidebroken=true` | 1.03 s / 29 KB |
| 国家检索 | `GET /json/stations/search?countrycode=CN&order=clickcount&reverse=true&hidebroken=true&limit=24` | 1.01 s / 27 KB |
| 台名检索 | `GET /json/stations/search?name=BBC&order=clickcount&reverse=true&hidebroken=true&limit=24` | 1.08 s / 35 KB（搜索结果第 1 页即有 BBC World Service / BBC Radio 4 等） |
| 分类检索 | `GET /json/stations/search?tag=jazz&order=clickcount&reverse=true&hidebroken=true&limit=24` | 1.21 s / 31 KB |
| 单台详情 | `GET /json/stations/byuuid/835070cd-bf45-4e48-88a4-e9f9a0d7dd9e` | 1.06 s / 1.06 KB（返回**数组**，1 元素） |
| 记录点击 | `GET /json/url/<stationuuid>` | 0.93 s / 178 B，`{"ok":true,...}`；**不存在的 uuid 返回 404** |
| 国家列表 | `GET /json/countries` | 1.13 s / 13.4 KB，227 条，含 `stationcount` |
| 分类列表 | `GET /json/tags?order=stationcount&reverse=true&limit=40` | 0.83 s / 1.6 KB |
| 服务器列表 | `GET /json/servers` | 200 / 123 B |

要点：

- `limit` 上限 **200**；`offset` 配合分页。契约里 search 的 `limit` 默认 48 / 上限 100 是 Host 自己的约束，上游没问题。
- `order` 只支持有限字段（`clickcount` / `votes` / `name` / `country` / `language` / `bitrate` / `random` 等），`reverse=true` 降序。
- `hidebroken=true` 必加；不加会混入 `lastcheckok=0` 的死链（约 665 条）。
- **`/json/stations/byuuid/*` 返回数组**，不要按对象解析。
- `/json/url/<uuid>` 是"记录一次点击"的写接口，按契约 §2.5 每 id 每小时最多一次即可；404 说明 uuid 不存在（历史下架），忽略即可。
- 社区实例对突发并发敏感：建议 Host 侧串行 + 10 分钟 TTL 缓存（契约 §2.3 已经是这样），重试用指数退避（300 ms → 900 ms），单请求超时 6–8 s。

### 1.4 Radio Browser → Station 字段映射

| Station（契约 §2.1） | Radio Browser 字段 | 处理 |
| --- | --- | --- |
| `id` | `stationuuid` | 种子数据用 `seed:<slug>` |
| `name` | `name` | 去首尾空白；`trim=true` 参数可让上游预处理 |
| `url` | **`url_resolved`** | 用解析后的地址（已跟随 302、已指向真实 CDN）；`url` 常是 `.pls`/`.m3u`/旧域名，**不要直接用** |
| `logo` | `favicon` | 可能为空串；客户端一律走 `/img?url=` 代理 |
| `country` | `country` | 英文国名 |
| `countryCode` | `countrycode` | ISO 3166-1 alpha-2 |
| `city` | `city` / `state` | `city` 常为空 |
| `tags` | `tags`（逗号分隔串） | 转小写、trim、分割、去空、最多 6 |
| `codec` | `codec` | 上游值：`MP3`/`AAC`/`AAC+`/`OGG`/`UNKNOWN`（个别带 `+`/空） |
| `bitrate` | `bitrate` | kbps，0 = 未知 |
| `frequency` | —（无此字段） | Host 按 §2.1 正则从台名解析，或种子数据手工给 |
| `homepage` | `homepage` | 可空串 |
| `hls` | `hls`（0/1） | ⚠️ 不可靠，见 §4.2；以 URL 是否 `.m3u8` 为准 |
| `votes` / `clicks` | `votes` / `clickcount` | `clickcount` → `clicks` |

---

## 2. 各国家 / 分类存量（`/json/countries`、`/json/tags`）

目标国家/地区电台存量（2026-11-06）：

| 国家/地区 | 代码 | 台数 | 国家/地区 | 代码 | 台数 |
| --- | --- | ---: | --- | --- | ---: |
| 美国 | US | 7898 | 意大利 | IT | 1817 |
| 德国 | DE | 6353 | 巴西 | BR | 1632 |
| 法国 | FR | 3576 | 加拿大 | CA | 1567 |
| 俄罗斯 | RU | 3068 | 西班牙 | ES | 1460 |
| 英国 | GB | 2327 | 印度 | IN | 1057 |
| 中国 | CN | 2183 | 台湾地区 | TW | 192 |
| 澳大利亚 | AU | 1824 | 日本 | JP | 152 |
| 韩国 | KR | 104 | 香港 | HK | 89 |

> CN 2183 条里大量是 qtfm/qingting 转播与 CNR/CRI 的 m3u8；HK/TW/JP/KR 存量小但质量集中，按 `clickcount` 排序取前 30–80 条即可覆盖主流台。

热门分类（`stationcount`）：`pop 6238`、`music 5062`、`news 3236`、`rock 3165`、`talk 1887`、`hits 1692`、`dance 1621`、`classical 1458`、`oldies 1452`、`jazz 1295`、`electronic 1054`、`public radio 1046`、`80s 1249`、`top 40 1060`、`house 812`、`alternative 717`。
→ 契约 §2.3 的固定 tags 候选建议：`news / music / talk / jazz / classical / electronic / rock / pop / sports`，前 8 个与上游存量一致，`sports` 上游量小（可用 `sport` 补充）。

---

## 3. 精选数据 `seed-stations.json`

### 3.1 分布（49 条）

| 区域 | 条数 | 明细 |
| --- | ---: | --- |
| 中国大陆 | 9 | CNR-1 中国之声、CNR-2 经济之声、CNR-3 音乐之声、CRI 环球资讯、凤凰卫视资讯台、北京交通 FM103.9、北京音乐 FM97.4、上海动感101 FM101.7、上海经典音乐 FM94.7 |
| 香港 | 5 | 香港电台 1/2/3/4 台、新城知讯台 |
| 台湾地区 | 6 | 中广新闻网、中广流行网、飞碟电台、ICRT、台北电台、古典音乐台 FM97.7 |
| 国际 | 29（12 国） | US 4、FR 4、GB 3、DE 3、JP 2、KR 2、RU 2、IT 2、ES 2、AU 2、BR 2、CA 1 |

风格覆盖：news（CNR-1/2、CRI、BBC WS、RTL、DLF、NHK、YTN、Vesti FM、Rai 1、Cadena SER、CBC、RTHK1…）、talk（BBC R4、NPR、ICRT 等）、music/pop（CNR-3、动感101、Skyrock、triple j）、jazz（Adroit Jazz、FIP、Shonan Beach FM 78.9、ABC Jazz、Bossa Jazz）、classical（上海经典音乐、古典音乐台 FM97.7、Classic FM、Radio Classique、Rai 3、RTHK4）、electronic（Frisky Radio、MANGORADIO、Anon.FM）、rock（Rock Antenne、triple j）、traffic（北京交通 FM103.9）。
`hls=true` 18 条、直连 31 条；`frequency` 已确认 7 条（其余 `null`）；`logo` 有值 31 条（全部实测 `image/*`）、空串 18 条。

### 3.2 逐条实测证据

测试方法：`curl -L --max-time 10 -A '<桌面 Chrome UA>' --compressed <url>`，**不发送 Range**（模拟真实 `<audio>`/`fetch`）；直链要求 `audio/*` 且读到 >100 KB（10 s 数据量），HLS 要求 `#EXTM3U` + 至少一个分片 URI 返回 200 且 >1 KB。
另用 Node `fetch`（= Host 代理同款实现）以**流式读取**复测全部 49 条：**49/49 通过**，返回的 Content-Type 决定性可用：

```
application/vnd.apple.mpegurl ×13   application/x-mpegurl ×5   （HLS 合计 18，均含 mpegurl）
audio/mpeg ×23   audio/aac ×5   audio/mpeg; charset=utf-8 ×1   audio/aacp ×2   （直链合计 31）
```

| 代码 | 台名 | HLS | 实测证据 | logo |
| --- | --- | :---: | --- | :---: |
| CN | CNR-1 中国之声 | 否 | audio/mpeg · 141 KB/10 s | 空 |
| CN | CNR-2 经济之声 | 是 | 分片 200 `video/mp2t` 252 KB | 空 |
| CN | CNR-3 音乐之声 | 是 | 分片 200 `video/mp2t` 253 KB | ✓ |
| CN | CRI 环球资讯广播 | 是 | 分片 200 `video/mp2t` 109 KB | ✓ |
| CN | 凤凰卫视资讯台 | 是 | 分片 200 `video/mp2t` 56 KB | ✓ |
| CN | 北京交通广播 FM103.9 | 否 | audio/mpeg · 158 KB/10 s | ✓ |
| CN | 北京音乐广播 FM97.4 | 否 | audio/mpeg · 159 KB/10 s | ✓ |
| CN | 上海动感101 FM101.7 | 否 | audio/mpeg · 144 KB/10 s | ✓ |
| CN | 上海经典音乐广播 FM94.7 | 否 | audio/mpeg · 144 KB/10 s | ✓ |
| HK | 香港電台第一台 | 是 | 分片 200 `video/mp2t` 89 KB | 空 |
| HK | 香港電台第二台 | 是 | 分片 200 `video/mp2t` 88 KB | 空 |
| HK | 香港電台第三台 | 是 | 分片 200 `video/mp2t` 87 KB | 空 |
| HK | 香港電台第四台 | 是 | 分片 200 `video/mp2t` 86 KB | 空 |
| HK | 新城知訊台 | 是 | 分片 200 `video/mp2t` 66 KB | ✓ |
| TW | 中廣新聞網 | 否 | audio/aac · 312 KB/10 s | ✓ |
| TW | 中廣流行網 | 否 | audio/aac · 303 KB/10 s | ✓ |
| TW | 飛碟電台 | 否 | audio/aac · 266 KB/10 s | ✓ |
| TW | Radio ICRT | 否 | audio/aac · 270 KB/10 s | ✓ |
| TW | 臺北電台 | 是 | 分片 200 `audio/x-aac` 404 KB | ✓ |
| TW | 古典音樂台 FM 97.7 | 否 | audio/mpeg · 295 KB/10 s | 空 |
| US | CNN | 否 | audio/mpeg · 475 KB/10 s | ✓ |
| US | NPR | 否 | audio/mpeg · 171 KB/10 s | ✓ |
| US | Adroit Jazz Underground | 否 | audio/mpeg · 645 KB/10 s | ✓ |
| US | Frisky Radio | 否 | audio/mpeg · 634 KB/10 s | ✓ |
| GB | BBC World Service | 否 | audio/mpeg · 134 KB/10 s | ✓ |
| GB | BBC Radio 4 | 是 | 分片 200 `video/mp2t` 108 KB | ✓ |
| GB | Classic FM UK | 否 | audio/mpeg · 380 KB/10 s | ✓ |
| FR | RTL | 是 | 分片 200 `video/mp2t` 49 KB | 空 |
| FR | FIP | 否 | audio/aac · 292 KB/10 s | 空 |
| FR | Radio Classique | 否 | audio/mpeg · 264 KB/10 s | ✓ |
| FR | Skyrock | 否 | audio/mpeg · 268 KB/10 s | 空 |
| DE | Deutschlandfunk | 否 | audio/mpeg · 215 KB/10 s | ✓ |
| DE | MANGORADIO | 否 | audio/mpeg · 367 KB/10 s | ✓ |
| DE | Rock Antenne | 否 | audio/mpeg · 592 KB/10 s | ✓ |
| JP | NHK WORLD RADIO | 是 | 分片 200 `video/mp2t` 36 KB | 空 |
| JP | Shonan Beach FM 78.9 | 否 | audio/mpeg · 216 KB/10 s | 空 |
| KR | YTN 라디오 | 是 | 分片 200 `video/mp2t` 78 KB | 空 |
| KR | CBS 음악 FM | 是 | 分片 200 `video/mp2t` 160 KB | 空 |
| RU | Вести ФМ | 否 | audio/mpeg · 236 KB/10 s | 空 |
| RU | Anon.FM | 否 | audio/mpeg · 414 KB/10 s | ✓ |
| IT | Rai Radio 1 | 否 | audio/mpeg · 961 KB/10 s | ✓ |
| IT | Rai Radio 3 | 否 | audio/mpeg · 1.20 MB/10 s | ✓ |
| ES | Cadena SER | 否 | audio/mpeg · 32 KB/10 s | ✓ |
| ES | LOS 40 | 否 | audio/mpeg · 32 KB/10 s | ✓ |
| CA | CBC Radio 1 Toronto | 是 | 分片 200 `audio/aac` 60 KB | 空 |
| AU | ABC Jazz | 是 | 分片 200 `video/mp2t` 303 KB | 空 |
| AU | triple j | 是 | 分片 200 `video/mp2t` 308 KB | 空 |
| BR | Bossa Jazz Brasil | 否 | audio/aacp · 328 KB/10 s | ✓ |
| BR | Rádio Antena 1 94.7 FM | 否 | audio/aacp · 356 KB/10 s | ✓ |

> 注：Cadena SER / LOS 40 走 StreamTheWorld 跳转，10 s 只回 ~32 KB（约 32 kbps 的缓冲块），但 Content-Type 与字节流均正常，属该 CDN 的正常行为。

---

## 4. HLS 播放列表结构（CNR / CRI / ifeng / RTHK / 台北）

### 4.1 媒体播放列表（media playlist，相对分片 URI）

**CNR-2 经济之声** `http://ngcdn002.cnr.cn/live/jjzs/index.m3u8`（CNR-3 音乐之声同构）：

```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:16386137
#EXT-X-TARGETDURATION:10
#EXTINF:10.005,
16386137.ts
#EXTINF:10.005,
16386138.ts
...
```

- 分片 URI **相对**（`16386137.ts`），必须相对"最终响应 URL"解析 → `http://ngcdn002.cnr.cn/live/jjzs/16386137.ts`。
- 无 `#EXT-X-KEY`（**不加密，无 AES**）；分片 `video/mp2t`（纯音频 TS）；`TARGETDURATION=10`。

**CRI 环球资讯** `https://sk.cri.cn/905.m3u8` 与 **凤凰卫视资讯台** `http://playtv-live.ifeng.com/live/06OLEEWQKN4_audio.m3u8`：

```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-ALLOW-CACHE:NO
#EXT-X-MEDIA-SEQUENCE:1788508848
#EXT-X-TARGETDURATION:4
#EXTINF:3.008,
905-1788508848.ts?txspiseq=10947685604940778622
#EXTINF:3.008,
905-1788508849.ts?txspiseq=10947685604940778622
```

- 分片 URI 相对 **且带查询串**（`?txspiseq=...`，序列号校验），改写时必须**保留 query**（`encodeURIComponent` 整体包进 `url=` 参数，不能只拼路径）。
- 无 AES；`TARGETDURATION` 4 / 分片 3 s，`#EXT-X-ALLOW-CACHE:NO` 表示不要缓存。

### 4.2 Master 播放列表（多码率，需要二次解析）

**RTHK Radio 1** `https://rthkradio1-live.akamaized.net/hls/live/2035313/radio1/master.m3u8`（RTHK 2/3/4、台北電台、CBC、江蘇等同类）：

```
#EXTM3U
#EXT-X-VERSION:2
#EXT-X-STREAM-INF:BANDWIDTH=70400,CODECS="mp4a.40.2"
index_64_a.m3u8
```

- 这是 **master**，子清单 `index_64_a.m3u8` 是**相对 URI** → 必须解析成 `.../radio1/index_64_a.m3u8` 再改写。
- `hls.js` 拿到改写后的 master 会再请求一次 `/hls?url=<variant>`，所以 Host 的 `/hls` 必须能**同时**处理 master 和 media 两种播放列表（契约 §2.6 已按通用规则实现即可）。
- 台北電台 `https://stream.ginnet.cloud/live0130lo-yfyo/_definst_/fm/playlist.m3u8` 同样是 master → `chunklist_w...m3u8`；该 CDN 的分片是 `audio/x-aac`（Wonderware/Wowza 风格）。
- CBC `https://cbcradiolive.akamaized.net/hls/live/2041036/ES_R1ETR/master.m3u8` 为 master + 多档 variant（`adaptive_48/...`），分片 `audio/aac`。

### 4.3 结构小结（对 Host 的硬性约束）

| 特性 | 实测 |
| --- | --- |
| 相对 URI | **全部样本都出现**（CNR、CRI、ifeng、RTHK、台北、CBC）→ 必须相对最终响应 URL 解析 |
| 绝对 URI | 也有（如 `https://ngcdn001.cnr.cn/live/yyzs/12760.ts` 经 Host 解析后），改写逻辑要同时兼容 |
| AES 加密 | **49 条种子中 0 条带 `#EXT-X-KEY`**；但实现仍应透传 `#EXT-X-KEY:URI=` 改写（契约 §2.6 已要求），否则遇到加密源会静默失败 |
| 分片类型 | `video/mp2t`（绝大多数，纯音频 TS）、`audio/aac`（CBC）、`audio/x-aac`（Wowza/台北） |
| 分片时长 | 3 s（CRI/ifeng）、4 s（RTHK 变体）、10 s（CNR） |
| Content-Type | `application/vnd.apple.mpegurl`（多数）、`application/x-mpegurl`（RTHK/CBC/BRTV）→ 判定要用 `contains('mpegurl')`，不要只匹配一个值 |
| 无扩展名但实为 m3u8 | `sk.cri.cn/905.m3u8` 有扩展名；但 KR `radio.bsod.kr/stream/?stn=...`、`zstream.win/radio/...` 一类**没有 `.m3u8` 后缀**，需靠 Content-Type 判定（本次未选用这类不稳定源） |

---

## 5. 需要特殊 UA / Referer 的台

**49 条种子中没有任何一条需要 Referer 或 Cookie**，Host 用契约 §2.5 的 UA（`Mozilla/5.0 … DSH-GlobalRadio/1.0`）即可全部拉到字节。但有以下实测坑：

| 场景 | 现象 | 建议 |
| --- | --- | --- |
| Radio Browser API | 默认/空 UA 可能被限流；带 `DSH-GlobalRadio/1.0 (+https://github.com/)` 稳定 | 必须带可识别 UA |
| 部分 Icecast/Shoutcast | 某些实例对非浏览器 UA 返回 403（如 SomaFM 系列；本机另有 DNS 问题） | Host 用"浏览器前缀 + 产品标识"的 UA（契约已如此） |
| `icy` 元数据 | 多数源不强求 `Icy-MetaData`，但带上不影响；契约已带 `Icy-MetaData: 1` | 保持 |
| 忽略 Range 的源 | Icecast 类直播流普遍**忽略 `Range`**，带 `Range` 反而可能让个别源超时（实测 `icy.unitedradio.it/Virgin.mp3` 带 `Range` 100% 超时、不带则秒开） | Host `/stream` 设 `Accept-Ranges: none`（契约正确）；**不要**向上游转发 Range |
| gzip 播放列表 | `1603884249.rsc.cdn77.org`（新城知讯台）会返回 gzip 编码内容，不解压会读到二进制乱码 | 请求带 `Accept-Encoding: identity`（契约 §2.5 已要求）或解压后再嗅探 |
| 302 跳转 | StreamTheWorld（Cadena SER/LOS 40/89FM）、`direct.franceinfo.fr` → `icecast.radiofrance.fr`、`lhttp.qtfm.cn`、`icy.unitedradio.it` 都有 302 | 必须跟随重定向，并以**最终 URL 为 base** 解析 m3u8 |
| token 型 m3u8 | CNR-4 `satellitepull.cnr.cn/live/wxdszs/playlist.m3u8?wsSession=...`、KBS/SBS/MBC 的 `?Policy=` / `?token=` 均带会话/时效签名 | 种子数据**不要**收录这类（本次已剔除）；Host 也不能长期缓存 m3u8 |

---

## 6. 实测失败清单（已剔除/替换，不建议再用）

### 6.1 本机网络/DNS 层面不可达（重要：不是台挂了，是本机 DNS 被污染）

多台境外主机被解析到与业务无关的 CDN IP（且多次 `dig` 结果在变），TLS/HTTP 直接超时或 TLS 握手失败：

| 主机 | 解析结果（示例） | 影响 |
| --- | --- | --- |
| `icecast.radiofrance.fr` / `stream.radiofrance.fr` | `108.160.161.83` / `103.252.115.169` | **法国广播电台全家不可用**：France Info、France Inter、FIP（官方源）、France Musique、France Culture、FIP Jazz… |
| `liveradio.swr.de` | `157.240.21.9` | SWR3（德国）不可用 |
| `streams.radio.co` | `69.63.180.173` | Café del Mar（西班牙）不可用 |
| `ice2.somafm.com` | `173.239.76.149`（HTTP 403） | SomaFM 全系（Groove Salad / Secret Agent / Space Station…）不可用 |
| `stream.pbs.gov.tw` | **NXDOMAIN** | 台湾警广（全国治安交通网 FM104.9、台北分台 FM94.3）不可用 |
| `webstatic.rthk.hk` | `130.211.15.150` | RTHK 台标 SVG 拉不到（台本身 akamaized 正常） |
| `www.abc.net.au` | `199.59.150.43` | ABC 台标 32×32 PNG 拉不到（ABC 音频 akamaized 正常） |

对应处理：法国改用 **RTL（HLS）+ FIP 中继（`radio-metadata.fr:8000/fip`）+ Radio Classique + Skyrock**；德国改用 **DLF / MANGORADIO / Rock Antenne**；美国电子风格用 **Frisky Radio**；台湾交通台缺失（用北京交通 FM103.9 补 traffic 分类）。所有替代源均已实测通过。

### 6.2 台本身/第三方代理不可用

| 电台 | URL | 失败原因 |
| --- | --- | --- |
| 商業電台 雷霆881 / 叱咤903 | `881903.fishtv.dpdns.org/proxy/881` `/903` | 返回 Cloudflare 纯文本 `error code: 1033`（隧道离线） |
| CNR-4 经典音乐广播 | `satellitepull.cnr.cn/live/wxdszs/playlist.m3u8?wsSession=...` | 播放列表带 `wsSession` 会话签名，不可长期引用 |
| RTHK Radio 1 (MP3) | `http://stm1.rthk.hk/radio1` | 连接超时；同台 HLS 源正常，改用 HLS |
| 講台 Talkonly | `https://live.talkonly.net:8443/talkonly.mp3` | 连接超时 |
| Big B Radio - Kpop | `https://antares.dribbcast.com/proxy/kpop?mp=/s` | `Recv failure: Connection reset by peer` |
| 89 A Radio Rock (BR) | `playerservices.streamtheworld.com/api/livestream-redirect/RADIO_89FM_ADP.aac` | 时好时坏（StreamTheWorld 抖动），复测两次失败 → 已换成 Antena 1 |
| Virgin Radio Italy | `https://icy.unitedradio.it/Virgin.mp3` | 仅在带 `Range` 时超时（见 §5），不带 Range 正常；本次未收入种子 |
| 香港新城电台（旧 m3u8） | `.../index.m3u8`（未解 gzip 时） | 返回 gzip，需 `Accept-Encoding: identity`；修正后正常并已收入 |
| FIP / RTL 官方 hls 以外备选 | `www.101smoothjazz.com/101-smoothjazz.m3u`、`abc.net.au/...pls`、`KBS/MBC/SBS .pls` | 返回 `.m3u`/`.pls` 播放列表文件而非音频，`<audio>`/fetch 不能直接播 → 不要收录；改用 `jking.cdnstream1.com` 这类直链 |

> 契约 §2.5 里"若上游 3xx 且 Location 指向 `.m3u8` 则跟随"是一条必要的兜底；但**不要**把 `.pls`/`.m3u` 当音频流透传，客户端会拿到一小段文本当音频。

---

## 7. 给 Host 代理实现的建议

### 7.1 `/stream`（直链）

1. **超时**：连接 8 s、首字节 10 s；拿到响应头后进入长连接（不设总超时），客户端断开即 `req.destroy()` 销毁上游。
2. **重定向**：`redirect: 'follow'`（Node fetch 默认），但最多 5 跳；最终 URL 仅用于日志，不必回给客户端。
3. **Content-Type 判定**：上游缺失或 `application/octet-stream` 时按扩展名推断（`.mp3`→`audio/mpeg`、`.aac`→`audio/aac`、`.m3u8`→`application/vnd.apple.mpegurl`）；**若上游 Content-Type 含 `mpegurl` 或 `text/html` 但 body 以 `#EXTM3U` 开头 → 交给 `/hls` 处理**（有些 CDN 返回错误的 text/plain）。
4. **透传策略**：只回 `200` + `Content-Type` + `Cache-Control: no-store` + `ACAO: *` + `Accept-Ranges: none`，**不要**转发 `Content-Length`（长度未知/无限）、不要缓冲整个 body（用 `Readable.fromWeb(res.body).pipe(res)`）。
5. **客户端断开**：`res.on('close', () => ac.abort())`，务必中止上游，否则 49 个台切换会泄漏连接。
6. **错误**：上游非 2xx / 连接失败 → 502 `{ok:false,code:"PROXY"|"NETWORK"}`（契约 §2 信封），不要 hang。
7. **点击计数**：`/json/url/<uuid>` 只在 `id` 是 RB uuid 时发一次，每 id 每小时 ≤1 次，失败忽略；**不要 await**（契约 §2.5）。

### 7.2 `/hls`（播放列表与分片）

1. **区分 playlist / segment**：`Content-Type` 含 `mpegurl` **或** 最终 URL 路径以 `.m3u8` 结尾 → 按播放列表处理；否则按字节流 pipe（`.ts`→`video/mp2t`、`.aac`→`audio/aac`、`.m4s/.mp4`→`video/mp4`）。
2. **base URL 必须是"跟随重定向后的最终 URL"**（`res.url`），否则相对分片会 404——本次 CNR/CRI/ifeng/RTHK 全部踩这个点。
3. **改写范围**：非 `#` 的 URI 行 + `#EXT-X-KEY` / `#EXT-X-MAP` / `#EXT-X-MEDIA` / `#EXT-X-I-FRAME-STREAM-INF` 里的 `URI="..."`；保留 `?query`；输出 `application/vnd.apple.mpegurl` + `Cache-Control: no-store` + `ACAO: *`。
4. **master 播放列表**：改写后客户端会二次请求 `/hls?url=<variant>`，实现只要对两种播放列表统一处理即可，**不要**试图自己展开 master。
5. **分片**：透传 Content-Type（很多是 `video/mp2t` 或 `audio/aac`），`Cache-Control: no-store`，不缓存内存；分片通常 30–400 KB。
6. **超时**：播放列表 8 s；分片 10 s；上游失败 502 `{code:"PROXY"}`（hls.js 会触发 `MANIFEST_PARSED` 前的错误，客户端显示播放失败即可）。
7. **不要缓存 m3u8**（`#EXT-X-MEDIA-SEQUENCE` 一直在变）；CNR/CRI 的 m3u8 每次 200-400 B，代价极低。
8. **gzip**：请求上游播放列表时用 `Accept-Encoding: identity`，避免 §5 的 gzip 乱码。

### 7.3 `/img`（台标）

- 31 条有 logo，实测 `image/png`、`image/jpeg`、`image/webp`、`image/x-icon` 都有 → 契约 §2.7 的"非图片则按 image/jpeg 兜底"要保留，`image/svg+xml` 也要放行（部分台标是 svg）。
- 18 条 logo 为空串 → 客户端必须自带首字母渐变占位（契约 §4.2 已要求）。
- 部分台标域名在本机不可达（§6.1），`/img` 必须 404 空响应而不是挂住，`<img onError>` 兜底。

### 7.4 数据源降级

- de1/de2 都失败时：`/home` 返回 `source:"seed"` + 49 条 seed；`/search` 无筛选条件返回 seed 子集，有筛选条件才 502（契约 §2.4）。
- 上游 5xx/超时重试 1 次（指数退避 300 ms），仍失败立即降级，**不要**在请求路径里连续探活 5 台主机（会把 TTFB 拖到数秒）。
- 探测结果缓存 10 分钟（与 `/home` TTL 对齐），避免每请求都 `stats`。

---

## 8. 复现命令

```bash
UA='DSH-GlobalRadio/1.0 (+https://github.com/)'
B='https://de1.api.radio-browser.info'

# 1) 健康检查（0.7–1.0 s）
curl -s -H "User-Agent: $UA" --max-time 10 "$B/json/stats"

# 2) 热门 / 国家 / 分类 / 检索
curl -s -H "User-Agent: $UA" "$B/json/stations/topclick/24?hidebroken=true"
curl -s -H "User-Agent: $UA" "$B/json/stations/search?countrycode=CN&order=clickcount&reverse=true&hidebroken=true&limit=24"
curl -s -H "User-Agent: $UA" "$B/json/stations/search?name=BBC&order=clickcount&reverse=true&hidebroken=true&limit=24"
curl -s -H "User-Agent: $UA" "$B/json/tags?order=stationcount&reverse=true&limit=40"
curl -s -H "User-Agent: $UA" "$B/json/countries"

# 3) 单条流实测（不发送 Range！）
curl -sS -L --max-time 10 --compressed \
     -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36' \
     -o /dev/null -w 'code=%{http_code} ct=%{content_type} bytes=%{size_download}\n' \
     'https://lhttp.qtfm.cn/live/15318317/64k.mp3'

# 4) HLS：取播放列表 + 抽一个分片
curl -sS -L --max-time 10 -A 'Mozilla/5.0 Chrome/126' 'https://sk.cri.cn/905.m3u8' | head -12

# 5) 用 Node（= Host 代理同款 fetch）复测种子
node -e 'const s=require("./data/seed-stations.json").stations;(async()=>{let ok=0;for(const x of s){try{const r=await fetch(x.url,{headers:{"User-Agent":"Mozilla/5.0 DSH-GlobalRadio/1.0"},signal:AbortSignal.timeout(12000)});const rd=r.body.getReader();const{value}=await rd.read();rd.cancel();ok+=value?1:0;}catch(e){console.log(\"BAD\",x.id,e.message)}}console.log(ok+\"/\"+s.length)})()'
```

---

## 9. 结论速览

- **数据源**：Radio Browser 可用，但本机只有 **de1/de2** 两台能通（at1/nl1 DNS 不解析、all 被 reset）；62,590 台 / 226 国 / 11,995 分类；端点与参数见 §1.3，UA 必须可识别。
- **种子数据**：49 条 / 15 个国家与地区（国内 20：CN 9 + HK 5 + TW 6；国际 29 覆盖 12 国），18 条 HLS、31 条直链，全部 **curl + Node fetch 双向实测通过**，31 条台标实测 `image/*`。
- **最大风险**：本机 DNS 对多个境外 CDN 有污染（法国广播电台全系、SWR、SomaFM、Café del Mar、台湾警广等），换机器/换网络时这些源可能反而可用，但**种子已全部避开**；Host 侧必须做好「上游失败 → 降级到 seed」。
- **HLS 关键点**：相对 URI + master/variant 二次解析 + 保留 query + 以最终响应 URL 为 base；49 条种子无 AES，但重写逻辑仍应支持 `#EXT-X-KEY`。
