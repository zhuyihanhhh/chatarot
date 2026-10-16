import * as Draw from "./draw.js";
import * as Hist from "./history.js";
import * as P from "./persona.js";
import { buildMessages, streamChat, renderMarkdown, readingOrderOf } from "./reading.js";

// ---------- 工具 ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const view = $("#view");
const SUIT = { wands: "权杖", cups: "圣杯", swords: "宝剑", pentacles: "星币" };
const CARD_RATIO = 1086 / 1810;

// ---------- 状态 ----------
const S = {
  deck: [], deckMap: {}, spreads: [], status: { hasKey: false, models: [], default: null },
  settings: Object.assign({ allowReversed: true, model: "" }, JSON.parse(localStorage.getItem("tarot.settings") || "{}")),
  spread: null, question: "",
  instances: [],
};
const saveSettings = () => localStorage.setItem("tarot.settings", JSON.stringify(S.settings));
// 当前模型：用户选择（须存在且已配置 Key）→ models.json 的 default
const findModel = key => S.status.models.find(m => m.key === key);
const currentModel = () => {
  const pick = findModel(S.settings.model);
  return pick && pick.hasKey ? pick : findModel(S.status.default) || S.status.models.find(m => m.hasKey) || null;
};
const model = () => currentModel()?.key || "";
const modelLabel = key => { const m = findModel(key); return m ? `${m.providerName} · ${m.name}` : key || "未选择"; };
const canRead = () => !!currentModel()?.hasKey;

function cleanupInstances() { for (const i of S.instances) i.destroy(); S.instances = []; }

const rigLoads = {};
function loadRig(stem) {
  if (Live2DCard.rigs[stem]) return Promise.resolve();
  return rigLoads[stem] ||= new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = `../engine/rigs/${stem}.js`;
    s.onload = res; s.onerror = () => rej(new Error("rig 加载失败 " + stem)); document.head.appendChild(s);
  });
}

async function mountCard(el, card, { rotate = 0, meshScale = 2, maxDpr = 1.5 } = {}) {
  await loadRig(card.stem);
  const inst = Live2DCard.mount(el, {
    stem: card.stem, img: `../assets/cards/${card.stem}.jpg`, baked: `../assets/baked/${card.stem}`,
    reversed: card.reversed, rotate, meshScale, maxDpr,
    onReady: () => el.classList.add("live"),
  });
  S.instances.push(inst);
  return inst;
}

// ---------- 顶栏 ----------
function refreshPersonaChip() {
  const p = P.getActive();
  $("#personaIcon").textContent = p.icon;
  $("#personaName").textContent = p.name;
}
$("#brand").onclick = e => { e.preventDefault(); showHome(); };
$("#btnPersona").onclick = () => openPersonaManager();
$("#btnHistory").onclick = () => openHistory();
$("#btnSettings").onclick = () => openSettings();

// ---------- 模态框 ----------
const modal = $("#modal"), modalBox = $("#modalBox");
let onModalClose = null;
function openModal(html, cls = "") {
  modalBox.className = "modal-box " + cls;
  modalBox.innerHTML = `<button class="modal-x" title="关闭">×</button>` + html;
  modal.classList.remove("hidden");
  $(".modal-x", modalBox).onclick = closeModal;
  return modalBox;
}
function closeModal() {
  modal.classList.add("hidden"); modalBox.innerHTML = "";
  if (onModalClose) { const f = onModalClose; onModalClose = null; f(); }
}
modal.addEventListener("pointerdown", e => { if (e.target === modal) closeModal(); });
addEventListener("keydown", e => { if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal(); });

function toast(msg, ms = 2600) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), ms);
}

// ---------- 首页：选牌阵 + 提问 ----------
function spreadDiagram(sp) {
  const [w, h] = sp.size, u = 14, cw = u * .62 * 1.4, ch = u * 1.4, ux = cw * 1.22, uy = ch * 1.08;
  const W = (w - 1) * ux + cw, H = (h - 1) * uy + ch;
  const rects = sp.positions.map(p => {
    const x = p.x * ux, y = p.y * uy;
    return `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="1.5" transform="rotate(${p.rot} ${x + cw / 2} ${y + ch / 2})"/>`;
  }).join("");
  return `<svg viewBox="-3 -3 ${W + 6} ${H + 6}" class="diagram">${rects}</svg>`;
}

const CATEGORIES = { all: "全部", daily: "日常速查", general: "综合运势", love: "感情关系", decision: "决策事业", cycle: "时间周期", spirit: "灵性成长" };
let homeCat = "all";

