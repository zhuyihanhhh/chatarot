Live2DCard.register("RWSa-T-10", () => {
  const { W, smooth } = Live2DCard;
  // 轮心与外圈描边内缘半径（描边约 r 333..350）；转动圆盘切在描边内侧的橙色区
  const C = [531, 910], R_IN = 326;
  const circle = ([cx, cy], r, n = 72) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * 2 * Math.PI) * r, cy + Math.sin(i / n * 2 * Math.PI) * r]);
  // 远离轮盘外圈描边：距轮心 < 385 时权重归零
  const OFF_WHEEL = (x, y) => smooth(360, 390, Math.hypot(x - C[0], y - C[1]));
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  // 浮动部件：整块不抠图、权重向轮廓外渐变到 0 的局部网格形变层（背景随之轻移，边缘无缝）
  const floatLayer = (name, poly, w, ph, ax, ay) => ({
    name, noHole: true, blur: 0, step: 14, poly, minusCircles: [[C[0], C[1], 352]],
    bones: [{ move: 1, w, dx: e => e.amp * ax * e.n(e.t * .23 + ph), dy: e => e.amp * ay * Math.sin(e.t * .7 + ph) }],
  });

  return ({
    title: "X 命运之轮 Wheel of Fortune",
    springs: {
      sphinx: { k: 8, c: 4, target: e => e.amp * 2.5 * Math.sin(e.t * .8) },
    },
    layers: [
      { name: "wheel", noHole: true, blur: .8, step: 16, poly: circle(C, R_IN),
        bones: [{ rot: C, w: W.one, a: e => .05 * e.t + e.amp * .01 * e.n(e.t * .2) }] },
      // 顶部：天使、斯芬克斯、鹰同在一个整块形变层（避免重叠区相互遮挡）；斯芬克斯底部坐在轮缘上，权重靠 OFF_WHEEL 归零
      { name: "top", noHole: true, blur: 0, step: 12, poly: rect(58, 40, 1028, 570), minusCircles: [[C[0], C[1], 352]],
        bones: [
          { scale: [510, 520], w: W.mul(W.ell(510, 360, 150, 190, .45), OFF_WHEEL), sx: e => .004 * e.breath * e.amp, sy: e => .008 * e.breath * e.amp },
          { move: 1, w: W.mul(W.ell(510, 330, 150, 190, .45), OFF_WHEEL), dy: e => -e.s.sphinx.x },
          { move: 1, w: W.mul(W.ell(198, 255, 118, 190, .45), W.bandX(62, 100)), dx: e => e.amp * 1.5 * e.n(e.t * .23), dy: e => e.amp * 3 * Math.sin(e.t * .7) },
          { move: 1, w: W.mul(W.ell(810, 245, 175, 185, .45), W.bandX(1024, 990)), dx: e => e.amp * 1.5 * e.n(e.t * .23 + 1.6), dy: e => e.amp * 3 * Math.sin(e.t * .7 + 1.6) },
        ] },
      // 下行的蛇：沿身体的竖向波动；贴左边框与轮盘处权重为 0
      { name: "snake", noHole: true, blur: 0, step: 10, poly: rect(60, 700, 215, 1220), minusCircles: [[C[0], C[1], 352]],
        bones: [{ wave: 1, w: W.mul(W.ell(128, 960, 70, 270, .4), W.bandX(66, 92), OFF_WHEEL),
          ph: (x, y, e) => e.t * 1.1 - y * .012, ax: e => 2.2 * e.amp, ay: e => 1 * e.amp }] },
      // 阿努比斯
      { name: "anubis", noHole: true, blur: 0, step: 12, poly: rect(740, 820, 1026, 1300), minusCircles: [[C[0], C[1], 352]],
        bones: [{ move: 1, w: W.mul(W.ell(905, 1030, 105, 210, .45), OFF_WHEEL), dx: e => e.amp * .8 * e.n(e.t * .3 + 3), dy: e => e.amp * 2.5 * Math.sin(e.t * .75 + 1.8) }] },
      // 四角云中的四活物（含所坐云团一起轻移）
      floatLayer("ox", rect(60, 1310, 440, 1644), W.mul(W.ell(215, 1490, 135, 110, .45), W.bandX(64, 100)), 3.1, 1.5, 2.5),
      floatLayer("lion", rect(540, 1380, 1026, 1644), W.ell(770, 1515, 175, 95, .45), 4.4, 1.5, 2.5),
    ],
    glows: [
      { x: C[0], y: C[1], r0: 30, r1: e => 420 + 30 * Math.sin(e.t * .9), color: [255, 235, 190], a: e => .08 + .05 * (.5 + .5 * Math.sin(e.t * .9)) },
    ],
    motes: { n: 20, rect: [58, 40, 1028, 1645], speed: [3, 8], dir: -1 },
  });
});
