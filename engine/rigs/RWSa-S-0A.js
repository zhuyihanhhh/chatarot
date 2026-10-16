Live2DCard.register("RWSa-S-0A", () => {
  const { W } = Live2DCard;
  // 散落的 Yod 中心
  const YODS = [[405, 770], [680, 780], [330, 880], [420, 850], [640, 885], [740, 890]];
  const box = ([x, y], r = 42) => [[x - r, y - r], [x + r, y - r], [x + r, y + r], [x - r, y + r]];
  const CROWN = [545, 160];
  // 手腕在 x≈200 处没入云中：截断线权重为 0
  const handW = W.bandX(300, 400);
  const lift = e => e.s.hand.x;
  // 枝叶：顶端挂在王冠上（跟随剑层），越往下摆动越大
  const sway = (ph0) => ({ wave: 1, w: W.bandY(150, 520),
    ph: (x, y, e) => e.t * 1.1 + ph0 - y * .006, ax: e => (2.5 + 3 * e.wind) * e.amp + 2 * e.s.leaf.x, ay: e => .3 * e.amp });

  return ({
    title: "宝剑一 Ace of Swords",
    key: { colors: [[218, 211, 208], [197, 190, 187], [180, 168, 164], [209, 198, 195], [188, 176, 172]], lo: 30, hi: 70 },
    keepRects: [{ rect: [180, 1070, 300, 1350] }],
    springs: {
      hand: { k: 3, c: 2.6, target: e => e.amp * (5 * e.n(e.t * .4) + 1.5 * e.breath) + 3 * e.my },
      tilt: { k: 6, c: 3.5, target: e => e.amp * .004 * e.n(e.t * .3 + 2) + .003 * e.mx },
      leaf: { k: 5, c: 1.5, force: e => -.6 * e.s.hand.v },
    },
    layers: [
      // 手 + 剑 + 王冠 + 白色放射光芒同层，色键抠出后一起漂浮
      { name: "sword", key: true, minus: ["leafL", "leafR", "yods"], blur: 1, step: 12,
        poly: [[400,62],[720,62],[720,270],[585,270],[585,960],[760,985],[760,1080],[810,1120],[810,1450],[390,1450],[300,1345],[200,1340],[200,1085],[330,1085],[330,985],[500,960],[500,270],[380,270],[380,80]],
        bones: [
          { rot: [205, 1210], w: handW, a: e => e.s.tilt.x },
          { move: 1, w: handW, dy: lift },
        ] },
      { name: "leafL", key: true, blur: 1, step: 8, follow: { layer: "sword", point: [400, 140] },
        poly: [[350,80],[430,80],[440,300],[420,500],[400,650],[340,650],[290,500],[300,300]],
        bones: [sway(0)] },
      { name: "leafR", key: true, blur: 1, step: 8, follow: { layer: "sword", point: [730, 110] },
        poly: [[700,50],[790,60],[810,300],[790,480],[780,690],[720,690],[700,500],[690,250]],
        bones: [sway(1.7)] },
      { name: "yods", key: true, blur: .6, step: 8,
        polys: YODS.map(d => box(d)),
        bones: [
          { wave: 1, w: W.one, ph: (x, y, e) => e.t * 1.2 + x * .05 + y * .031, ax: e => .8 * e.amp, ay: e => 2.4 * e.amp },
        ] },
    ],
    glows: [
      { x: CROWN[0], y: CROWN[1], r0: 30, r1: e => 220 + 25 * Math.sin(e.t * .9), color: [255, 232, 150], a: e => .14 + .07 * Math.sin(e.t * .9) },
      { x: CROWN[0], y: CROWN[1] - 20, r1: 90, color: [255, 252, 225], a: e => .12 + .08 * Math.sin(e.t * 1.6) },
    ],
    motes: { n: 16, rect: [58, 40, 1028, 1480], speed: [2, 6], dir: -1, color: [255, 245, 220] },
    fx(g, e) {
      // Yod 闪烁：随 Yod 层同一相位漂浮
      g.save(); g.globalCompositeOperation = "lighter";
      YODS.forEach(([x, y], i) => {
        const k = Math.max(0, Math.sin(e.t * 1.5 + i * 2.3)) ** 4, a = .45 * k;
        if (a < .01) return;
        const yy = y + 2.4 * e.amp * Math.sin(e.t * 1.2 + x * .05 + y * .031);
        const gr = g.createRadialGradient(x, yy, 0, x, yy, 34);
        gr.addColorStop(0, `rgba(255,248,200,${a})`); gr.addColorStop(1, "rgba(255,248,200,0)");
        g.fillStyle = gr; g.fillRect(x - 34, yy - 34, 68, 68);
      });
      g.restore();
    },
  });
});
