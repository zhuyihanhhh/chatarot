Live2DCard.register("RWSa-W-J1", () => {
  const { W } = Live2DCard;
  // 帽上羽饰：根部（帽顶）权重为 0，越往尖端越大
  const plume = W.mul(W.cap(445, 185, 455, 290, 10, 32), W.bandY(298, 240));
  // 头部（含帽子、羽饰）
  const head = W.max(W.ell(410, 320, 135, 130, .5), plume);
  // 权杖顶端：截断线 y≈445 处权重为 0
  const staffTop = W.bandY(432, 330);
  const leaves = W.mul(W.ell(740, 205, 70, 70, .5), W.bandY(300, 230));

  return ({
    title: "权杖侍从 Page of Wands",
    key: { colors: [[195,221,229],[187,220,233],[199,225,233],[201,221,227],[165,211,229],[183,216,229],[207,227,232],[174,213,227],[177,213,227]], lo: 28, hi: 52 },
    keepRects: [
      { rect: [735, 432, 885, 458] },    // 权杖截断线
      { rect: [285, 1084, 875, 1110] },  // 人物下截断线
    ],
    springs: {
      head:   { k: 9,  c: 4.5, target: e => e.amp * .022 * e.n(e.t * .25 + 1) + .015 * e.mx - .01 * e.my },
      plume:  { k: 45, c: 2.6, force: e => e.amp * (e.wind * 3 * e.n(e.t * 1.6 + 2) - 4 * e.s.head.a) },
      staff:  { k: 14, c: 3,   force: e => e.amp * e.wind * .05 * e.n(e.t * .7 + 5) },
    },
    layers: [
      { name: "staff", key: true, blur: .8, step: 8,
        poly: [[690,150],[880,150],[880,445],[700,445],[690,300]],
        bones: [
          { wave: 1, w: leaves, ph: (x, y, e) => e.t * 2.4 - y * .04 - x * .02, ax: e => (1 + 2 * e.wind) * e.amp, ay: e => .6 * e.amp },
          { rot: [790, 720], w: staffTop, a: e => e.s.staff.x * .25 + e.amp * .004 * Math.sin(e.t * .9) },
        ] },
      { name: "fig", key: true, blur: 1, step: 10,
        poly: [[300,300],[330,240],[400,200],[410,150],[470,150],[490,260],[520,300],[560,400],[640,440],[740,448],[760,452],[840,452],[880,560],[860,700],[870,1100],[290,1100],[300,700],[330,560],[300,420],[260,330]],
        bones: [
          { wave: 1, w: plume, ph: (x, y, e) => e.t * 2.6 - y * .05, ax: e => (1.5 + 3 * e.wind) * e.amp + e.s.plume.x * 40, ay: e => .8 * e.amp },
          { rot: [470, 470], w: head, a: e => e.s.head.x },
          { scale: [530, 1000], w: W.mul(W.ell(520, 720, 210, 300, .6), W.bandY(1000, 880)), sx: e => .004 * e.breath * e.amp, sy: e => .008 * e.breath * e.amp },
        ] },
    ],
    glows: [
      { x: 950, y: 160, r0: 30, r1: e => 380 + 30 * Math.sin(e.t * .8), color: [255, 245, 200], a: e => .12 + .06 * Math.sin(e.t * .8) },
      { x: 760, y: 210, r1: 60, color: [255, 250, 210], a: e => .1 + .08 * Math.sin(e.t * 1.7) },
    ],
    motes: { n: 22, rect: [58, 1200, 1028, 1640], speed: [4, 10], color: [255, 230, 180] },
  });
});