function showHome() {
  cleanupInstances();
  S.spread = S.spread || S.spreads.find(s => s.id === "three") || S.spreads[0];
  view.className = "view home";
  view.innerHTML = `
    <section class="hero">
      <h1>✶ 塔罗之间 ✶</h1>
      <p class="sub">Rider–Waite–Smith · Pam-A 1909 · Live2D</p>
    </section>
    ${S.status.error ? `<div class="banner">${esc(S.status.error)}</div>` : canRead() ? "" : `<div class="banner">还没有可用的 AI 模型：可以正常抽牌，但无法 AI 解读。请在项目根目录 <code>models.json</code> 中启用模型，并在 <code>.env</code> 中填写对应厂商的 API Key（如 <code>DEEPSEEK_API_KEY=sk-...</code>），然后重启服务。</div>`}
    <nav class="cats">${Object.entries(CATEGORIES).map(([k, v]) => `<button class="cat ${k === homeCat ? "on" : ""}" data-cat="${k}">${v}</button>`).join("")}</nav>
    <section class="spreads">
      ${S.spreads.map(sp => `
        <button class="spread ${sp.id === S.spread.id ? "on" : ""} ${homeCat === "all" || sp.category === homeCat ? "" : "hidden"}" data-id="${sp.id}" data-cat="${sp.category}">
          ${spreadDiagram(sp)}
          <b>${esc(sp.name)}</b><span class="count">${sp.positions.length} 张 · ${CATEGORIES[sp.category] || ""}</span>
          <small>${esc(sp.description)}</small>
        </button>`).join("")}
    </section>
    <section class="ask">
      <label for="q">在心中默念你的问题，并写下它（可留空做综合运势）</label>
      <textarea id="q" rows="3" maxlength="300" placeholder="例如：接下来三个月，我在工作上应该把重心放在哪里？">${esc(S.question)}</textarea>
      <div class="ask-row">
        <span class="muted">已选：<b id="selName">${esc(S.spread.name)}</b> · 占卜师：<a href="#" id="pickPersona">${esc(P.getActive().icon + " " + P.getActive().name)}</a> · 逆位：${S.settings.allowReversed ? "启用" : "关闭"}</span>
        <button class="primary big" id="go">开始洗牌</button>
      </div>
    </section>`;
  $$(".spread", view).forEach(b => b.onclick = () => {
    S.spread = S.spreads.find(s => s.id === b.dataset.id);
    $$(".spread", view).forEach(x => x.classList.toggle("on", x === b));
    $("#selName").textContent = S.spread.name;
  });
  $$(".cat", view).forEach(b => b.onclick = () => {
    homeCat = b.dataset.cat;
    $$(".cat", view).forEach(x => x.classList.toggle("on", x === b));
    $$(".spread", view).forEach(x => x.classList.toggle("hidden", homeCat !== "all" && x.dataset.cat !== homeCat));
  });
  $("#pickPersona").onclick = e => { e.preventDefault(); openPersonaManager(); };
  $("#go").onclick = () => { S.question = $("#q").value; startRitual(); };
}

// ---------- 仪式：洗牌 → 切牌 → 选牌 ----------
async function startRitual() {
  cleanupInstances();
  const n = S.spread.positions.length;
  let deck = Draw.shuffleDeck(S.deck, S.settings.allowReversed);
  view.className = "view ritual";
  view.innerHTML = `
    <div class="ritual-head"><h2 id="rtTitle">洗牌</h2><p id="rtSub" class="muted"></p></div>
    <div class="ritual-stage" id="stage"></div>
    <div class="ritual-actions" id="acts"></div>`;
  const stage = $("#stage"), acts = $("#acts"), title = $("#rtTitle"), sub = $("#rtSub");

  // 洗牌
  const shufflePhase = () => new Promise(resolve => {
    title.textContent = "洗牌"; sub.textContent = "专注于你的问题。想洗多久就洗多久，感觉对了就停下。";
    stage.innerHTML = `<div class="stack">${Array.from({ length: 14 }, (_, i) => `<div class="back" style="--i:${i}"></div>`).join("")}</div>`;
    acts.innerHTML = `<button id="again">继续洗牌</button><button class="primary" id="done">洗好了</button>`;
    const stack = $(".stack", stage);
    const anim = async () => {
      deck = Draw.shuffleDeck(S.deck, S.settings.allowReversed);
      stack.classList.remove("shuffling"); void stack.offsetWidth; stack.classList.add("shuffling");
    };
    anim();
    $("#again").onclick = anim;
    $("#done").onclick = resolve;
  });

  // 切牌
  const cutPhase = () => new Promise(resolve => {
    const piles = Draw.splitPiles(deck);
    title.textContent = "切牌"; sub.textContent = "用左手的直觉，选择其中一叠放到最上面。";
    stage.innerHTML = `<div class="piles">${piles.map((p, i) => `
      <button class="pile" data-i="${i}">${Array.from({ length: Math.min(8, Math.ceil(p.length / 4)) }, (_, k) => `<div class="back" style="--k:${k}"></div>`).join("")}<span>${p.length}</span></button>`).join("")}</div>`;
    acts.innerHTML = "";
    $$(".pile", stage).forEach(b => b.onclick = async () => {
      deck = Draw.cut(piles, +b.dataset.i);
      b.classList.add("chosen"); await sleep(500); resolve();
    });
  });

  // 选牌
  const pickPhase = () => new Promise(resolve => {
    const chosen = [];
    title.textContent = "选牌";
    const upd = () => sub.textContent = `凭直觉从牌扇中选出 ${n} 张牌（${chosen.length} / ${n}）· 下一张：${chosen.length < n ? shortName(S.spread, chosen.length) : "完成"}`;
    upd();
    const N = deck.length, spanDeg = Math.min(120, 40 + N);
    stage.innerHTML = `<div class="picked" id="picked">${S.spread.positions.map((p, i) => `<div class="pslot" data-i="${i}"><span>${i + 1}</span><small>${esc(shortName(S.spread, i))}</small></div>`).join("")}</div>
      <div class="fan" id="fan">${deck.map((_, i) => {
        const a = -spanDeg / 2 + spanDeg * i / (N - 1);
        return `<button class="back fan-card" data-i="${i}" style="--a:${a}deg"></button>`;
      }).join("")}</div>`;
    acts.innerHTML = "";
    $$(".fan-card", stage).forEach(b => b.onclick = () => {
      if (chosen.length >= n || b.classList.contains("taken")) return;
      b.classList.add("taken");
      chosen.push(deck[+b.dataset.i]);
      $(`.pslot[data-i="${chosen.length - 1}"]`, stage).classList.add("filled");
      upd();
      if (chosen.length === n) { sub.textContent = "牌已就位。"; setTimeout(() => resolve(chosen), 700); }
    });
  });

  await shufflePhase();
  await cutPhase();
  const cards = await pickPhase();
  showTable({ id: "r-" + Date.now().toString(36), time: Date.now(), spreadId: S.spread.id, question: S.question, cards, turns: [], messages: null });
}

