Live2DCard.register("RWSa-S-10", () => {
  // 黎明：约 14 秒一个周期，缓慢变亮再缓慢回落
  const dawn = e => { const k = .5 - .5 * Math.cos(e.t * 2 * Math.PI / 14); return k * k * (3 - 2 * k); };
  // 水面波光：位于剑身之间的空隙
  const GLINTS = [
    [95, 1200], [280, 1215], [420, 1190], [480, 1240], [560, 1205], [670, 1230], [690, 1300],
    [850, 1210], [960, 1250], [100, 1300], [280, 1320], [560, 1310], [950, 1330], [420, 1290],
  ];

  return ({
    title: "宝剑十 Ten of Swords",
    art: [58, 40, 1028, 1752],
    layers: [],
    glows: [
      { x: 540, y: 1010, r0: 80, r1: e => 420 + 80 * dawn(e), color: [255, 225, 140], a: e => .05 + .16 * dawn(e) },
      { x: 540, y: 1080, r0: 20, r1: e => 220 + 40 * dawn(e), color: [255, 240, 190], a: e => .03 + .1 * dawn(e) },
    ],
    fx(g, e) {
      g.save(); g.globalCompositeOperation = "lighter";
      GLINTS.forEach(([x, y], i) => {
        const k = Math.max(0, Math.sin(e.t * .9 + i * 2.17));
        const a = (.12 + .1 * dawn(e)) * k * k;
        if (a < .01) return;
        const dx = 3 * Math.sin(e.t * .5 + i), L = 8 + 6 * k;
        const gr = g.createLinearGradient(x + dx - L, y, x + dx + L, y);
        gr.addColorStop(0, "rgba(240,250,255,0)"); gr.addColorStop(.5, `rgba(240,250,255,${a})`); gr.addColorStop(1, "rgba(240,250,255,0)");
        g.fillStyle = gr; g.beginPath(); g.ellipse(x + dx, y, L, 1.5, 0, 0, 7); g.fill();
      });
      g.restore();
    },
  });
});
