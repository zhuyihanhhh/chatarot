Live2DCard.register("RWSa-P-KI", () => {
  const { W } = Live2DCard;
  const COIN = [715, 880], ORB = [290, 735];
  const pulse = (e, p = 0) => .5 + .5 * Math.sin(e.t * 1.1 + p);

  return ({
    title: "星币国王 King of Pentacles",
    key: { colors: [[236, 214, 90], [232, 209, 122], [246, 229, 77]] },
    // 藤蔓根部与王座、水面相接处保留原图
    keepRects: [{ rect: [56, 625, 240, 660] }, { rect: [205, 470, 245, 660] }, { rect: [50, 460, 70, 660] }],
    springs: {
      head: { k: 9,  c: 4.5, target: e => e.amp * .015 * e.n(e.t * .25 + 1) + .012 * e.mx },
      vine: { k: 18, c: 1.8, force: e => e.amp * e.wind * 2.2 * e.n(e.t * 1.2 + 3) },
    },
    layers: [
      // 左上藤蔓：背后是纯色天空，key 抠出；根部（下沿与王座侧）权重为 0
      { name: "vine", key: true,
        poly: [[60,470],[160,470],[240,470],[240,640],[60,640]],
        bones: [
          { wave: 1, w: W.mul(W.bandY(630, 560), W.bandX(225, 190), W.bandX(68, 100)), ph: (x, y, e) => e.t * 1.5 - y * .015 - x * .01,
            ax: e => (1 + 2.5 * e.wind) * e.amp, ay: e => (.4 + .8 * e.wind) * e.amp },
          { rot: [140, 630], w: W.mul(W.bandY(630, 560), W.bandX(225, 190), W.bandX(68, 100)), a: e => e.s.vine.x * .5 },
        ] },
      // 国王身后是牛头王座和葡萄纹，抠不干净 → noHole + 轮廓内衰减
      { name: "king", blur: 1, step: 8, noHole: true,
        poly: [[440,350],[540,330],[650,350],[700,450],[720,600],[760,700],[760,820],[650,840],[420,840],[340,780],[360,640],[400,560],[420,450]],
        bones: [
          { rot: [545, 615], w: W.ell(545, 470, 95, 115, .45), a: e => e.s.head.x },
          { scale: [550, 840], w: W.mul(W.ell(550, 690, 180, 150, .5), W.bandY(830, 760)),
            sx: e => .004 * e.breath * e.amp, sy: e => .008 * e.breath * e.amp },
        ] },
    ],
    glows: [
      { x: COIN[0], y: COIN[1], r0: 45, r1: e => 180 + 30 * pulse(e), color: [255, 235, 140], a: e => .16 + .14 * pulse(e) },
      { x: COIN[0], y: COIN[1], r1: 65, color: [255, 255, 220], a: e => .08 + .12 * Math.sin(e.t * 1.7) ** 2 },
      { x: ORB[0], y: ORB[1], r0: 25, r1: e => 110 + 20 * pulse(e, 2), color: [255, 240, 170], a: e => .14 + .14 * pulse(e, 2) },
    ],
    motes: { n: 22, rect: [58, 40, 1028, 1640], speed: [2, 5], dir: -1, color: [255, 230, 150] },
  });
});