// ---------- 牌桌 + 解读 ----------
let session = null, abortCtl = null;

// 牌位短名：年度牌阵显示具体月份
function shortName(spread, i, time) {
  const p = spread.positions[i];
  if (!spread.months) return p.name;
  const d = time ? new Date(time) : new Date();
  return `${new Date(d.getFullYear(), d.getMonth() + i, 1).getMonth() + 1}月`;
}

function layoutTable(table, spread) {
  const W = table.clientWidth - 24, H = table.clientHeight - 24, [sw, sh] = spread.size;
  const gx = 1.2, gy = 1.12, labelH = 26;
  const byW = W / (((sw - 1) * gx + 1) * CARD_RATIO);
  const byH = (H - labelH) / ((sh - 1) * gy + 1);
  const ch = Math.max(90, Math.min(byW, byH, spread.positions.length === 1 ? 560 : 420)), cw = ch * CARD_RATIO;
  const totalW = ((sw - 1) * gx + 1) * cw, totalH = ((sh - 1) * gy + 1) * ch;
  const ox = (table.clientWidth - totalW) / 2, oy = Math.max(12, (table.clientHeight - totalH - labelH) / 2);
  $$(".slot", table).forEach((el, i) => {
    const p = spread.positions[i];
    Object.assign(el.style, { left: ox + p.x * cw * gx + "px", top: oy + p.y * ch * gy + "px", width: cw + "px", height: ch + "px" });
  });
  table.style.setProperty("--ch", ch + "px");
}

