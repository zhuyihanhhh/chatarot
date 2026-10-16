const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

function loadEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    let v = m[2];
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnv();

const PORT = Number(process.env.PORT) || 3090;
const HOST = "127.0.0.1";
const MODELS_FILE = path.resolve(ROOT, process.env.MODELS_FILE || "models.json");

// 模型配置：models.json（每次请求重新读取，改完无需重启）；不存在时按 .env 的 DEEPSEEK_API_KEY 兜底
function loadModels() {
  let cfg, error = null;
  if (fs.existsSync(MODELS_FILE)) {
    try { cfg = JSON.parse(fs.readFileSync(MODELS_FILE, "utf8").replace(/^\uFEFF/, "")); }
    catch (e) { error = "models.json 解析失败：" + e.message; }
  }
  if (!cfg) cfg = {
    providers: [{ id: "deepseek", name: "DeepSeek", baseUrl: "https://api.deepseek.com", apiKeyEnv: "DEEPSEEK_API_KEY",
      models: [{ id: "deepseek-flash" }] }],
  };
  const list = [];
  for (const p of Array.isArray(cfg.providers) ? cfg.providers : []) {
    if (!p || !p.id || p.enabled === false) continue;
    const key = (p.apiKeyEnv && process.env[p.apiKeyEnv]) || p.apiKey || "";
    const baseUrl = String(p.baseUrl || "").replace(/\/+$/, "");
    for (const m of Array.isArray(p.models) ? p.models : []) {
      if (!m || !m.id || m.enabled === false) continue;
      list.push({
        key: `${p.id}/${m.id}`, provider: p.id, providerName: p.name || p.id, id: m.id, name: m.name || m.id,
        note: m.note || "", reasoning: !!m.reasoning, hasKey: !!key || p.noKey === true,
        _url: baseUrl + (p.path || "/chat/completions"), _key: key, _headers: p.headers || {}, _params: { ...(p.params || {}), ...(m.params || {}) },
      });
    }
  }
  const def = list.find(m => m.key === cfg.default) || list.find(m => m.hasKey) || list[0] || null;
  return { list, default: def && def.key, error };
}
const publicModel = ({ _url, _key, _headers, _params, ...m }) => m;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
};

function sendJson(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

function readBody(req, limit = 64 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(new Error("body too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function serveStatic(req, res, pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return sendJson(res, 400, { error: "bad path" }); }
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.resolve(ROOT, "." + rel);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return sendJson(res, 403, { error: "forbidden" });
  if (path.basename(file).startsWith(".env") || file === MODELS_FILE || file === path.join(ROOT, "models.json")) return sendJson(res, 403, { error: "forbidden" });
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return sendJson(res, 404, { error: "not found" });
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": st.size,
      "Cache-Control": "no-cache",
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

async function handleChat(req, res) {
  let body;
  try { body = JSON.parse((await readBody(req, 4 * 1024 * 1024)).toString("utf8")); }
  catch { return sendJson(res, 400, { error: "请求体不是合法 JSON" }); }
  if (!Array.isArray(body.messages) || !body.messages.length) return sendJson(res, 400, { error: "messages 不能为空" });

  const models = loadModels();
  if (models.error) return sendJson(res, 400, { error: models.error });
  const m = models.list.find(x => x.key === body.model) || models.list.find(x => x.key === models.default);
  if (!m) return sendJson(res, 400, { error: "没有可用模型，请检查 models.json" });
  if (!m.hasKey) return sendJson(res, 400, { error: `「${m.providerName}」未配置 API Key，请在 .env 中设置后刷新页面` });

  const ac = new AbortController();
  res.on("close", () => { if (!res.writableFinished) ac.abort(); });

  let up;
  try {
    up = await fetch(m._url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(m._key ? { Authorization: `Bearer ${m._key}` } : {}), ...m._headers },
      body: JSON.stringify({ ...m._params, model: m.id, messages: body.messages, stream: true }),
      signal: ac.signal,
    });
  } catch (e) {
    if (ac.signal.aborted) return;
    return sendJson(res, 502, { error: `无法连接 ${m.providerName}：${e.message}` });
  }

  if (!up.ok) {
    const text = await up.text().catch(() => "");
    let msg = text;
    try { const j = JSON.parse(text); msg = j.error?.message || j.message || j.error || text; } catch {}
    return sendJson(res, up.status, { error: `${m.providerName} ${up.status}: ${String(msg || up.statusText).slice(0, 500)}` });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  try {
    for await (const chunk of up.body) res.write(chunk);
  } catch (e) {
    if (!ac.signal.aborted) res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
  }
  res.end();
}

const STEM_RE = /^RWSa-[A-Z]-[0-9A-Z]{2}$/;
const BAKE_FILE_RE = /^[a-z0-9_-]{1,40}\.(webp|png|json)$/i;

async function handleBake(req, res, stem) {
  if (!STEM_RE.test(stem) || !fs.existsSync(path.join(ROOT, "assets", "cards", stem + ".jpg")))
    return sendJson(res, 400, { error: "invalid stem" });
  let body;
  try { body = JSON.parse((await readBody(req)).toString("utf8")); }
  catch { return sendJson(res, 400, { error: "bad json" }); }
  const files = body && body.files;
  if (!files || typeof files !== "object") return sendJson(res, 400, { error: "files required" });
  for (const name of Object.keys(files)) if (!BAKE_FILE_RE.test(name)) return sendJson(res, 400, { error: "bad file name " + name });
  const dir = path.join(ROOT, "assets", "baked", stem);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  let bytes = 0;
  for (const [name, data] of Object.entries(files)) {
    const buf = name.endsWith(".json")
      ? Buffer.from(typeof data === "string" ? data : JSON.stringify(data), "utf8")
      : Buffer.from(String(data).replace(/^data:[^,]*,/, ""), "base64");
    fs.writeFileSync(path.join(dir, name), buf);
    bytes += buf.length;
  }
  sendJson(res, 200, { ok: true, stem, files: Object.keys(files).length, bytes });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}`);
  const p = url.pathname;
  try {
    if (p === "/api/status" && req.method === "GET") {
      const m = loadModels();
      return sendJson(res, 200, { hasKey: m.list.some(x => x.hasKey), models: m.list.map(publicModel), default: m.default, error: m.error, configFile: fs.existsSync(MODELS_FILE) ? path.basename(MODELS_FILE) : null });
    }
    if (p === "/api/chat" && req.method === "POST") return await handleChat(req, res);
    const bake = p.match(/^\/api\/bake\/([^/]+)$/);
    if (bake && req.method === "POST") return await handleBake(req, res, bake[1]);
    if (p.startsWith("/api/")) return sendJson(res, 404, { error: "unknown api" });
    if (req.method !== "GET" && req.method !== "HEAD") return sendJson(res, 405, { error: "method not allowed" });
    if (p === "/") { res.writeHead(302, { Location: "/app/" }); return res.end(); }
    serveStatic(req, res, p);
  } catch (e) {
    if (!res.headersSent) sendJson(res, 500, { error: e.message });
    else res.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`塔罗占卜已启动: http://${HOST}:${PORT}/app/`);
  console.log(`单牌图鉴:       http://${HOST}:${PORT}/index.html`);
  const m = loadModels();
  if (m.error) console.log("警告: " + m.error);
  const usable = m.list.filter(x => x.hasKey);
  console.log(usable.length ? `可用模型 ${usable.length} 个，默认: ${m.default}` : "提示: 没有已配置 API Key 的模型（见 models.json / .env），可抽牌但无法 AI 解读");
});
