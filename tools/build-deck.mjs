// 合并 data/deck/*.json → data/deck.json 并校验
// 用法：node tools/build-deck.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const parts = ["major", "wands-cups", "swords-pentacles"];
const deck = parts.flatMap(p => JSON.parse(fs.readFileSync(path.join(ROOT, "data", "deck", p + ".json"), "utf8")));
const intros = Object.assign({}, ...["intro-major", "intro-wands-cups", "intro-swords-pentacles"].map(p => JSON.parse(fs.readFileSync(path.join(ROOT, "data", "deck", p + ".json"), "utf8"))));
for (const c of deck) if (intros[c.stem]) Object.assign(c, { intro: intros[c.stem].intro, symbols: intros[c.stem].symbols });

const errs = [];
const seen = new Set();
for (const c of deck) {
  const id = c.stem || "<no stem>";
  if (!/^RWSa-[TWCSP]-[0-9A-Z]{2}$/.test(c.stem || "")) errs.push(`${id}: bad stem`);
  if (seen.has(c.stem)) errs.push(`${id}: duplicate`);
  seen.add(c.stem);
  if (!fs.existsSync(path.join(ROOT, "assets", "cards", c.stem + ".jpg"))) errs.push(`${id}: missing jpg`);
  for (const k of ["nameZh", "nameEn", "arcana", "element", "astrology", "imagery", "intro"]) if (!c[k]) errs.push(`${id}: missing ${k}`);
  if (!Array.isArray(c.symbols) || c.symbols.length < 3 || c.symbols.some(s => !s.name || !s.meaning)) errs.push(`${id}: symbols < 3 or malformed`);
  for (const o of ["upright", "reversed"]) {
    const v = c[o];
    if (!v || !Array.isArray(v.keywords) || v.keywords.length < 3) errs.push(`${id}: ${o}.keywords < 3`);
    if (!v || !v.meaning || v.meaning.length < 20) errs.push(`${id}: ${o}.meaning too short`);
  }
}
const major = deck.filter(c => c.arcana === "major").length, minor = deck.filter(c => c.arcana === "minor").length;
if (deck.length !== 78) errs.push(`count ${deck.length} != 78`);
if (major !== 22 || minor !== 56) errs.push(`major ${major} / minor ${minor}`);

if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
fs.writeFileSync(path.join(ROOT, "data", "deck.json"), JSON.stringify(deck, null, 1), "utf8");
// 单牌页可能以 file:// 打开（无法 fetch），额外输出脚本版
fs.writeFileSync(path.join(ROOT, "data", "deck.js"), "window.TAROT_DECK = " + JSON.stringify(deck) + ";\n", "utf8");
console.log(`deck.json / deck.js ok: ${deck.length} cards (${major} major, ${minor} minor)`);
