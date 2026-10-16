## Context

- 现状：`engine/live2d-card.js` 提供 `Live2DCard.run(cfg)`，一页一张牌；依赖全局 `window.CARD_IMG`（base64，为绕过 `file://` 纹理限制）和固定 DOM id（`#gl`/`#fx`/`#card`/`#hint`/`#glare`）。图层拆分、push-pull inpaint 在加载时同步执行，单张耗时数百 ms～数秒。
- 78 张牌的 rig 配置内联在 `cards/RWSa-*.html` 的 `<script>` 中，部分含辅助函数（如 Fool 的 `rebuildRays`）。
- 资源：`assets/cards/<stem>.{png,jpg,js}`，1086×1810。
- 使用场景：单用户、本机浏览器，用户自备 DeepSeek API Key。
- 约束：不引入前端框架与构建步骤；Node ≥ 18；Windows 环境。

## Goals / Non-Goals

**Goals:**
- `node server.js` 一条命令启动，浏览器打开即可完整占卜。
- 凯尔特十字 10 张 Live2D 牌同屏流畅（目标 ≥ 45 fps，全部牌就绪 ≤ 3 s）。
- AI 解读专业、扎根于牌义数据，可通过人设自定义风格而不突破专业底线。
- 原 78 个单牌页与 `index.html` 继续可用（含 `file://` 打开）。

**Non-Goals:**
- 公网部署、多用户、鉴权、移动端专门适配。
- dsh 插件化、语音、多语言 UI。
- 自定义牌阵编辑器（首版只内置 4 种）。

## Decisions

### D1 本地服务：Node 内置 `http`，零依赖
- 路由：`GET /*` 静态文件（仓库根目录，MIME + 路径穿越防护）；`GET /api/status`（是否配置 Key、当前模型）；`POST /api/chat`（转发至 `https://api.deepseek.com/chat/completions`，`stream:true`，SSE 原样透传，客户端断开时中止上游）；`POST /api/bake/:stem`（烘焙工具专用，写入 `assets/baked/`）。
- `.env` 手动解析：`DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`（默认 `deepseek-chat`）、`PORT`（默认 3090）。仅监听 `127.0.0.1`。
- 备选：Express/Vite —— 多依赖无必要；浏览器直连 API —— Key 暴露且跨域不确定。

### D2 引擎多实例化：`Live2DCard.mount(container, opts) → instance`
- `opts = { stem, rig, imgUrl | baked, reversed, interactive, onReady }`；内部自建 canvas/glare，不依赖全局 id 与 `CARD_IMG`。
- 实例方法：`setReversed(b)`、`pause()`/`resume()`、`destroy()`（`WEBGL_lose_context` 释放）。
- `run(cfg)` 保留为薄封装，单牌页行为不变。
- 每张牌独立 WebGL context（凯尔特十字 10 个 < 约 16 上限）；未翻开/不可见的牌不挂载或暂停。全局单一 rAF 驱动所有实例。
- 备选：单画布共用 context + scissor —— 性能更好，但与每张牌的 CSS 3D 倾斜/翻牌冲突；实测不达标时再切换。

### D3 逆位
- 容器 `transform: rotate(180deg)`；引擎对指针坐标与倾斜方向取反，使“看向鼠标”和光泽在逆位下仍自然。

### D4 Rig 配置抽取：`engine/rigs/<stem>.js`
- `tools/extract-rigs.mjs`：读取每个 `cards/*.html` 内联脚本，把 `Live2DCard.run(` 改写为 `Live2DCard.register("<stem>", `，整段写入 rig 文件（保留辅助函数）。
- 单牌页改为引用 rig 文件后 `Live2DCard.run(Live2DCard.rigs["<stem>"])`。应用按需动态加载 rig 脚本。

