Live2DCard.register("RWSa-T-17", () => {
  const { W, smooth } = Live2DCard;
  const BIG = [565, 335];
  // 大星上尖角与 XVII 底框相连：尖角附近权重归零（配合 keepRects 保留原图），避免补洞把黑框糊进天空
  const W_BIG = (x, y) => smooth(30, 75, Math.hypot(x - 565, y - 100));
  // s7 右侧星尖与树叶相连：右侧权重归零（配合 keepRects 保留原图），避免树叶被补成灰色拖影
  const W_S7 = (x, y) => 1 - smooth(815, 845, x);
  // 七颗小星：中心、外径、相位
  const STARS = [
    { name: "s1", c: [185, 168], R: 102, ph: 0.0 },
    { name: "s2", c: [185, 395], R: 102, ph: 2.1 },
    { name: "s3", c: [300, 605], R: 92,  ph: 4.4 },
    { name: "s4", c: [185, 795], R: 102, ph: 1.3 },
    { name: "s5", c: [912, 172], R: 95,  ph: 3.3 },
    { name: "s6", c: [912, 396], R: 102, ph: 5.2 },
    { name: "s7", c: [790, 600], R: 90,  ph: 0.7 },
  ];
  // 八角星轮廓（外径 R+margin，内径留足余量，背后天空由色键去除）
  const starPoly = ([cx, cy], R, maxY = 1e9, maxX = 1e9) => Array.from({ length: 16 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 8, r = i % 2 ? R * .8 : R + 26;
    return [Math.min(maxX, cx + Math.cos(a) * r), Math.min(maxY, cy + Math.sin(a) * r)];
  });
  const pulse = s => e => e.amp * .028 * Math.sin(e.t * 1.6 + s.ph) * (.7 + .3 * e.n(e.t * .3 + s.ph));
  const nod = t => { const p = t % 5.3; return p < .9 ? Math.sin(p / .9 * Math.PI * 2) * Math.sin(p / .9 * Math.PI) : 0; };

  // 两股水流：中心线（壶口 → 落水点）
  const STREAM_L = [[292, 1205], [294, 1438]], STREAM_R = [[910, 928], [914, 1466]];

  return ({
    title: "XVII 星星 The Star",
    key: { colors: [[119, 198, 219], [146, 204, 224]] },
    keepRects: [
      { rect: [320, 962, 890, 980] },
      { rect: [515, 75, 615, 125] },                              // 大星上尖角 + XVII 底框
      { rect: [818, 560, 900, 725], except: ["bird", "fig"] },    // s7 右侧星尖 + 树叶
    ],
    springs: {
      head:  { k: 9,  c: 4.5, target: e => e.amp * .018 * e.n(e.t * .23 + 1) + .012 * e.mx },
      hair:  { k: 30, c: 2.5, force: e => e.amp * (e.wind * 2.2 * e.n(e.t * 1.1 + 3) - 6 * e.s.head.v) },
      bird:  { k: 40, c: 6,   target: e => e.amp * .12 * nod(e.t) },
      wing:  { k: 55, c: 3,   force: e => e.amp * e.wind * 4 * e.n(e.t * 2.4 + 6) },
    },
    layers: [
      { name: "big", key: true, blur: .8, step: 14,
        poly: [[565,93],[625,175],[760,135],[700,260],[855,330],[700,400],[760,545],[625,480],[565,630],[505,480],[352,522],[432,410],[260,308],[425,260],[370,135],[505,175]],
        bones: [
          { scale: BIG, w: W_BIG, sx: e => e.amp * .018 * Math.sin(e.t * 1.1), sy: e => e.amp * .018 * Math.sin(e.t * 1.1) },
          { rot: BIG, w: W_BIG, a: e => e.amp * .012 * e.n(e.t * .17) },
        ] },
      ...STARS.map(s => ({
        name: s.name, key: true, blur: .8, step: 12, minus: s.name === "s3" ? ["big", "fig"] : s.name === "s7" ? ["big", "fig", "bird"] : ["big"],
        minusCircles: s.name === "s7" ? [[935, 650, 75]] : [],
        poly: starPoly(s.c, s.R, s.name === "s4" ? 912 : 1e9),
        bones: [
          { scale: s.c, w: s.name === "s7" ? W_S7 : W.one, sx: pulse(s), sy: pulse(s) },
          { rot: s.c, w: s.name === "s7" ? W_S7 : W.one, a: e => e.amp * .025 * e.n(e.t * .2 + s.ph) },
        ],
      })),
      { name: "fig", key: true, blur: 1, step: 10,
        poly: [[330,712],[340,676],[356,656],[382,640],[410,630],[440,630],[472,640],[520,650],[560,646],[598,640],[630,636],[662,644],[722,656],[785,668],[822,676],[852,692],[876,740],[872,965],[330,965],[350,900],[372,860],[376,800],[336,762]],
        bones: [
          { wave: 1, w: W.mul(W.ell(465, 655, 105, 30, .5), W.bandX(380, 430)), ph: (x, y, e) => e.t * 1.8 - x * .03, ax: e => e.s.hair.x * .6, ay: e => (.6 + .8 * e.wind) * e.amp },
          { rot: [470, 770], w: W.ell(415, 705, 105, 95, .45), a: e => e.s.head.x },
          { scale: [570, 905], w: W.ell(565, 805, 175, 105, .5), sx: e => .004 * e.breath * e.amp, sy: e => .009 * e.breath * e.amp },
        ] },
      { name: "bird", key: true, blur: .8, step: 6,
        poly: [[848,540],[866,506],[892,494],[910,502],[918,514],[950,498],[990,502],[988,536],[962,560],[948,586],[924,598],[894,598],[884,574],[888,552],[872,548]],
        bones: [
          { rot: [930, 548], w: W.ell(962, 520, 34, 28, .5), a: e => e.s.wing.x * .6 },
          { rot: [902, 548], w: W.ell(875, 518, 36, 30, .5), a: e => e.s.bird.x },
        ] },
      { name: "streamL", blur: .6, step: 6, noHole: true,
        poly: [[272,1203],[313,1203],[322,1300],[322,1442],[264,1442],[266,1300]],
        bones: [
          { wave: 1, w: W.mul(W.cap(...STREAM_L[0], ...STREAM_L[1], 9, 21), W.bandY(1208, 1265), W.bandY(1436, 1395)),
            ph: (x, y, e) => e.t * 7 - y * .05, ax: e => .9 * e.amp, ay: e => 2 * e.amp },
        ] },
      { name: "streamR", blur: .6, step: 6, noHole: true,
        poly: [[896,924],[926,924],[936,1100],[938,1470],[897,1470],[894,1100]],
        bones: [
          { wave: 1, w: W.mul(W.cap(...STREAM_R[0], ...STREAM_R[1], 7, 16), W.bandY(930, 990), W.bandY(1466, 1425)),
            ph: (x, y, e) => e.t * 7 - y * .05, ax: e => .7 * e.amp, ay: e => 2 * e.amp },
        ] },
    ],
    glows: [
      { x: BIG[0], y: BIG[1], r0: 40, r1: e => 300 + 30 * Math.sin(e.t * 1.1), a: e => .14 + .08 * (.5 + .5 * Math.sin(e.t * 1.1)), color: [255, 245, 170] },
      ...STARS.map(s => ({ x: s.c[0], y: s.c[1], r1: e => 95 + 15 * Math.sin(e.t * 1.6 + s.ph), color: [235, 245, 255], a: e => .1 + .1 * (.5 + .5 * Math.sin(e.t * 1.6 + s.ph)) })),
    ],
    motes: { n: 32, rect: [58, 40, 1028, 900], speed: [3, 9], dir: -1, color: [240, 248, 255] },
    fx(g, e) {
      g.save(); g.globalCompositeOperation = "lighter";
      // 星芒十字
      const flare = (x, y, L, a) => {
        if (a <= .01) return;
        for (const [dx, dy, l] of [[1, 0, L], [0, 1, L], [.707, .707, L * .45], [.707, -.707, L * .45]]) {
          const gr = g.createLinearGradient(x - dx * l, y - dy * l, x + dx * l, y + dy * l);
          gr.addColorStop(0, "rgba(255,255,240,0)"); gr.addColorStop(.5, `rgba(255,255,240,${a})`); gr.addColorStop(1, "rgba(255,255,240,0)");
          g.strokeStyle = gr; g.lineWidth = 2; g.beginPath(); g.moveTo(x - dx * l, y - dy * l); g.lineTo(x + dx * l, y + dy * l); g.stroke();
        }
      };
      flare(BIG[0], BIG[1], 150 + 30 * Math.sin(e.t * 1.1), .35 + .2 * Math.sin(e.t * 1.1));
      for (const s of STARS) { const k = Math.max(0, Math.sin(e.t * .9 + s.ph * 1.7)); flare(s.c[0], s.c[1], 40 + 50 * k, .55 * k * k); }
      // 水流高光：沿流向下落的亮条
      const streak = ([[x0, y0], [x1, y1]], off, n) => {
        const L = y1 - y0;
        for (let i = 0; i < n; i++) {
          const u = ((e.t * .9 + i / n + off) % 1), y = y0 + 10 + u * (L - 30), x = x0 + (x1 - x0) * (y - y0) / L + Math.sin(i * 2.3) * 5;
          g.fillStyle = `rgba(230,250,255,${.28 * Math.sin(u * Math.PI)})`;
          g.beginPath(); g.ellipse(x, y, 1.6, 9, 0, 0, 7); g.fill();
        }
      };
      streak(STREAM_L, 0, 6); streak(STREAM_R, .37, 7);
      // 落水点涟漪
      const ripples = ([x, y], rMax, n, sp) => {
        for (let i = 0; i < n; i++) {
          const u = (e.t * sp + i / n) % 1, r = 8 + u * rMax;
          g.strokeStyle = `rgba(225,245,255,${.35 * (1 - u)})`; g.lineWidth = 2;
          g.beginPath(); g.ellipse(x, y, r, r * .32, 0, 0, 7); g.stroke();
        }
      };
      ripples(STREAM_L[1], 120, 3, .28); ripples(STREAM_R[1], 45, 2, .4);
      // 零星水滴
      for (const [[, [x, y]], k] of [[STREAM_L, 0], [STREAM_R, 1]]) for (let i = 0; i < 4; i++) {
        const u = (e.t * 1.3 + i * .25 + k * .13) % 1, dir = (i % 2 ? 1 : -1) * (14 + 9 * i);
        g.fillStyle = `rgba(235,250,255,${.6 * (1 - u)})`;
        g.beginPath(); g.arc(x + dir * u, y - 4 - 70 * u * (1 - u) * (k ? .5 : 1), 2.2, 0, 7); g.fill();
      }
      g.restore();
    },
  });
});
