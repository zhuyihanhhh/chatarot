Live2DCard.register("RWSa-T-14", () => {
  const { W, smooth } = Live2DCard;
  const EYE = [510, 205], CROWN = [205, 1010], FOOT = [485, 1528];
  // 水流中心线：上杯口 → 下杯口；两端权重为 0
  const SA = [640, 632], SB = [495, 765];
  const streamW = (x, y) => {
    const dx = SB[0] - SA[0], dy = SB[1] - SA[1], L2 = dx * dx + dy * dy;
    const t = ((x - SA[0]) * dx + (y - SA[1]) * dy) / L2;
    return smooth(.05, .3, t) * smooth(.95, .7, t);
  };
  // 鸢尾花：noHole 局部形变层，边缘权重为 0
  const IRIS = [
    { name: "iris1", c: [862, 985], r: [78, 72], piv: [870, 1080], ph: 0 },
    { name: "iris2", c: [745, 1172], r: [68, 62], piv: [760, 1250], ph: 2.3 },
  ];
  const ellPoly = ([cx, cy], [rx, ry]) => Array.from({ length: 20 }, (_, i) => [cx + Math.cos(i * Math.PI / 10) * rx, cy + Math.sin(i * Math.PI / 10) * ry]);
  const flap = e => e.amp * (.022 * Math.sin(e.t * .75) + .006 * e.n(e.t * .3 + 5));

  return ({
    title: "XIV 节制 Temperance",
    key: { colors: [[204, 192, 192], [192, 180, 180], [216, 204, 204], [204, 192, 180], [228, 222, 220]] },
    keepRects: [
      { rect: [40, 140, 78, 900] },     // 左翼贴左框
      { rect: [1008, 140, 1046, 900] }, // 右翼贴右框
    ],
    springs: {
      head: { k: 9, c: 4.5, target: e => e.amp * .012 * e.n(e.t * .21 + 1) + .01 * e.mx },
      iris: { k: 35, c: 2.4, force: e => e.amp * e.wind * 3 * e.n(e.t * 1.6 + 2) },
    },
    layers: [
      { name: "wingL", key: true, blur: 1, step: 12,
        poly: [[44,300],[100,240],[150,200],[200,174],[248,180],[278,215],[302,260],[322,305],[336,350],[338,400],[310,460],[292,540],[292,620],[284,700],[298,760],[292,830],[250,862],[200,866],[140,868],[90,880],[44,880]],
        bones: [
          { rot: [345, 390], w: W.mul(W.bandX(292, 220), W.bandX(58, 105)), a: e => -flap(e) },
        ] },
      { name: "wingR", key: true, blur: 1, step: 12,
        poly: [[706,330],[740,262],[790,196],[842,176],[900,196],[960,246],[1000,296],[1042,330],[1042,890],[990,890],[950,862],[900,806],[852,744],[808,724],[796,650],[804,592],[786,520],[762,452],[724,392]],
        bones: [
          { rot: [730, 385], w: W.mul(W.bandX(800, 872), W.bandX(1028, 982)), a: e => flap(e) },
        ] },
      { name: "torso", noHole: true, blur: 1, step: 14,
        poly: [[350,130],[700,130],[740,330],[770,520],[760,900],[350,900],[330,520],[340,330]],
        bones: [
          { rot: [530, 330], w: W.ell(515, 240, 95, 105, .5), a: e => e.s.head.x },
          { scale: [545, 720], w: W.ell(545, 470, 160, 190, .5), sx: e => .004 * e.breath * e.amp, sy: e => .009 * e.breath * e.amp },
        ] },
      { name: "stream", noHole: true, blur: .6, step: 6,
        poly: [[655,612],[600,622],[558,644],[522,674],[498,714],[478,760],[500,784],[524,772],[538,736],[558,702],[588,674],[622,658],[660,652]],
        bones: [
          { wave: 1, w: streamW, ph: (x, y, e) => e.t * 6 - ((SA[0] - x) * .7 + (y - SA[1]) * .7) * .06, ax: e => 1.4 * e.amp, ay: e => 1.4 * e.amp },
        ] },
      ...IRIS.map(f => ({
        name: f.name, noHole: true, blur: 1, step: 8,
        poly: ellPoly(f.c, f.r),
        bones: [
          { rot: f.piv, w: W.ell(f.c[0], f.c[1], f.r[0] * .78, f.r[1] * .78, .5), a: e => e.s.iris.x + e.amp * .03 * Math.sin(e.t * 1.3 + f.ph) },
        ],
      })),
    ],
    glows: [
      { x: EYE[0], y: EYE[1], r0: 4, r1: e => 42 + 6 * Math.sin(e.t * 1.7), color: [255, 250, 210], a: e => .3 + .2 * (.5 + .5 * Math.sin(e.t * 1.7)) },
      { x: 515, y: 240, r0: 60, r1: 200, color: [255, 245, 200], a: e => .08 + .05 * Math.sin(e.t * 1.1) },
      { x: CROWN[0], y: CROWN[1], r0: 40, r1: e => 170 + 20 * Math.sin(e.t * .9), color: [255, 240, 150], a: e => .2 + .1 * (.5 + .5 * Math.sin(e.t * .9)) },
    ],
    motes: { n: 22, rect: [58, 40, 1028, 1400], speed: [3, 8], color: [255, 250, 230] },
    fx(g, e) {
      g.save(); g.globalCompositeOperation = "lighter";
      // 水流高光：沿流向移动的亮点
      for (let i = 0; i < 6; i++) {
        const u = (e.t * .7 + i / 6) % 1, k = .1 + u * .8;
        const x = SA[0] + (SB[0] - SA[0]) * k, y = SA[1] + (SB[1] - SA[1]) * k + Math.sin(u * 14) * 4;
        g.fillStyle = `rgba(230,250,255,${.35 * Math.sin(u * Math.PI)})`;
        g.beginPath(); g.ellipse(x, y, 2, 5, -.8, 0, 7); g.fill();
      }
      // 脚边涟漪
      for (let i = 0; i < 3; i++) {
        const u = (e.t * .22 + i / 3) % 1, r = 18 + u * 110;
        g.strokeStyle = `rgba(225,245,255,${.35 * (1 - u)})`; g.lineWidth = 2;
        g.beginPath(); g.ellipse(FOOT[0], FOOT[1], r, r * .25, 0, 0, 7); g.stroke();
      }
      g.restore();
    },
  });
});