function showTable(sess, { revealAll = false } = {}) {
  cleanupInstances();
  if (abortCtl) abortCtl.abort();
  session = sess;
  const spread = S.spreads.find(s => s.id === sess.spreadId);
  view.className = "view table-view";
  view.innerHTML = `
    <div class="table-wrap">
      <div class="table-bar">
        <div><b>${esc(spread.name)}</b><span class="muted"> · ${esc(sess.question?.trim() || "综合运势")}</span></div>
        <div><button id="revealAll">全部翻开</button><button id="newReading">重新占卜</button></div>
      </div>
      <div class="table" id="table">
        ${spread.positions.map((p, i) => {
          const c = sess.cards[i];
          return `<div class="slot ${p.rot ? "rot" : ""}" data-i="${i}">
            <div class="pcard" style="transform: rotate(${p.rot}deg)">
              <div class="flipper">
                <div class="face back"></div>
                <div class="face front"><img class="still ${c.reversed ? "rev" : ""}" src="../assets/cards/${c.stem}.jpg" alt=""></div>
              </div>
            </div>
            <div class="slot-label ${p.rot ? "above" : ""}">${i + 1} · ${esc(shortName(spread, i, sess.time))}</div>
          </div>`;
        }).join("")}
      </div>
    </div>
    <aside class="panel" id="panel">
      <div class="persona-line">占卜师：<a href="#" id="pp"></a></div>
      <details class="spread-guide" ${sess.turns.length ? "" : "open"}>
        <summary>解读顺序：${readingOrderOf(spread).join(" → ")}</summary>
        <p class="small muted">${esc(spread.guide || "")}</p>
        <p class="small muted">牌位由抽牌顺序决定；翻牌顺序不改变牌义。建议按上述顺序翻牌（金框提示下一张），你也可以凭直觉自由翻开——你亲手的翻牌顺序会告诉占卜师你最先关注的是哪张牌。</p>
      </details>
      <div id="cardList" class="card-list"></div>
      <div id="turns" class="turns"></div>
      <div id="readCtl" class="read-ctl"></div>
    </aside>
    <div class="tip hidden" id="tip"></div>`;

  const table = $("#table");
  const relayout = () => layoutTable(table, spread);
  relayout();
  new ResizeObserver(relayout).observe(table);
  const pp = $("#pp");
  const updPersona = () => { const p = sess.personaName && sess.turns.length ? { icon: sess.personaIcon || "", name: sess.personaName } : P.getActive(); pp.textContent = `${p.icon} ${p.name}`; };
  updPersona();
  pp.onclick = e => { e.preventDefault(); if (sess.turns.length) toast("本次占卜已开始，人设变更将用于下一次占卜"); openPersonaManager(); };

  const order = readingOrderOf(spread).map(n => n - 1);
  sess.flipOrder = sess.flipOrder || [];
  $$(".slot", table).forEach(el => {
    const i = +el.dataset.i;
    el.onclick = () => el.classList.contains("revealed") ? openZoom(i) : reveal(i, { manual: true });
    el.onmouseenter = () => showTip(el, i);
    el.onmouseleave = () => $("#tip").classList.add("hidden");
  });
  $("#revealAll").onclick = async () => { for (const i of order) if (!isRevealed(i)) { reveal(i); await sleep(260); } };
  $("#newReading").onclick = () => { S.spread = spread; S.question = sess.question || ""; showHome(); };

  function isRevealed(i) { return $(`.slot[data-i="${i}"]`, table).classList.contains("revealed"); }
  function markNext() {
    const next = order.find(i => !isRevealed(i));
    $$(".slot", table).forEach(el => el.classList.toggle("next", +el.dataset.i === next));
  }
  function reveal(i, { manual = false } = {}) {
    const el = $(`.slot[data-i="${i}"]`, table);
    if (el.classList.contains("revealed")) return;
    el.classList.add("revealed");
    if (manual && !sess.turns.length) sess.flipOrder.push(i + 1);
    const single = spread.positions.length === 1;
    mountCard($(".front", el), sess.cards[i], { rotate: spread.positions[i].rot, meshScale: single ? 1 : 2, maxDpr: single ? 2 : 1.5 })
      .catch(err => console.error(err));
    markNext(); renderCardList(); renderReadCtl();
  }
  function showTip(el, i) {
    if (!el.classList.contains("revealed")) return;
    const c = sess.cards[i], d = S.deckMap[c.stem], o = c.reversed ? d.reversed : d.upright, p = spread.positions[i];
    const tip = $("#tip");
    tip.innerHTML = `<b>${esc(d.nameZh)}</b> <span class="tag ${c.reversed ? "rev" : ""}">${c.reversed ? "逆位" : "正位"}</span>
      <div class="muted">${i + 1} · ${esc(shortName(spread, i, sess.time))} — ${esc(p.meaning)}</div>
      <div class="kw">${o.keywords.map(esc).join(" · ")}</div><div class="muted small">点击放大查看</div>`;
    const r = el.getBoundingClientRect();
    tip.classList.remove("hidden");
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = r.right + 10, y = r.top + 10;
    if (x + tw > innerWidth - 10) x = r.left - tw - 10;
    if (y + th > innerHeight - 10) y = innerHeight - th - 10;
    tip.style.left = Math.max(10, x) + "px"; tip.style.top = Math.max(10, y) + "px";
  }

  function renderCardList() {
    const items = spread.positions.map((p, i) => {
      const nm = esc(shortName(spread, i, sess.time));
      if (!isRevealed(i)) return `<li class="hidden-card"><span class="n">${i + 1}</span>${nm}<span class="muted"> · 未翻开</span></li>`;
      const c = sess.cards[i], d = S.deckMap[c.stem], k = sess.flipOrder.indexOf(i + 1);
      return `<li><span class="n">${i + 1}</span>${nm}：<b>${esc(d.nameZh)}</b> <span class="tag ${c.reversed ? "rev" : ""}">${c.reversed ? "逆位" : "正位"}</span>${k >= 0 ? `<span class="muted small"> · 第${k + 1}个翻开</span>` : ""}</li>`;
    });
    $("#cardList").innerHTML = `<ol>${items.join("")}</ol>`;
  }

  function renderReadCtl() {
    const ctl = $("#readCtl"), all = spread.positions.every((_, i) => isRevealed(i));
    if (sess.turns.length) {
      ctl.innerHTML = `<form id="fu" class="followup"><textarea id="fuq" rows="2" maxlength="500" placeholder="继续追问占卜师…（Enter 发送，Shift+Enter 换行）"></textarea><button class="primary" id="fuBtn">追问</button></form>`;
      const ta = $("#fuq"), form = $("#fu");
      ta.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } };
      form.onsubmit = e => { e.preventDefault(); const q = ta.value.trim(); if (!q || abortCtl) return; ta.value = ""; followUp(q); };
      return;
    }
    if (!canRead()) { ctl.innerHTML = `<p class="muted">没有可用的 AI 模型（见 models.json / .env），无法 AI 解读。可悬停或点击牌面查看牌义。</p>`; return; }
    ctl.innerHTML = all
      ? `<button class="primary big wide" id="readBtn">请占卜师解读</button><p class="muted small">模型：${esc(modelLabel(model()))}（可在「设置」中切换）</p>`
      : `<p class="muted">点击牌面逐张翻开，或点「全部翻开」。全部翻开后即可请占卜师解读。</p>`;
    if (all) $("#readBtn").onclick = startReading;
  }

  // ---------- 对话 ----------
  function renderTurns() {
    $("#turns").innerHTML = sess.turns.map((t, k) => turnHTML(t, k)).join("");
    bindTurnButtons();
  }
  function turnHTML(t, k) {
    return `<div class="turn" data-k="${k}">
      ${t.q ? `<div class="q">${esc(t.q)}</div>` : ""}
      ${t.reasoning ? `<details class="reasoning"><summary>思考过程</summary><div>${esc(t.reasoning)}</div></details>` : ""}
      <div class="a md">${t.content ? renderMarkdown(t.content) : t.error ? "" : `<span class="dots">占卜师正在凝视牌面</span>`}</div>
      ${t.error ? `<div class="err">解读失败：${esc(t.error)} <button class="retry" data-k="${k}">重试</button></div>` : ""}
      ${t.streaming ? `<button class="stop" data-k="${k}">停止</button>` : ""}
      ${t.stopped ? `<div class="muted small">（已停止生成）</div>` : ""}
    </div>`;
  }
  function updateTurn(k) {
    const el = $(`.turn[data-k="${k}"]`);
    if (!el) return renderTurns();
    el.outerHTML = turnHTML(sess.turns[k], k);
    bindTurnButtons();
  }
  function bindTurnButtons() {
    $$(".stop", view).forEach(b => b.onclick = () => abortCtl && abortCtl.abort());
    $$(".retry", view).forEach(b => b.onclick = () => runTurn(+b.dataset.k));
  }

  function startReading() {
    const persona = P.getActive();
    sess.personaName = persona.name; sess.personaIcon = persona.icon; sess.model = model();
    const n = spread.positions.length, m = sess.flipOrder.length;
    sess.flipMode = m === 0 ? "auto" : m === n ? "manual" : "mixed";
    sess.messages = buildMessages({ question: sess.question, spread, cards: sess.cards, flipOrder: sess.flipOrder, flipMode: sess.flipMode, time: sess.time }, S.deckMap, persona);
    sess.turns.push({ content: "", reasoning: "" });
    renderReadCtl(); renderTurns(); runTurn(sess.turns.length - 1);
  }
  function followUp(q) {
    if (sess.messages.length > 2 && sess.messages[sess.messages.length - 1].role === "user") sess.messages.pop();
    sess.messages.push({ role: "user", content: q });
    sess.turns.push({ q, content: "", reasoning: "" });
    renderTurns(); runTurn(sess.turns.length - 1);
  }

  async function runTurn(k) {
    const t = sess.turns[k];
    Object.assign(t, { content: "", reasoning: "", error: null, stopped: false, streaming: true });
    // messages 末尾若是该轮旧的 assistant，先移除
    if (sess.messages[sess.messages.length - 1].role === "assistant") sess.messages.pop();
    updateTurn(k);
    const turnsEl = $("#turns");
    abortCtl = new AbortController();
    let pending = false;
    try {
      await streamChat({
        messages: sess.messages, model: findModel(sess.model)?.hasKey ? sess.model : model(), signal: abortCtl.signal,
        onDelta: ({ content, reasoning }) => {
          t.content = content; t.reasoning = reasoning;
          if (pending) return; pending = true;
          requestAnimationFrame(() => {
            pending = false; updateTurn(k);
            const panel = $("#panel"); if (panel && panel.scrollHeight - panel.scrollTop - panel.clientHeight < 160) panel.scrollTop = panel.scrollHeight;
          });
        },
      });
    } catch (err) {
      if (err.name === "AbortError") t.stopped = true; else t.error = err.message;
    }
    abortCtl = null; t.streaming = false;
    if (t.content) sess.messages.push({ role: "assistant", content: t.content });
    updateTurn(k);
    if (session === sess && !t.error && t.content) { Hist.save(sess); }
    renderReadCtl();
    if (turnsEl) $("#panel").scrollTop = $("#panel").scrollHeight;
  }

  // ---------- 放大查看 ----------
  function openZoom(i) {
    const c = sess.cards[i], d = S.deckMap[c.stem], p = spread.positions[i];
    const box = openModal(`
      <div class="zoom">
        <div class="zoom-card"><div class="zc" id="zc"><img class="still ${c.reversed ? "rev" : ""}" src="../assets/cards/${c.stem}.jpg" alt=""></div></div>
        <div class="zoom-info">
          <h2>${esc(d.nameZh)} <small>${esc(d.nameEn)}</small></h2>
          <p><span class="tag ${c.reversed ? "rev" : ""}">${c.reversed ? "逆位" : "正位"}</span> · 第 ${i + 1} 位「${esc(shortName(spread, i, sess.time))}」：${esc(p.meaning)}</p>
          <p class="muted">${d.arcana === "major" ? "大阿卡纳 " + esc(d.number) : "小阿卡纳 · " + SUIT[d.suit]} · 元素 ${esc(d.element)} · ${esc(d.astrology)}</p>
          <p class="muted">${esc(d.intro || d.imagery)}</p>
          ${d.symbols ? `<details class="symbols"><summary>画面象征（${d.symbols.length}）</summary><ul>${d.symbols.map(s => `<li><b>${esc(s.name)}</b>：${esc(s.meaning)}</li>`).join("")}</ul></details>` : ""}
          ${["upright", "reversed"].map(o => `
            <div class="meaning ${(o === "reversed") === c.reversed ? "cur" : ""}">
              <h4>${o === "upright" ? "正位" : "逆位"}</h4>
              <div class="kw">${d[o].keywords.map(esc).join(" · ")}</div>
              <p>${esc(d[o].meaning)}</p>
            </div>`).join("")}
        </div>
      </div>`, "wide");
    let inst = null;
    mountCard($("#zc", box), c, { meshScale: 1, maxDpr: 2 }).then(x => { inst = x; if (modal.classList.contains("hidden")) x.destroy(); });
    onModalClose = () => { if (inst) { inst.destroy(); S.instances = S.instances.filter(x => x !== inst); } };
  }

  renderCardList(); renderReadCtl(); markNext();
  if (revealAll) order.forEach(i => reveal(i));
  if (sess.turns.length) renderTurns();
}