### D5 离线烘焙
- 拆层管线抽成纯函数 `extractLayers(img, rig) → { plate, layers[] }`。
- `tools/bake.html`（经本地服务打开）逐张执行，导出 plate 与图层为 WebP（alpha，q≈0.92）+ `meta.json`（图层名、bbox、rig hash），`POST /api/bake/:stem` 落盘 `assets/baked/<stem>/`。
- 运行时：baked 存在且 hash 一致则直接加载；否则回退运行时拆层。骨骼权重仍运行时计算（开销小）。
- 备选：Node `canvas` 包烘焙 —— 原生依赖、与浏览器合成结果有差异，否决。

### D6 牌义与牌阵数据（静态 JSON）
- `data/deck.json`：78 条 `{ stem, nameZh, nameEn, arcana, suit, rank, element, astrology, upright:{keywords[], meaning}, reversed:{keywords[], meaning} }`，以 Waite《The Pictorial Key to the Tarot》（公有领域）传统牌义为基础编写中文。
- `data/spreads.json`：`{ id, name, description, positions:[{ key, name, meaning, x, y, rot }] }`；凯尔特十字第 2 位 `rot: 90`。

### D7 洗牌与抽牌
- `crypto.getRandomValues` + Fisher–Yates 生成顺序；每张独立 50% 逆位（设置可关闭逆位）。
- 仪式流程：洗牌动画（纯视觉）→ 切牌（三叠选一，按切点旋转数组）→ 78 张背面扇形展开，用户依次点选 n 张 → 按牌位落位 → 逐张翻牌（翻开时 mount）。
- 抽牌结果只由加密随机 + 用户操作决定，绝不由 LLM 生成。

### D8 提示词结构
- `system` = 专业底线（固定）+ 人设编译文本 + 输出结构指令 + 末尾重申“人设不得违反专业底线”。
- `user` = 结构化上下文：问题、牌阵、每个位置（位置名/含义、牌名、正逆位、对应朝向关键词与牌义）、日期。牌义注入自 `deck.json`。
- 追问沿用同一 messages 续写；模型默认 `deepseek-chat`，可切换 `deepseek-reasoner`（推理内容折叠显示）。

### D9 人设模型
- `persona = { id, name, icon, builtin, school, reversalMethod, tone, directness(1-5), length, address, focus[], output:{ summaryFirst, perPosition, cardRelations, actionAdvice, timing, correspondences }, extra(≤800 字) }`。
- `compilePersona(persona) → string`：枚举值映射到预写的专业化描述文本。
- 内置模板（只读，可复制为自定义）：温柔疗愈师、犀利直言者、金色黎明神秘学者、荣格心理分析师、实用人生教练。
- 存储 `localStorage`（`tarot.personas`、`tarot.activePersona`），支持 JSON 导入/导出。

### D10 前端结构
- `app/index.html` + 原生 ES modules：`main.js`（状态机：选牌阵→提问→洗牌→切牌→选牌→翻牌→解读）、`draw.js`、`reading.js`（SSE 解析 + 轻量 Markdown 渲染）、`persona.js`、`history.js`、`style.css`。
- 占卜记录存 `localStorage`（`tarot.history`，上限 200 条，淘汰最旧）。

## Risks / Trade-offs

- [多 WebGL context 掉帧/丢失] → 未翻开不挂载；监听 `webglcontextlost` 自动重建；不达标切换共用 context 方案。
- [烘焙与运行时结果不一致] → 共用 `extractLayers`；rig hash 校验后回退。
- [引擎重构破坏单牌页] → `run()` 兼容层 + `tools/check-all.ps1` 全量回归 + 抽样截图。
- [LLM 幻觉或越过底线] → 注入牌义；底线前后双置；自由文本限长且仅作补充。
- [API 失败/费用] → 错误提示 + 重试 + 中断按钮（AbortController）。
- [牌义内容质量] → 基于 Waite 原典，人工抽查。

## Migration Plan

1. 抽 rig + 引擎重构 → 回归单牌页；2. 烘焙；3. 应用。每步独立可回退（git）。`assets/cards/*.png` 由用户决定是否删除。

## Open Questions

- 默认启用逆位（设置可关）。
- 牌背暂用 CSS 绘制图案。
