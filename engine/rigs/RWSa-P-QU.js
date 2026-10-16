Live2DCard.register("RWSa-P-QU", () => {
  const { W } = Live2DCard;
  const COIN = [368, 850];
  const pulse = e => .5 + .5 * Math.sin(e.t * 1.1);

  return ({
    title: "星币王后 Queen of Pentacles",
    springs: {
      head: { k: 9, c: 4.5, target: e => e.amp * .02 * e.n(e.t * .25 + 1) + .015 * e.mx },
    },
    keepRects: [{ rect: [56, 38, 1030, 70] }],
    layers: [
      // 玫瑰藤顶棚贴着上边框：权重从边框处的 0 往下渐增，左右两端同样衰减
      { name: "roses", blur: 1, step: 8, noHole: true,
        poly: [[120,62],[980,62],[980,250],[900,250],[880,270],[560,270],[540,280],[430,280],[380,300],[200,300],[120,250]],
        bones: [
          { wave: 1, w: W.mul(W.bandY(70, 170), W.bandY(300, 240), W.bandX(130, 210), W.bandX(970, 890)),
            ph: (x, y, e) => e.t * 1.3 - x * .006 - y * .01, ax: e => (1 + 2.5 * e.wind) * e.amp, ay: e => (.4 + .8 * e.wind) * e.amp },
        ] },
      // 王后背后是花纹王座，抠不干净 → noHole + 轮廓内衰减
      { name: "queen", blur: 1, step: 8, noHole: true,
        poly: [[380,300],[470,265],[560,300],[640,390],[700,520],[740,640],[740,830],[600,900],[440,900],[380,780],[360,560],[330,420]],
        bones: [
          { rot: [530, 560], w: W.ell(470, 420, 105, 120, .45), a: e => e.s.head.x },
          { scale: [560, 900], w: W.mul(W.ell(560, 700, 150, 150, .5), W.bandY(890, 820)),
            sx: e => .004 * e.breath * e.amp, sy: e => .008 * e.breath * e.amp },
        ] },
    ],
    glows: [
      { x: COIN[0], y: COIN[1], r0: 50, r1: e => 200 + 30 * pulse(e), color: [255, 235, 140], a: e => .16 + .14 * pulse(e) },
      { x: COIN[0], y: COIN[1], r1: 70, color: [255, 255, 220], a: e => .08 + .12 * Math.sin(e.t * 1.7) ** 2 },
    ],
    motes: { n: 24, rect: [58, 40, 1028, 1640], speed: [2, 5], dir: -1, color: [255, 230, 150] },
  });
});