// ---------- 占卜记录 ----------
function openHistory() {
  const render = () => {
    const list = Hist.list();
    const box = openModal(`<h2>占卜记录</h2>
      ${list.length ? `<ul class="hist">${list.map(e => {
        const sp = S.spreads.find(s => s.id === e.spreadId);
        const names = e.cards.map(c => S.deckMap[c.stem].nameZh + (c.reversed ? "(逆)" : "")).join("、");
        return `<li data-id="${e.id}">
          <div class="h-main"><b>${esc(e.question?.trim() || "综合运势")}</b>
            <div class="muted small">${new Date(e.time).toLocaleString("zh-CN")} · ${esc(sp?.name || e.spreadId)} · ${esc(e.personaIcon || "")} ${esc(e.personaName || "")}</div>
            <div class="small">${esc(names)}</div></div>
          <div class="h-act"><button class="open">打开</button><button class="del">删除</button></div></li>`;
      }).join("")}</ul>` : `<p class="muted">还没有占卜记录。</p>`}`);
    $$(".hist li", box).forEach(li => {
      $(".open", li).onclick = () => {
        const e = Hist.get(li.dataset.id); closeModal();
        e.turns.forEach(t => { t.streaming = false; });
        showTable(e, { revealAll: true });
      };
      $(".del", li).onclick = () => { if (confirm("删除这条占卜记录？")) { Hist.remove(li.dataset.id); render(); } };
    });
  };
  render();
}

