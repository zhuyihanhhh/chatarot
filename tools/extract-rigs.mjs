// 把 cards/RWSa-*.html 的内联 rig 脚本抽到 engine/rigs/<stem>.js，并改写 HTML 引用
// 用法：node tools/extract-rigs.mjs [--dry]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CARDS = path.join(ROOT, "cards"), RIGS = path.join(ROOT, "engine", "rigs");
const dry = process.argv.includes("--dry");
fs.mkdirSync(RIGS, { recursive: true });

const ENGINE_TAG = '<script src="../engine/live2d-card.js"></script>';
let ok = 0, skipped = 0;
for (const f of fs.readdirSync(CARDS).filter(f => /^RWSa-.*\.html$/.test(f)).sort()) {
  const stem = f.replace(/\.html$/, "");
  const file = path.join(CARDS, f);
  const html = fs.readFileSync(file, "utf8");
  if (html.includes(`../engine/rigs/${stem}.js`)) { skipped++; continue; }

  const start = html.indexOf(ENGINE_TAG);
  if (start < 0) throw new Error(`${f}: 找不到引擎 script 标签`);
  const open = html.indexOf("<script>", start + ENGINE_TAG.length);
  const close = html.indexOf("</script>", open);
  if (open < 0 || close < 0) throw new Error(`${f}: 找不到内联脚本`);
  const body = html.slice(open + "<script>".length, close);

  const calls = body.split("Live2DCard.run(").length - 1;
  if (calls !== 1) throw new Error(`${f}: Live2DCard.run 出现 ${calls} 次`);
  const at = body.indexOf("Live2DCard.run(");
  const tail = body.slice(at).trimEnd();
  if (!/\}\s*\)\s*;?$/.test(tail)) throw new Error(`${f}: run(...) 之后还有其它代码`);

  const factoryBody = body.slice(0, at) + "return (" + body.slice(at + "Live2DCard.run(".length);
  const indented = factoryBody.replace(/^\n+/, "").trimEnd().split("\n").map(l => (l ? "  " + l : l)).join("\n");
  const rigSrc = `Live2DCard.register("${stem}", () => {\n${indented}\n});\n`;

  const newHtml = html.slice(0, open) +
    `<script src="../engine/rigs/${stem}.js"></script>\n<script>Live2DCard.run(Live2DCard.rig("${stem}"));</script>` +
    html.slice(close + "</script>".length);

  if (!dry) {
    fs.writeFileSync(path.join(RIGS, stem + ".js"), rigSrc, "utf8");
    fs.writeFileSync(file, newHtml, "utf8");
  }
  ok++;
}
console.log(`extracted: ${ok}, already done: ${skipped}${dry ? " (dry run)" : ""}`);
