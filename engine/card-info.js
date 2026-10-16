/* 单牌页说明面板：读取 window.TAROT_DECK（data/deck.js），按页面文件名定位牌面 */
(() => {
  const deck = window.TAROT_DECK;
  const m = decodeURIComponent(location.pathname).match(/(RWSa-[A-Z]-[0-9A-Z]{2})\.html$/);
  if (!deck || !m) return;
  const idx = deck.findIndex(c => c.stem === m[1]);
  if (idx < 0) return;
  const c = deck[idx], prev = deck[(idx + deck.length - 1) % deck.length], next = deck[(idx + 1) % deck.length];
  const esc = s => String(s ?? "").replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const SUIT = { wands: "权杖", cups: "圣杯", swords: "宝剑", pentacles: "星币" };
  const RANK = { ace: "一", page: "侍从", knight: "骑士", queen: "王后", king: "国王" };
  const kind = c.arcana === "major" ? `大阿卡纳 · ${esc(c.number)}` : `小阿卡纳 · ${SUIT[c.suit]} · ${RANK[c.rank] || esc(c.rank)}`;
  const facts = [["类别", kind], ["元素", esc(c.element)], ["星象对应", esc(c.astrology)]];
  if (c.hebrew) facts.push(["希伯来字母", esc(c.hebrew)]);
  const orient = (o, label) => `
    <section class="ci-orient ${o}">
      <h3>${label}</h3>
      <div class="ci-kw">${c[o].keywords.map(k => `<span>${esc(k)}</span>`).join("")}</div>
      <p>${esc(c[o].meaning)}</p>
    </section>`;

  const aside = document.createElement("aside");
  aside.className = "card-info";
  aside.innerHTML = `
    <div class="ci-nav">
      <a href="${prev.stem}.html" title="${esc(prev.nameZh)}">‹ ${esc(prev.nameZh)}</a>
      <button class="ci-hide" title="隐藏说明">收起</button>
      <a href="${next.stem}.html" title="${esc(next.nameZh)}">${esc(next.nameZh)} ›</a>
    </div>
    <header>
      <h1>${esc(c.nameZh)}</h1>
      <div class="ci-en">${esc(c.nameEn)}</div>
    </header>
    <dl class="ci-facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
    <section><h3>牌面介绍</h3><p>${esc(c.intro || c.imagery)}</p></section>
    ${c.symbols && c.symbols.length ? `<section><h3>画面象征</h3><ul class="ci-sym">${c.symbols.map(s => `<li><b>${esc(s.name)}</b>${esc(s.meaning)}</li>`).join("")}</ul></section>` : ""}
    ${orient("upright", "正位")}
    ${orient("reversed", "逆位")}
    <p class="ci-note">牌义参考 A. E. Waite《The Pictorial Key to the Tarot》传统与金色黎明对应体系，仅供自我探索参考。</p>`;

  const page = document.createElement("div");
  page.className = "ci-page";
  const stage = document.querySelector(".stage"), hint = document.getElementById("hint");
  const col = document.createElement("div");
  col.className = "ci-col";
  stage.parentNode.insertBefore(page, stage);
  col.append(stage, hint);
  page.append(col, aside);
  document.body.classList.add("with-info");

  const show = document.createElement("button");
  show.className = "ci-show"; show.textContent = "说明";
  document.body.appendChild(show);
  const setHidden = h => { document.body.classList.toggle("info-hidden", h); try { localStorage.setItem("tarot.infoHidden", h ? "1" : ""); } catch {} };
  aside.querySelector(".ci-hide").onclick = () => setHidden(true);
  show.onclick = () => setHidden(false);
  try { if (localStorage.getItem("tarot.infoHidden")) setHidden(true); } catch {}
  addEventListener("keydown", e => {
    if (e.target.closest && e.target.closest("input,textarea")) return;
    if (e.key === "ArrowLeft") location.href = prev.stem + ".html" + location.search;
    if (e.key === "ArrowRight") location.href = next.stem + ".html" + location.search;
  });
})();