// ---------- 设置 ----------
async function refreshStatus() {
  try { S.status = await (await fetch("/api/status", { cache: "no-store" })).json(); } catch {}
  S.status.models = S.status.models || [];
}

function openSettings() {
  const render = () => {
    const cur = model(), groups = {};
    for (const m of S.status.models) (groups[m.providerName] ||= []).push(m);
    const opts = Object.entries(groups).map(([g, ms]) => `<optgroup label="${esc(g)}">${ms.map(m =>
      `<option value="${esc(m.key)}" ${m.key === cur ? "selected" : ""} ${m.hasKey ? "" : "disabled"}>${esc(m.name)}${m.key === S.status.default ? "（默认）" : ""}${m.hasKey ? "" : "（未配置 Key）"}${m.note ? " · " + esc(m.note) : ""}</option>`).join("")}</optgroup>`).join("");
    const box = openModal(`<h2>设置</h2>
      <label class="row"><input type="checkbox" id="sRev" ${S.settings.allowReversed ? "checked" : ""}> 启用逆位（每张牌独立 50% 概率）</label>
      <label class="row">AI 模型
        <select id="sModel" ${S.status.models.length ? "" : "disabled"}>${opts || `<option>（无可用模型）</option>`}</select>
        <button id="sReload" title="重新读取 models.json">刷新</button></label>
      ${S.status.error ? `<p class="err small">${esc(S.status.error)}</p>` : ""}
      <p class="muted small">模型清单来自项目根目录 <code>models.json</code>：按厂商填写 <code>baseUrl</code>（OpenAI 兼容接口）、<code>apiKeyEnv</code>（.env 中的变量名）与 <code>models</code>，设 <code>"enabled": false</code> 可隐藏。修改 models.json 后点「刷新」即可；新增或修改 .env 中的 Key 需重启服务。Key 只保存在本机，不会发送到浏览器。</p>`);
    $("#sRev", box).onchange = e => { S.settings.allowReversed = e.target.checked; saveSettings(); };
    $("#sModel", box).onchange = e => { S.settings.model = e.target.value; saveSettings(); };
    $("#sReload", box).onclick = async e => { e.preventDefault(); await refreshStatus(); render(); toast(`已加载 ${S.status.models.length} 个模型`); };
  };
  render();
  onModalClose = () => { if (view.classList.contains("home")) showHome(); };
}

