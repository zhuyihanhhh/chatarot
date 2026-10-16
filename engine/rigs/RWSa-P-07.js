Live2DCard.register("RWSa-P-07", () => {
  const { W } = Live2DCard;
  // 七枚星币：藤上六枚 + 右下脚边一枚
  const COINS = [[164, 764], [336, 1045], [176, 1242], [445, 1282], [396, 1473], [149, 1600], [751, 1645]].map((c, i) => ({ c, ph: i * 2.1 }));
  const shine = (s, e) => { const k = .5 + .5 * Math.sin(e.t * 1.3 + s.ph); return k * k; };
  // 藤丛：贴左边框、底边和农夫腿处衰减为 0
  const W_VINE = W.mul(W.ell(270, 1150, 270, 580, .45), W.bandX(70, 140), W.bandX(520, 440), W.bandY(1740, 1640));
  // 头：下巴以下（搭在锄柄上的手）衰减为 0
  const W_HEAD = W.mul(W.ell(595, 465, 80, 85, .45), W.bandY(585, 545));
  // 躯干呼吸：锄柄附近对称，腿以下为 0
  const W_BODY = W.mul(W.ell(700, 880, 230, 290, .5), W.bandY(1170, 1100), W.bandY(560, 610));

  return ({
    title: "星币七 Seven of Pentacles",
    art: [58, 40, 1028, 1752],
    springs: {
      head: { k: 9, c: 4.5, target: e => e.amp * .02 * e.n(e.t * .25 + 1) + .012 * e.mx },
    },
    layers: [
      // 背景是网点纸纹 → noHole + 轮廓内衰减
      { name: "vine", blur: 1, step: 8, noHole: true,
        poly: [[60,570],[260,560],[420,760],[560,1100],[560,1500],[540,1752],[60,1752]],
        bones: [{ wave: 1, w: W_VINE, ph: (x, y, e) => e.t * 1.6 - y * .006 + x * .004,
          ax: e => (1.5 + 3.5 * e.wind) * e.amp, ay: e => (.5 + 1 * e.wind) * e.amp }] },
      { name: "man", blur: 1, step: 8, noHole: true,
        poly: [[500,360],[700,360],[930,620],[930,1180],[460,1180],[460,620]],
        bones: [
          { rot: [615, 545], w: W_HEAD, a: e => e.s.head.x },
          { scale: [660, 1170], w: W_BODY, sx: e => .003 * e.breath * e.amp, sy: e => .007 * e.breath * e.amp },
        ] },
    ],
    glows: COINS.map(s => ({ x: s.c[0], y: s.c[1], r0: 20, r1: e => 110 + 20 * shine(s, e), color: [255, 225, 120], a: e => .05 + .2 * shine(s, e) })),
    motes: { n: 18, rect: [58, 40, 1028, 1700], speed: [2, 5], dir: -1, color: [255, 235, 170] },
  });
});
