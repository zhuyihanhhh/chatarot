// AI 解读：构造提示词、SSE 流式请求、轻量 Markdown 渲染
import { buildSystemPrompt } from "./persona.js";

// 年度牌阵：第 n 月 → 具体年月（从占卜当月起算）
export function positionName(spread, i, date = new Date()) {
  const pos = spread.positions[i];
  if (!spread.months) return pos.name;
  const d = new Date(date.getFullYear(), date.getMonth() + i, 1);
  return `${pos.name}（${d.getFullYear()}年${d.getMonth() + 1}月）`;
}

export function readingOrderOf(spread) {
  return spread.readingOrder || spread.positions.map((_, i) => i + 1);
}

export function buildUserMessage({ question, spread, cards, flipOrder, flipMode, time }, deckMap) {
  const when = time ? new Date(time) : new Date();
  const today = when.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  const order = readingOrderOf(spread);
  const label = n => `第${n}位「${spread.positions[n - 1].name}」`;
  const lines = [
    `# 占卜请求`,
    `- 日期：${today}`,
    `- 问题：${question && question.trim() ? question.trim() : "（无特定问题，请做综合运势解读）"}`,
    `- 牌阵：${spread.name}（${spread.positions.length} 张）— ${spread.description}`,
    ``, `# 牌阵解读方法`,
    `- 建议解读顺序：${order.map(label).join(" → ")}`,
  ];
  if (spread.guide) lines.push(`- 解读要点：${spread.guide}`);
  if (flipOrder && flipOrder.length) {
    const manual = flipMode === "manual" || flipMode === "mixed";
    lines.push(``, `# 翻牌记录`);
    if (manual) {
      const same = flipOrder.join() === order.join();
      lines.push(`- 问卜者亲手翻牌的顺序：${flipOrder.map(label).join(" → ")}${flipMode === "mixed" ? "（之后其余牌一次性翻开）" : ""}`);
      lines.push(`- ${same ? "与建议解读顺序一致。" : `与建议解读顺序不同；问卜者最先翻开的是${label(flipOrder[0])}。`}`);
    } else {
      lines.push(`- 问卜者选择了一次性全部翻开（按建议顺序自动翻牌）。`);
    }
  }
  lines.push(``, `# 抽到的牌（按牌位编号；牌位由抽牌顺序决定）`);
  spread.positions.forEach((pos, i) => {
    const c = cards[i], d = deckMap[c.stem], o = c.reversed ? d.reversed : d.upright;
    lines.push(
      ``, `## 第 ${i + 1} 位 · ${positionName(spread, i, when)}（${pos.meaning}）`,
      `- 牌：${d.nameZh}（${d.nameEn}）· **${c.reversed ? "逆位" : "正位"}**`,
      `- 类别：${d.arcana === "major" ? "大阿卡纳" : "小阿卡纳 · " + { wands: "权杖", cups: "圣杯", swords: "宝剑", pentacles: "星币" }[d.suit]}；元素：${d.element}；对应：${d.astrology}`,
      `- 牌面：${d.imagery}`,
      `- ${c.reversed ? "逆位" : "正位"}关键词：${o.keywords.join("、")}`,
      `- ${c.reversed ? "逆位" : "正位"}牌义参考：${o.meaning}`,
    );
  });
  lines.push(
    ``, `# 关于顺序的解读规则`,
    `- 每张牌的含义只由「牌位 + 牌面 + 正逆位」决定；翻牌顺序不会改变任何一张牌的含义或吉凶。`,
    `- 请按上面的「建议解读顺序」组织叙事（这是该牌阵的传统阅读路径），并遵循「解读要点」中的牌位对照关系。`,
    `- 若有「问卜者亲手翻牌的顺序」且与建议顺序不同，可在开头用一两句话温和点出问卜者最先翻开的牌——它往往是其注意力或直觉最先投向之处，可作为切入话题；但不得据此改变任何结论，也不要过度渲染。若为一次性全部翻开，则不必提及翻牌顺序。`,
    ``, `请依据以上信息进行解读。`,
  );
  return lines.join("\n");
}

export function buildMessages(reading, deckMap, persona) {
  return [
    { role: "system", content: buildSystemPrompt(persona) },
    { role: "user", content: buildUserMessage(reading, deckMap) },
  ];
}

// 流式请求；onDelta({ content, reasoning }) 每收到增量调用一次
export async function streamChat({ messages, model, signal, onDelta }) {
  const r = await fetch("/api/chat", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, model }), signal,
  });
  if (!r.ok) {
    let msg = `HTTP ${r.status}`;
    try { msg = (await r.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  const reader = r.body.getReader(), dec = new TextDecoder();
  let buf = "", content = "", reasoning = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return { content, reasoning };
      let j; try { j = JSON.parse(data); } catch { continue; }
      if (j.error) throw new Error(typeof j.error === "string" ? j.error : j.error.message);
      const d = j.choices?.[0]?.delta || {};
      const rc = d.reasoning_content || (typeof d.reasoning === "string" ? d.reasoning : "");
      if (rc) reasoning += rc;
      if (d.content) content += d.content;
      if (rc || d.content) onDelta({ content, reasoning });
    }
  }
  return { content, reasoning };
}

// ---------- 轻量 Markdown ----------
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = s => esc(s)
  .replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

export function renderMarkdown(md) {
  const out = [], lines = md.replace(/\r/g, "").split("\n");
  let list = null, para = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${para.map(inline).join("<br>")}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.tag}>${list.items.map(i => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`); list = null; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flushPara(); flushList(); continue; }
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) { flushPara(); flushList(); const h = Math.min(4, m[1].length + 1); out.push(`<h${h}>${inline(m[2])}</h${h}>`); continue; }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) { flushPara(); flushList(); out.push("<hr>"); continue; }
    if ((m = line.match(/^>\s?(.*)$/))) { flushPara(); flushList(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
    if ((m = line.match(/^\s*[-*+]\s+(.*)$/)) || (m = line.match(/^\s*\d+[.)、]\s+(.*)$/))) {
      flushPara();
      const tag = /^\s*\d/.test(line) ? "ol" : "ul";
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
      list.items.push(m[1]); continue;
    }
    flushList(); para.push(line);
  }
  flushPara(); flushList();
  return out.join("");
}
