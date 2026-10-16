Live2DCard.register("RWSa-T-01", () => {
  const { W } = Live2DCard;
  const SHOULDER = [355, 590], TIP = [194, 92], INF = [497, 370];
  const armW = W.mul(W.cap(335, 580, 195, 95, 65, 105), W.bandY(640, 540));
  const sleeveW = W.mul(W.ell(805, 925, 115, 135, .45), W.bandY(1060, 1000));

  return ({
    title: "I 魔术师 The Magician",
    key: { colors: [[244, 228, 84], [246, 232, 120], [241, 223, 120]] },
    keepRects: [
      { rect: [270, 1062, 600, 1069] },
      { rect: [575, 1062, 602, 1375] },
      { rect: [590, 1375, 800, 1382] },
      { rect: [58, 1333, 300, 1340] },
      { rect: [300, 1340, 307, 1645] },
      { rect: [738, 1382, 745, 1645] },
    ],
    springs: {
      arm:    { k: 9,  c: 4.5, target: e => e.amp * (.018 * e.n(e.t * .32 + 1) + .012 * e.breath) - .01 * e.my },
      head:   { k: 10, c: 5,   target: e => e.amp * .03 * e.n(e.t * .27 + 2) + .04 * e.mx },
      sleeve: { k: 14, c: 3,   force: e => e.amp * (e.wind * .25 * e.n(e.t * .8 + 3)) },
      vineL:  { k: 8,  c: 1.2, force: e => e.amp * e.wind * .12 * e.n(e.t * .9 + 5) },
      vineR:  { k: 7,  c: 1.1, force: e => e.amp * e.wind * .12 * e.n(e.t * .8 + 9) },
      roseL:  { k: 40, c: 2.2, force: e => e.amp * e.wind * 2.2 * e.n(e.t * 2.1 + 3) },
      roseR:  { k: 40, c: 2.2, force: e => e.amp * e.wind * 2.2 * e.n(e.t * 1.9 + 6) },
    },
    layers: [
      // 上方垂下的花藤（左右两组）
      { name: "vineL", key: true, minus: ["fig"],
        poly: [[58,40],[470,40],[470,210],[262,210],[228,195],[150,200],[150,490],[58,490]],
        bones: [
          { wave: 1, w: W.mul(W.bandY(45, 120), W.bandX(130, 170)), ph: (x, y, e) => e.t * 1.8 - x * .012, ax: e => (1 + 2 * e.wind) * e.amp, ay: e => (1 + 2 * e.wind) * e.amp },
          { rot: [95, 40], w: W.mul(W.bandY(90, 420), W.bandX(175, 140)), a: e => e.s.vineL.x },
        ] },
      { name: "vineR", key: true,
        poly: [[590,40],[1028,40],[1028,700],[870,700],[870,185],[590,175]],
        bones: [
          { wave: 1, w: W.mul(W.bandY(45, 120), W.bandX(900, 860)), ph: (x, y, e) => e.t * 1.7 + x * .012, ax: e => (1 + 2 * e.wind) * e.amp, ay: e => (1 + 2 * e.wind) * e.amp },
          { rot: [955, 40], w: W.mul(W.bandY(120, 640), W.bandX(860, 905)), a: e => e.s.vineR.x },
        ] },
      // 头顶 ∞
      { name: "inf", key: true, poly: [[390,325],[605,325],[605,411],[390,411]],
        bones: [
          { scale: INF, w: W.one, sx: e => e.amp * .02 * Math.sin(e.t * 1.1), sy: e => e.amp * .02 * Math.sin(e.t * 1.1) },
          { move: 1, w: W.one, dy: e => e.amp * 2 * Math.sin(e.t * .9) },
        ] },
      // 魔术师本体（含魔杖、右侧袍边下延至花丛）
      { name: "fig", key: true, minus: ["flL", "flR"],
        poly: [[172,88],[216,84],[228,200],[265,212],[278,280],[302,340],[340,420],[380,500],[410,520],[418,460],[428,418],[462,413],[530,413],[572,440],[588,520],[605,590],[650,630],[720,740],[785,800],[845,868],[882,940],[898,1035],[800,1040],[792,1375],[590,1375],[590,1062],[270,1062],[285,830],[288,700],[270,565],[250,470],[230,405],[183,405],[176,292],[158,290],[156,218],[176,205]],
        bones: [
          { rot: [490, 600], w: W.ell(490, 495, 85, 105), a: e => e.s.head.x },
          { rot: [720, 790], w: sleeveW, a: e => e.s.sleeve.x },
          { wave: 1, w: W.mul(W.bandX(705, 755), W.bandY(1000, 1090), W.bandY(1370, 1270)), ph: (x, y, e) => e.t * 1.6 - y * .015, ax: e => (1.5 + 3 * e.wind) * e.amp, ay: () => 0 },
          { rot: SHOULDER, w: armW, a: e => e.s.arm.x },
          { scale: [500, 1060], w: W.mul(W.ell(500, 790, 170, 210, .6), W.bandY(1000, 900)), sx: e => .003 * e.breath * e.amp, sy: e => .006 * e.breath * e.amp },
        ] },
      // 前景花丛（左：百合+玫瑰；右：玫瑰丛）
      { name: "flL", key: true, poly: [[62,1342],[232,1342],[236,1452],[300,1452],[300,1645],[62,1645]],
        bones: [
          { rot: [245, 1600], w: W.ell(242, 1530, 48, 48), a: e => e.s.roseL.x },
          { wave: 1, w: W.mul(W.bandY(1630, 1440), W.bandY(1350, 1420), W.bandX(300, 255)), ph: (x, y, e) => e.t * 2 - x * .01 - y * .006, ax: e => (1.5 + 3.5 * e.wind) * e.amp, ay: e => (.5 + 1 * e.wind) * e.amp },
        ] },
      { name: "flR", key: true, poly: [[745,1365],[1028,1365],[1028,1645],[745,1645]],
        bones: [
          { rot: [860, 1530], w: W.ell(852, 1412, 60, 52), a: e => e.s.roseR.x },
          { rot: [1000, 1560], w: W.ell(998, 1498, 32, 32), a: e => -e.s.roseL.x },
          { wave: 1, w: W.mul(W.bandY(1630, 1440), W.bandX(745, 800)), ph: (x, y, e) => e.t * 1.9 + x * .01 - y * .006, ax: e => (1.5 + 3.5 * e.wind) * e.amp, ay: e => (.5 + 1 * e.wind) * e.amp },
        ] },
    ],
    glows: [
      { x: INF[0], y: INF[1], r0: 20, r1: e => 150 + 20 * Math.sin(e.t * 1.1), color: [255, 250, 210], a: e => .2 + .14 * Math.sin(e.t * 1.1) },
    ],
    // 魔杖尖端光晕：跟随手臂旋转
    fx: (g, e) => {
      const a = e.s.arm.x, dx = TIP[0] - SHOULDER[0], dy = TIP[1] - SHOULDER[1];
      const x = SHOULDER[0] + dx * Math.cos(a) - dy * Math.sin(a), y = SHOULDER[1] + dx * Math.sin(a) + dy * Math.cos(a);
      const f = .5 + .5 * Math.sin(e.t * 3.1) * (.6 + .4 * e.n(e.t * 1.7));
      const r = 46 + 22 * f, gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(255,255,235,${.35 + .4 * f})`); gr.addColorStop(1, "rgba(255,250,220,0)");
      g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
      g.globalCompositeOperation = "source-over";
    },
    motes: { n: 30, rect: [58, 40, 1028, 1330] },
  });
});
