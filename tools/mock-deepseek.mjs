// 本地模拟 DeepSeek 流式接口（仅用于联调测试）
// node tools/mock-deepseek.mjs  → http://127.0.0.1:3999 ；收到的最后一次请求写入 $TEMP/mock-last-request.json
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

http.createServer((req, res) => {
  let body = "";
  req.on("data", c => body += c);
  req.on("end", async () => {
    fs.writeFileSync(path.join(os.tmpdir(), "mock-last-request.json"), body);
    const j = JSON.parse(body || "{}");
    if (req.headers.authorization !== "Bearer sk-mock") { res.writeHead(401, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ error: { message: "Authentication Fails (mock)" } })); }
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    const last = j.messages.at(-1).content;
    const reasoning = j.model === "deepseek-reasoner" ? ["先看牌阵整体元素分布，", "再逐位分析。"] : [];
    const text = j.messages.length > 2
      ? ["## 追问回应\n\n", "关于「", last.slice(0, 20), "」：牌面提示你先稳住节奏。"]
      : ["## 整体结论\n\n", "这组牌显示**转变正在发生**。\n\n", "### 逐位解读\n\n", "- 第一张：根基稳固\n", "- 第二张：需要耐心\n\n", "> 寄语：慢慢来，比较快。"];
    for (const r of reasoning) { res.write(`data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: r } }] })}\n\n`); await new Promise(r => setTimeout(r, 60)); }
    for (const t of text) { res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`); await new Promise(r => setTimeout(r, 80)); }
    res.end("data: [DONE]\n\n");
  });
}).listen(3999, "127.0.0.1", () => console.log("mock deepseek on :3999"));
