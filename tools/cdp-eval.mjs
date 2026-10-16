// Real-time headless check via CDP: node tools/cdp-eval.mjs <url> <jsExpr> [waitMs] [--gpu]
// Starts headless Edge with remote debugging, loads url, polls jsExpr until truthy (or timeout), prints result.
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const [url, expr, waitArg] = process.argv.slice(2);
const waitMs = Number(waitArg) || 60000;
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const port = 9300 + Math.floor(Math.random() * 500);
const udd = fs.mkdtempSync(path.join(os.tmpdir(), "edge-cdp-"));
const flags = ["--headless=new", `--user-data-dir=${udd}`, `--remote-debugging-port=${port}`, "--window-size=1600,1000"];
if (!process.argv.includes("--gpu")) flags.push("--use-angle=swiftshader", "--enable-unsafe-swiftshader");
const edge = spawn(EDGE, [...flags, "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let ws, id = 0;
const pending = new Map(), logs = [];
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

try {
  let target;
  for (let k = 0; k < 50 && !target; k++) {
    await sleep(200);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === "page"); } catch {}
  }
  if (!target) throw new Error("no CDP target");
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") logs.push("EXC " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) logs.push(m.params.type + " " + m.params.args.map(a => a.value ?? a.description).join(" "));
  };
  await send("Runtime.enable");
  await send("Page.navigate", { url });
  const t0 = Date.now();
  let val;
  while (Date.now() - t0 < waitMs) {
    await sleep(500);
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    val = r?.result?.value;
    if (val) break;
  }
  console.log("RESULT:", typeof val === "string" ? val : JSON.stringify(val));
  for (const l of logs.slice(0, 15)) console.log(l);
} catch (e) {
  console.log("ERROR:", e.message);
} finally {
  try { ws && ws.close(); } catch {}
  edge.kill();
  await sleep(800);
  try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
  process.exit(0);
}
