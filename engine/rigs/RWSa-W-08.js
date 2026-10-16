Live2DCard.register("RWSa-W-08", () => {
  const { W, smooth } = Live2DCard;
  // 飞行方向（沿权杖斜向下）
  const DIR = [.928, .372];
  // 七根在天空中的权杖：轴线在 x=90 处的中心 c、斜率 k、杖尖 x、相位。第 8 根穿过山丘，保持静止
  const WANDS = [
    { c: 222,  k: .398, tx: 930, ph: 0.0 },
    { c: 357,  k: .402, tx: 975, ph: 1.7 },
    { c: 470,  k: .400, tx: 900, ph: 3.1 },
    { c: 617,  k: .420, tx: 505, ph: 4.6 },
    { c: 868,  k: .375, tx: 860, ph: 0.9 },
    { c: 966,  k: .385, tx: 940, ph: 2.5 },
    { c: 1240, k: .390, tx: 920, ph: 5.3 },
  ].map(w => ({ ...w, y0: w.c - w.k * 30, tip: [w.tx, w.c + w.k * (w.tx - 90)] }));
  const X0 = 60, XR = 1008;
  // 相邻权杖之间的分界折线（全部走在天空里，绕开嫩叶）
  const G = [
    [[X0, 170], [400, 240], [XR, 478]],
    [[X0, 279], [500, 455], [520, 485], [590, 488], [600, 515], [680, 545], [850, 594], [XR, 652]],
    [[X0, 402], [290, 488], [345, 496], [500, 577], [700, 640], [780, 708], [850, 736], [XR, 783]],
    [[X0, 552], [250, 600], [470, 715], [615, 745]],
    [[X0, 730], [440, 860], [615, 880], [900, 960], [XR, 995]],
    [[X0, 905], [400, 1050], [460, 1075], [650, 1150], [700, 1168], [860, 1220], [XR, 1280]],
    [[X0, 1088], [500, 1260], [XR, 1450]],
    [[X0, 1304], [500, 1482], [700, 1540], [800, 1572], [860, 1584], [XR, 1584]],
  ];
  const rev = a => a.slice().reverse();
  const POLYS = [
    [...G[0], ...rev(G[1])],
    [...G[1], ...rev(G[2])],
    [...G[2], [XR, 995], ...rev(G[4]).filter(p => p[0] > 615), [615, 745], ...rev(G[3]).slice(1)],
    [...G[3], ...rev(G[4]).filter(p => p[0] <= 615)],
    [...G[4], ...rev(G[5])],
    [...G[5], ...rev(G[6])],
    [...G[6], ...rev(G[7])],
  ];
  // 左端贴边框、w2 嫩叶贴右边框：两侧权重从 0 渐入
  const EDGE = W.mul(W.bandX(X0, 150), (x, y) => 1 - smooth(960, 1000, x));
  const slide = w => e => e.amp * 4 * (Math.sin(e.t * 1.3 + w.ph) * .75 + .25 * e.n(e.t * .5 + w.ph));

  return ({
    title: "权杖八 Eight of Wands",
    key: { colors: [[142, 211, 231], [190, 222, 238], [140, 210, 231], [164, 210, 230], [129, 204, 225], [157, 218, 236], [166, 210, 229], [159, 207, 227]] },
    keepRects: [...WANDS.map(w => ({ rect: [40, w.y0 - 40, 80, w.y0 + 40] })), { rect: [985, 640, 1030, 760] }],
    layers: WANDS.map((w, i) => {
      const [tx, ty] = w.tip;
      // 杖身（端点到杖尖）之外的部分 = 嫩叶
      const leaf = W.mul((x, y) => 1 - W.cap(X0, w.y0, tx, ty, 20, 32)(x, y), EDGE);
      return {
        name: "w" + (i + 1), key: true, blur: .8, step: 10,
        poly: POLYS[i],
        bones: [
          { wave: 1, w: leaf, ph: (x, y, e) => e.t * 5.5 + x * .05 + y * .03 + w.ph, ax: e => (.8 + .8 * e.wind) * e.amp, ay: e => (.8 + .8 * e.wind) * e.amp },
          { move: 1, w: EDGE, dx: e => slide(w)(e) * DIR[0], dy: e => slide(w)(e) * DIR[1] },
        ],
      };
    }),
    glows: [{ x: 700, y: 700, r0: 80, r1: 520, color: [255, 245, 215], a: e => .06 + .03 * Math.sin(e.t * .7) }],
    motes: { n: 18, rect: [58, 40, 1028, 1500] },
    fx(g, e) {
      // 沿飞行方向的淡速度线
      g.save(); g.lineCap = "round";
      for (let i = 0; i < 14; i++) {
        const u = (e.t * .35 + i * .618) % 1, L = 90 + 60 * ((i * 37) % 5) / 5;
        const bx = 80 + ((i * 263) % 760) + u * 260, by = 120 + ((i * 397) % 1300) + u * 260 * DIR[1] / DIR[0];
        const a = .3 * Math.sin(u * Math.PI);
        const gr = g.createLinearGradient(bx - DIR[0] * L, by - DIR[1] * L, bx, by);
        gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(255,255,255,${a})`);
        g.strokeStyle = gr; g.lineWidth = 2;
        g.beginPath(); g.moveTo(bx - DIR[0] * L, by - DIR[1] * L); g.lineTo(bx, by); g.stroke();
      }
      g.restore();
    },
  });
});