// ---------- 人设管理 ----------
function openPersonaManager() {
  let selId = P.getActive().id, editing = null, preview = false;

  const render = () => {
    const tpl = P.getTemplates(), custom = P.getCustom(), all = [...tpl, ...custom];
    const sel = editing || all.find(p => p.id === selId) || tpl[0];
    const activeId = P.getActive().id;
    const item = p => `<li class="${p.id === sel.id ? "sel" : ""}" data-id="${p.id}"><span class="ic">${esc(p.icon)}</span>${esc(p.name)}${p.id === activeId ? `<span class="tag">使用中</span>` : ""}</li>`;
    const box = openModal(`
      <div class="pm">
        <div class="pm-list">
          <h3>内置模板</h3><ul>${tpl.map(item).join("")}</ul>
          <h3>我的占卜师</h3><ul>${custom.map(item).join("") || `<li class="muted empty">暂无，可复制模板或新建</li>`}</ul>
          <div class="pm-io"><button id="pmNew">新建</button><button id="pmImport">导入</button><button id="pmExport" ${custom.length ? "" : "disabled"}>导出</button></div>
          <input type="file" id="pmFile" accept=".json,application/json" hidden>
        </div>
        <div class="pm-edit">${editorHTML(sel, !!editing)}</div>
      </div>`, "wide");

    $$(".pm-list li[data-id]", box).forEach(li => li.onclick = () => {
      if (editing && !confirm("放弃未保存的修改？")) return;
      editing = null; selId = li.dataset.id; preview = false; render();
    });
    $("#pmNew", box).onclick = () => { editing = { ...P.normalize({ name: "我的占卜师" }).persona, isNew: true }; preview = false; render(); };
    $("#pmExport", box).onclick = () => download("tarot-personas.json", P.exportPersonas(P.getCustom()));
    $("#pmImport", box).onclick = () => $("#pmFile", box).click();
    $("#pmFile", box).onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const { imported, warnings } = P.importPersonas(await f.text());
        toast(`已导入 ${imported} 个人设`);
        if (warnings.length) alert("部分字段不合法，已回退为默认值：\n" + warnings.join("\n"));
      } catch (err) { alert("导入失败：" + err.message); }
      render();
    };

    const ed = $(".pm-edit", box);
    $("#useBtn", ed)?.addEventListener("click", () => { P.setActive(sel.id); refreshPersonaChip(); toast(`已切换为「${sel.name}」`); render(); });
    $("#dupBtn", ed)?.addEventListener("click", () => { const c = P.duplicate(sel); selId = c.id; editing = null; render(); });
    $("#editBtn", ed)?.addEventListener("click", () => { editing = structuredClone(sel); render(); });
    $("#delBtn", ed)?.addEventListener("click", () => {
      if (!confirm(`删除「${sel.name}」？`)) return;
      P.removeCustom(sel.id); refreshPersonaChip(); selId = P.getActive().id; editing = null; render();
    });
    $("#cancelBtn", ed)?.addEventListener("click", () => { editing = null; render(); });
    $("#previewBtn", ed)?.addEventListener("click", () => { if (editing) editing = readForm(ed, editing); preview = !preview; render(); });
    $("#saveBtn", ed)?.addEventListener("click", () => {
      const p = readForm(ed, editing);
      const saved = P.upsertCustom(p);
      selId = saved.id; editing = null;
      if (p.isNew) P.setActive(saved.id);
      refreshPersonaChip(); toast("已保存"); render();
    });
    const extra = $("#fExtra", ed);
    if (extra) extra.oninput = () => { $("#extraCount", ed).textContent = `${extra.value.length} / ${P.EXTRA_MAX}`; };
    const dir = $("#fDir", ed);
    if (dir) dir.oninput = () => { $("#dirText", ed).textContent = `${dir.value} · ${P.DIRECTNESS_TEXT[dir.value]}`; };
    if (preview) $("#previewBox", ed).textContent = P.buildSystemPrompt(editing ? P.normalize(editing).persona : sel);
  };

  const editorHTML = (p, edit) => {
    const D = P.DIMENSIONS;
    const sel = (k) => edit
      ? `<select id="f_${k}">${Object.entries(D[k].options).map(([v, o]) => `<option value="${v}" ${p[k] === v ? "selected" : ""}>${o.label}</option>`).join("")}</select>`
      : `<span>${D[k].options[p[k]].label}</span>`;
    const desc = k => `<div class="muted small">${esc(D[k].options[p[k]].text)}</div>`;
    return `
      <div class="pm-head">
        ${edit ? `<input id="fIcon" class="icon-in" maxlength="4" value="${esc(p.icon)}"><input id="fName" maxlength="30" value="${esc(p.name)}" placeholder="名称">`
               : `<span class="ic big">${esc(p.icon)}</span><h2>${esc(p.name)}</h2>${p.builtin ? `<span class="tag">内置模板 · 只读</span>` : ""}`}
      </div>
      ${edit ? `<input id="fDesc" maxlength="120" value="${esc(p.description)}" placeholder="一句话简介（可选）">` : `<p class="muted">${esc(p.description)}</p>`}
      <details class="baseline"><summary>专业底线（固定，不可修改）</summary><pre>${esc(P.BASELINE)}</pre></details>
      <div class="form">
        <label>${D.school.label}</label><div>${sel("school")}${edit ? "" : desc("school")}</div>
        <label>${D.reversalMethod.label}</label><div>${sel("reversalMethod")}${edit ? "" : desc("reversalMethod")}</div>
        <label>${D.tone.label}</label><div>${sel("tone")}${edit ? "" : desc("tone")}</div>
        <label>直接程度</label><div>${edit ? `<input type="range" id="fDir" min="1" max="5" step="1" value="${p.directness}"> ` : ""}<span id="dirText">${p.directness} · ${esc(P.DIRECTNESS_TEXT[p.directness])}</span></div>
        <label>${D.length.label}</label><div>${sel("length")}</div>
        <label>称呼</label><div>${edit ? `<input id="fAddr" maxlength="12" value="${esc(p.address)}">` : esc(p.address)}</div>
        <label>关注点</label><div class="checks">${Object.entries(P.FOCUS).map(([k, v]) => edit
          ? `<label><input type="checkbox" name="focus" value="${k}" ${p.focus.includes(k) ? "checked" : ""}>${esc(v.replace(/（.*）/, ""))}</label>`
          : p.focus.includes(k) ? `<span class="tag">${esc(v.replace(/（.*）/, ""))}</span>` : "").join("")}</div>
        <label>输出结构</label><div class="checks">${Object.entries(P.OUTPUTS).map(([k, v]) => edit
          ? `<label><input type="checkbox" name="out" value="${k}" ${p.output[k] ? "checked" : ""}>${v.label}</label>`
          : p.output[k] ? `<span class="tag">${v.label}</span>` : "").join("")}</div>
        <label>人设补充</label><div>${edit
          ? `<textarea id="fExtra" rows="4" maxlength="${P.EXTRA_MAX}" placeholder="名字、口头禅、背景、禁忌等（仅影响风格，不能突破专业底线）">${esc(p.extra)}</textarea><div class="muted small" id="extraCount">${p.extra.length} / ${P.EXTRA_MAX}</div>`
          : `<div class="extra">${esc(p.extra) || `<span class="muted">（无）</span>`}</div>`}</div>
      </div>
      <div class="pm-actions">
        ${edit ? `<button class="primary" id="saveBtn">保存</button><button id="cancelBtn">取消</button>`
               : `<button class="primary" id="useBtn">使用此人设</button>${p.builtin ? `<button id="dupBtn">复制为自定义</button>` : `<button id="editBtn">编辑</button><button id="dupBtn">复制</button><button id="delBtn" class="danger">删除</button>`}`}
        <button id="previewBtn">${preview ? "隐藏" : "预览"}提示词</button>
      </div>
      ${preview ? `<pre class="preview" id="previewBox"></pre>` : ""}`;
  };

  const readForm = (ed, base) => ({
    ...base,
    icon: $("#fIcon", ed).value.trim() || "🔮",
    name: $("#fName", ed).value.trim() || "未命名占卜师",
    description: $("#fDesc", ed).value.trim(),
    school: $("#f_school", ed).value, reversalMethod: $("#f_reversalMethod", ed).value, tone: $("#f_tone", ed).value, length: $("#f_length", ed).value,
    directness: +$("#fDir", ed).value,
    address: $("#fAddr", ed).value.trim() || "你",
    focus: $$('input[name="focus"]:checked', ed).map(x => x.value),
    output: Object.fromEntries(Object.keys(P.OUTPUTS).map(k => [k, !!$(`input[name="out"][value="${k}"]`, ed)?.checked])),
    extra: $("#fExtra", ed).value.slice(0, P.EXTRA_MAX),
  });

  onModalClose = () => { refreshPersonaChip(); if (view.classList.contains("home")) showHome(); else if (session) $("#pp") && ($("#pp").textContent = session.turns.length ? `${session.personaIcon} ${session.personaName}` : `${P.getActive().icon} ${P.getActive().name}`); };
  render();
}

