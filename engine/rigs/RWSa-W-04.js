Live2DCard.register("RWSa-W-04", () => {
  const { W } = Live2DCard;
  // 花环中段下垂部分：两端挂在权杖上，靠近权杖处权重归零
  const W_GAR = W.mul(W.bandX(372, 450), W.bandX(690, 610), W.bandY(430, 560));

  return ({
    title: "权杖四 Four of Wands",
    key: { colors: [[244, 231, 107], [240, 224, 103], [241, 228, 102], [246, 235, 108], [242, 228, 142], [236, 222, 135]] },
    keepRects: [
      { rect: [325, 380, 375, 710] },
      { rect: [690, 380, 740, 710] },
      { rect: [150, 370, 172, 430] },
    ],
    springs: {
      gar: { k: 8, c: 1.4, force: e => e.amp * e.wind * 18 * e.n(e.t * .6 + 1) },
      rib: { k: 20, c: 1.6, force: e => e.amp * e.wind * 1.6 * e.n(e.t * 1.3 + 4) },
      wl:  { k: 14, c: 4, target: e => e.amp * .035 * Math.sin(e.t * 1.7) },
      wr:  { k: 14, c: 4, target: e => e.amp * .035 * Math.sin(e.t * 1.7 + 2.2) },
    },
    layers: [
      { name: "garland", key: true, blur: 1, step: 10,
        poly: [[338,390],[728,390],[728,700],[338,700]],
        bones: [
          { wave: 1, w: W_GAR, ph: (x, y, e) => e.t * 1.4 - x * .01, ax: e => .8 * e.amp, ay: e => .8 * e.amp },
          { move: 1, w: W_GAR, dx: e => e.s.gar.x * .25, dy: e => Math.abs(e.s.gar.x) * .06 },
        ] },
      { name: "ribbon", key: true, blur: .8, step: 6,
        poly: [[108,375],[168,375],[168,530],[108,530]],
        bones: [
          { rot: [160, 385], w: W.mul(W.bandY(392, 440), W.bandX(167, 150)), a: e => e.s.rib.x * .06 },
        ] },
      // 举花束的两人：背景为城墙+天空，轮廓内局部形变，边缘权重为 0
      { name: "people", noHole: true, blur: .8, step: 8,
        poly: [[365,990],[715,990],[715,1340],[365,1340]],
        bones: [
          { rot: [445, 1150], w: W.ell(440, 1075, 55, 70, .5), a: e => e.s.wl.x },
          { rot: [615, 1150], w: W.ell(615, 1075, 60, 72, .5), a: e => e.s.wr.x },
          { scale: [475, 1330], w: W.ell(475, 1210, 70, 90, .5), sy: e => .006 * e.amp * Math.sin(e.t * 1.4) },
          { scale: [605, 1330], w: W.ell(605, 1210, 60, 90, .5), sy: e => .006 * e.amp * Math.sin(e.t * 1.4 + 1.8) },
        ] },
    ],
    glows: [
      { x: 530, y: 520, r0: 40, r1: e => 330 + 25 * Math.sin(e.t * .9), color: [255, 210, 130], a: e => .16 + .07 * Math.sin(e.t * .9) },
      { x: 530, y: 1150, r1: e => 220 + 20 * Math.sin(e.t * 1.2 + 1), color: [255, 225, 160], a: e => .12 + .05 * Math.sin(e.t * 1.2 + 1) },
    ],
    motes: { n: 40, rect: [58, 40, 1028, 1500], speed: [2, 7], dir: -1, color: [255, 220, 150] },
  });
});
