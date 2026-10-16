# 塔罗之间 · Live2D AI 占卜

Rider–Waite–Smith（Pam-A 1909 扫描）78 张 Live2D 风格动态塔罗 + AI 占卜师（可接入多家大模型）。仅供本机自用。

## 启动

1. 安装 Node.js ≥ 18。
2. 复制 `.env.example` 为 `.env`，填入要使用的厂商 API Key，例如 `DEEPSEEK_API_KEY=sk-...`（不填也能抽牌，只是没有 AI 解读）。
3. 双击 `start.bat`，会自动启动服务并打开浏览器；也可以在项目根目录手动运行 `node server.js`，再打开 <http://127.0.0.1:3090/app/>。

服务只监听 `127.0.0.1`。API Key 只保存在 `.env`，不会发送到浏览器。

## 模型配置（`models.json`）

所有模型都通过 **OpenAI 兼容的 `/chat/completions` 流式接口**调用。DeepSeek、通义千问、Kimi、智谱、OpenAI、OpenRouter、Ollama 等都支持这种接口。

```json
{
  "default": "deepseek/deepseek-flash",
  "providers": [
    {
      "id": "deepseek", "name": "DeepSeek",
      "baseUrl": "https://api.deepseek.com",
      "apiKeyEnv": "DEEPSEEK_API_KEY",
      "models": [ { "id": "deepseek-flash", "name": "DeepSeek Flash" } ]
    }
  ]
}
```

| 字段 | 说明 |
|---|---|
| `default` | 默认模型，格式为 `厂商id/模型id` |
| `providers[].baseUrl` | 接口地址（不含 `/chat/completions`），可用 `path` 改写路径 |
| `providers[].apiKeyEnv` | Key 所在的 `.env` 变量名（推荐）；也可以直接写 `apiKey`，但不推荐 |
| `providers[].noKey` | 本地模型（如 Ollama）无需 Key 时设为 `true` |
| `providers[].headers` / `params` | 附加请求头，以及请求体参数（如 `temperature`） |
| `models[].id` / `name` / `note` | 传给厂商的模型名、界面显示名、备注 |
| `models[].params` | 只作用于该模型的请求体参数 |
| `enabled: false` | 隐藏某个厂商或某个模型 |

- 启用其他厂商：先把对应条目的 `enabled` 改为 `true`，并按厂商文档核对模型名；再在 `.env` 中填写 Key。
- 在「设置」里按厂商分组切换模型。没有配置 Key 的模型显示为不可选。
- 修改 `models.json` 后，在设置里点「刷新」即可生效；修改 `.env` 需要重启服务。
- 推理模型的思考过程（`reasoning_content` 或 `reasoning` 字段）会折叠显示。

## 功能

- 牌阵：17 种，参考 taluo.net，分为日常速查、综合运势、感情关系、决策事业、时间周期、灵性成长六类；每种都内置牌位含义、解读顺序和解读要点。
- 翻牌顺序：
  - 牌位由抽牌顺序决定，翻牌顺序不改变牌义。
  - 界面用金框提示建议的下一张，「全部翻开」按牌阵的解读顺序依次翻开。
  - 你亲手翻牌的顺序会传给 AI，作为你最先关注哪张牌的参考。
- 仪式：洗牌（可反复）→ 切牌（三叠选一）→ 从 78 张牌扇中凭直觉选牌 → 逐张/全部翻开。
- 随机：`crypto.getRandomValues` + Fisher–Yates，每张独立 50% 逆位（设置里可关闭）。抽牌结果不经过 AI。
- 解读：AI 流式输出，可以停止生成、追问；模型在设置中按厂商切换（见上方「模型配置」）。
- 占卜师人设：
  - 专业底线固定不可改。
  - 可自定义流派、逆位解读法、语气、直接程度、篇幅、称呼、关注点、输出结构，以及人设补充（≤800 字）。
  - 内置 5 个模板，可复制、编辑、导入、导出（JSON）。
  - 「预览提示词」可查看完整的 system prompt。
- 占卜记录：本地保存最近 200 条，可回看、继续追问。
- 牌面图鉴：<http://127.0.0.1:3090/index.html>。单牌页也可直接双击 `cards/*.html` 打开。

## 目录

| 路径 | 说明 |
|---|---|
| `server.js` | 本地服务：静态托管 + `/api/status` + `/api/chat`（流式代理）+ `/api/bake/:stem` |
| `app/` | 占卜应用（原生 ES modules，无构建） |
| `engine/live2d-card.js` | Live2D 引擎：`mount()` 多实例 / `run()` 单牌页 |
| `engine/rigs/<stem>.js` | 每张牌的图层、骨骼与弹簧配置 |
| `assets/cards/` | 原始扫描（jpg / 单牌页用的 base64 js） |
| `assets/baked/` | 离线烘焙的图层（WebP + meta.json） |
| `data/` | 牌义 `deck.json`、牌阵 `spreads.json`、人设模板 `personas.json` |
| `tools/` | 烘焙、校验与自检脚本 |

## 维护

- 修改了某张牌的 rig（图层多边形、色键等）之后，重新烘焙：服务运行时打开 <http://127.0.0.1:3090/tools/bake.html>，点「烘焙全部」，未过期的会自动跳过；也可以运行 `powershell -File tools/bake-all.ps1`。烘焙过期时引擎会自动回退为运行时拆层，所以不会出错，只是加载变慢。
- 修改了 `data/deck/*.json` 之后，运行 `node tools/build-deck.mjs`，重新合并并校验 `deck.json`。
- 自检：
  - `powershell -File tools/check-all.ps1`：78 个单牌页全部可加载。
  - `node tools/cdp-eval.mjs "http://127.0.0.1:3090/app/#demo=celtic" "document.getElementById('demoResult')?.textContent" 60000 --gpu`：凯尔特十字的就绪耗时与帧率。
  - 端到端测试：先运行 `node tools/mock-deepseek.mjs`，再以 `DEEPSEEK_API_KEY=sk-mock MODELS_FILE=tools/models.mock.json PORT=3091` 启动服务，然后在页面中注入并执行 `tools/e2e-app.js`。

## 版权

1909 年 Pam-A 牌面本身已进入公有领域。扫描图来自 steve-p.org/cards，仅供个人使用。若要公开发布，请先联系站长征得许可。
