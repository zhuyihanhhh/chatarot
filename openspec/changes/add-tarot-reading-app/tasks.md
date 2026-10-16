## 1. 本地服务

- [x] 1.1 新建 `server.js`：用内置 `http` 做静态托管（MIME 表、路径穿越 403、只监听 127.0.0.1、默认端口 3090）
- [x] 1.2 解析 `.env`（`DEEPSEEK_API_KEY`/`DEEPSEEK_MODEL`/`PORT`），新增 `.env.example`，把 `.env` 加入 `.gitignore`
- [x] 1.3 `GET /api/status`：返回 `{ hasKey, model }`，不包含 Key
- [x] 1.4 `POST /api/chat`：流式代理 DeepSeek，原样透传 SSE；上游出错时透传状态码和 `{error}`；客户端断开即中止上游
- [x] 1.5 `POST /api/bake/:stem`：校验 stem 格式与对应资产，写入 `assets/baked/<stem>/`
- [x] 1.6 验证：curl 测试静态文件、路径穿越、status 和 chat 流式（有 Key 时）

## 2. Rig 抽取与引擎多实例化

- [x] 2.1 写 `tools/extract-rigs.mjs`：把 78 个 `cards/*.html` 的内联脚本抽到 `engine/rigs/<stem>.js`（改写为 `Live2DCard.register`），并改写 HTML 引用
- [x] 2.2 引擎新增 `register`/`rigs` 注册表；把拆层管线重构为纯函数 `extractLayers(img, rig)`
- [x] 2.3 实现 `mount(container, opts)`：实例内部自建 canvas、fx、glare，状态（弹簧/指针/时间）按实例隔离
- [x] 2.4 全局共用一个 rAF 调度器，提供 `pause`/`resume`/`destroy`（释放 WebGL）与 `webglcontextlost` 重建
- [x] 2.5 逆位：实现 `reversed` / `setReversed`，指针与倾斜方向取反
- [x] 2.6 `run(cfg)` 改成调用 `mount` 的兼容封装，保留 `?debug/?layer/?amp/?t` 参数
- [x] 2.7 回归：`tools/check-all.ps1` 跑 78/78 OK；抽 T-00、T-19、C-0A、P-10 截图，与重构前对比

## 3. 离线烘焙

- [x] 3.1 `tools/bake.html`：逐张加载 rig 和 jpg，运行 `extractLayers`，导出 plate 与各图层 WebP 和 `meta.json`（含 rig hash），POST 到服务
- [x] 3.2 引擎在 baked 资产存在且 hash 一致时直接加载，否则回退到运行时拆层
- [x] 3.3 烘焙全部 78 张；抽样对比 baked 与运行时渲染截图，确认无可见差异；记录单张就绪耗时

## 4. 牌义与牌阵数据

- [x] 4.1 `data/deck.json`：22 张大阿卡纳（中英文名、元素、星象、正/逆位关键词与释义）
- [x] 4.2 `data/deck.json`：56 张小阿卡纳（权杖、圣杯、宝剑、星币）
- [x] 4.3 校验脚本：78 个 stem 唯一、都有对应 jpg、正逆位各至少 3 个关键词
- [x] 4.4 `data/spreads.json`：单张、三张（过去/现在/未来）、圣三角、凯尔特十字（第 2 位 rot 90），含位置含义与坐标

## 5. 占卜流程前端

- [x] 5.1 `app/index.html` + `style.css` + `main.js`：页面骨架与状态机（选牌阵→提问→洗牌→切牌→选牌→翻牌→解读），神秘学风格的视觉
- [x] 5.2 `draw.js`：加密随机的 Fisher–Yates 洗牌与正逆位，「关闭逆位」设置
- [x] 5.3 洗牌动画 + 切牌（三叠选一）
- [x] 5.4 78 张牌扇形展开，点选 n 张，按牌位落位；牌背用 CSS 绘制
- [x] 5.5 逐张翻牌和「全部翻开」：翻开时 `mount` Live2D 实例，按需加载 rig 脚本
- [x] 5.6 牌面详情浮层：牌名、正逆位、牌位含义、关键词
- [x] 5.7 性能验证：凯尔特十字 10 张全部翻开后 ≥ 45 fps、≤ 3 s 就绪

## 6. 占卜师人设

- [x] 6.1 `app/persona.js`：人设数据模型、默认值、字段校验与修正
- [x] 6.2 固定专业底线文本；为各枚举维度写好专业描述文本；实现 `compilePersona`
- [x] 6.3 `data/personas.json`：5 个内置模板（温柔疗愈师、犀利直言者、金色黎明神秘学者、荣格心理分析师、实用人生教练）
- [x] 6.4 人设管理 UI：模板/自定义列表、选择、复制为自定义、编辑表单（各维度 + extra 计数限 800 字）、删除（若删的是当前人设则回退）
- [x] 6.5 localStorage 持久化，JSON 导入导出（非法字段回退默认值并给出提示）
- [x] 6.6 「预览提示词」：只读展示完整 system prompt

## 7. AI 解读

- [x] 7.1 `app/reading.js`：构造 system/user 消息，user 消息注入 `deck.json` 牌义和牌位信息
- [x] 7.2 SSE 流式解析与增量渲染（轻量 Markdown），「停止」按钮（AbortController）
- [x] 7.3 `deepseek-reasoner` 的思考过程折叠展示；在 UI 中切换模型
- [x] 7.4 追问：沿用上下文续写
- [x] 7.5 错误处理：无 Key 时给出引导（仍可抽牌）、API/网络错误时可重试
- [ ] 7.6 用两三个人设实际跑三张和凯尔特十字，检查专业度、底线约束、人设差异是否明显

## 8. 占卜记录与收尾

- [x] 8.1 `app/history.js`：保存占卜记录（上限 200 条）、列表、删除
- [x] 8.2 回看：用相同的牌和正逆位重新排出牌阵并 mount，展示对话，允许继续追问
- [x] 8.3 `index.html` 加「开始占卜」入口；写 README 段落（启动方式、`.env` 配置）
- [x] 8.4 端到端走查：启动服务 → 选人设 → 四种牌阵各占一次 → 追问 → 回看记录

## 9. 扩充牌阵与翻牌顺序

- [x] 9.1 参考 taluo.net 补齐 16 种牌阵（加圣三角共 17 种），每种含牌位、坐标、readingOrder、guide
- [x] 9.2 首页按分类筛选牌阵；年度牌阵的牌位标签显示具体月份
- [x] 9.3 翻牌顺序：金框提示「建议下一张」，「全部翻开」按 readingOrder 翻；记录亲手翻牌顺序
- [x] 9.4 提示词加入建议解读顺序、解读要点、翻牌记录，并说明「翻牌顺序不改变牌义」的规则
- [x] 9.5 17 种牌阵的布局遮挡检查全部通过；E2E 24/24 通过
