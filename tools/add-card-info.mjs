// 给 cards/RWSa-*.html 加上说明面板脚本（幂等）
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TAG = '<script src="../data/deck.js"></script><script src="../engine/card-info.js"></script>';
let n = 0;
for (const f of fs.readdirSync(path.join(ROOT, "cards")).filter(f => /^RWSa-.*\.html$/.test(f))) {
  const file = path.join(ROOT, "cards", f), html = fs.readFileSync(file, "utf8");
  if (html.includes("engine/card-info.js")) continue;
  if (!html.includes("</body>")) throw new Error(f + ": no </body>");
  fs.writeFileSync(file, html.replace("</body>", TAG + "\n</body>"), "utf8");
  n++;
}
console.log("patched", n);