function download(name, text) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- 启动 ----------
(async () => {
  try {
    const [deck, spreads, status] = await Promise.all([
      fetch("../data/deck.json").then(r => r.json()),
      fetch("../data/spreads.json").then(r => r.json()),
      fetch("/api/status", { cache: "no-store" }).then(r => r.json()).catch(() => ({ hasKey: false, models: [], default: null })),
      P.loadTemplates(),
    ]);
    S.deck = deck; S.deckMap = Object.fromEntries(deck.map(c => [c.stem, c])); S.spreads = spreads; S.status = status; S.status.models = status.models || [];
    refreshPersonaChip();
    const demo = location.hash.match(/^#demo=(\w+)/);
    if (demo) return runDemo(demo[1]);
    showHome();
  } catch (err) {
    view.innerHTML = `<div class="banner">加载失败：${esc(err.message)}。请通过 <code>node server.js</code> 启动后访问 http://127.0.0.1:3090/app/</div>`;
  }
})();

// 自检：#demo=celtic 直接随机发牌并全部翻开，统计就绪耗时与帧率
async function runDemo(spreadId) {
  const spread = S.spreads.find(s => s.id === spreadId) || S.spreads[3];
  const deck = Draw.shuffleDeck(S.deck, true);
  const t0 = performance.now();
  showTable({ id: "demo", time: Date.now(), spreadId: spread.id, question: "自检", cards: deck.slice(0, spread.positions.length), turns: [], messages: null }, { revealAll: true });
  while (S.instances.length < spread.positions.length) await sleep(50);
  await Promise.all(S.instances.map(i => i.ready));
  const readyMs = Math.round(performance.now() - t0);
  let frames = 0; const f0 = performance.now();
  await new Promise(res => { const tick = () => { frames++; performance.now() - f0 < 3000 ? requestAnimationFrame(tick) : res(); }; requestAnimationFrame(tick); });
  const fps = Math.round(frames / ((performance.now() - f0) / 1000));
  const src = S.instances.map(i => i.source).join(",");
  const out = document.createElement("div"); out.id = "demoResult";
  out.textContent = `DEMO spread=${spread.id} ready=${readyMs}ms fps=${fps} sources=${src} loads=${S.instances.map(i => i.loadMs).join(",")}`;
  document.body.appendChild(out); document.title = out.textContent;
}

window.__tarot = { S, P, Draw, Hist, showTable };
