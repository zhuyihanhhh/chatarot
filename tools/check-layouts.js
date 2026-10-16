// 在 /app/ 页面注入：逐个牌阵布局，检查牌面与标签是否互相遮挡（横置交叉牌除外）
window.checkLayouts = async () => {
  const { S, showTable, Draw } = window.__tarot, out = [];
  const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  for (const sp of S.spreads) {
    showTable({ id: "chk", time: Date.now(), spreadId: sp.id, question: "", cards: Draw.shuffleDeck(S.deck, true).slice(0, sp.positions.length), turns: [], messages: null });
    await new Promise(r => setTimeout(r, 60));
    const slots = [...document.querySelectorAll(".slot")];
    const boxes = slots.map(el => ({ card: el.querySelector(".pcard").getBoundingClientRect(), label: el.querySelector(".slot-label").getBoundingClientRect(), rot: el.classList.contains("rot") }));
    const table = document.querySelector("#table").getBoundingClientRect();
    const bad = [];
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (b.card.left < table.left - 1 || b.card.right > table.right + 1 || b.label.bottom > table.bottom + 2) bad.push(`${i + 1}出界`);
      for (let j = 0; j < boxes.length; j++) {
        if (i === j || b.rot || boxes[j].rot) continue;
        if (j > i && inter(b.card, boxes[j].card) > 4) bad.push(`${i + 1}与${j + 1}牌重叠`);
        if (inter(b.label, boxes[j].card) > 30) bad.push(`${i + 1}标签压${j + 1}`);
      }
    }
    out.push(`${sp.id}(${sp.positions.length}) ch=${Math.round(boxes[0].card.height)} ${bad.length ? "BAD " + bad.join(",") : "ok"}`);
  }
  return out.join("\n");
};
