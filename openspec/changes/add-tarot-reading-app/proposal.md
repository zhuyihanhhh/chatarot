## Why

78 张 Live2D 韦特塔罗（Pam-A 1909）已全部完成，但目前只是一页一张的展示。用户想在本地自用一个完整的 AI 占卜应用：选牌阵 → 洗牌 → 抽牌（正/逆位）→ Live2D 翻牌 → AI 占卜师解读，并能按自己的偏好定制占卜师人设。经可行性分析，放弃以 deepseek-harness 为基底（agent harness 过重、UI 不匹配、developer preview 频繁破坏性变更），改为自建轻量本地应用直连 DeepSeek API。

## What Changes

- 新增本地 Node 小服务（零/极少依赖）：静态托管 + DeepSeek API 流式代理，API Key 存 `.env`，仅监听 127.0.0.1。
- 改造 Live2D 引擎：从「一页一张、全局单例」改为可多实例挂载 `mount(el, stem, {reversed})`，支持同屏 10 张（凯尔特十字），支持逆位显示。
- 新增图层离线烘焙：把运行时的图层拆分/inpaint 结果预先导出为图片 + 元数据，应用运行时只做形变，降低多张同屏的加载耗时。
- 抽取 78 张牌的 rig 配置为可复用模块（现内联在 `cards/RWSa-*.html`）；原单牌页保持可用。
- 新增占卜流程 UI：牌阵选择（单张、三张、圣三角、凯尔特十字）、提问、洗牌/切牌动画、抽牌、逐张翻牌。
- 新增 78 张牌的牌义数据（中文，正位/逆位关键词与释义、元素、数字、星象对应）。
- 新增 AI 解读：基于问题 + 牌阵位置 + 牌 + 正逆位构造提示词，流式输出解读，支持追问。
- 新增占卜师人设系统：在固定专业底线之上，可自定义流派与解牌体系、语气与风格、关注点与输出结构、自由人设补充；内置多套模板，可新建/复制/编辑/删除/导入导出，存本地。
- 新增本地占卜记录（问题、牌面、解读）保存与回看。

## Capabilities

### New Capabilities
- `local-server`: 本地 Node 服务——静态托管、DeepSeek 流式代理、Key 配置、仅本机监听。
- `card-renderer`: Live2D 引擎多实例化、逆位、离线烘焙资产加载、同屏多牌性能。
- `tarot-deck`: 78 张牌的元数据与中文牌义（正/逆位）、编号与资源映射。
- `spread-draw`: 牌阵定义、洗牌/切牌/抽牌（安全随机，正逆位）、翻牌流程与布局。
- `ai-reading`: 提示词构造、流式解读、追问会话、错误处理、占卜记录。
- `reader-persona`: 占卜师人设维度、专业底线、内置模板、自定义与本地持久化、导入导出。

### Modified Capabilities
（无，`openspec/specs/` 目前为空）

## Impact

- 新增：`server.js`、`.env.example`、`app/`（占卜应用前端）、`data/`（牌义、牌阵、人设模板）、`tools/bake-layers.*`、`assets/baked/`。
- 修改：`engine/live2d-card.js`（多实例 API，保留 `run()` 兼容单牌页）、`cards/RWSa-*.html`（配置抽到 `engine/rigs/<stem>.js` 后引用）。
- 依赖：Node.js ≥ 18（内置 `fetch`），不引入框架；需要用户自备 DeepSeek API Key。
- 资源：`assets/cards/*.png`（232 MB）应用中不再需要，可删。
- 非目标：公网部署、多用户、账号体系、移动端适配优化、dsh 插件化。
