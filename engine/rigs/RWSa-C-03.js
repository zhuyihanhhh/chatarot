Live2DCard.register("RWSa-C-03", () => {
  const { W } = Live2DCard;
  const CUT = W.bandY(472, 420); // 举杯手臂在 y≈472 处截断：截断线权重为 0
  const armL = W.mul(W.cap(395, 460, 360, 300, 40, 80), W.bandX(432, 418), CUT);
  const armC = W.mul(W.cap(460, 450, 565, 200, 45, 95), W.bandX(418, 438), CUT);
  const armR = W.mul(W.cap(730, 460, 730, 300, 50, 90), CUT);
  const lift = (ph, sp) => e => e.amp * (.025 * Math.sin(e.t * sp + ph) + .006 * e.n(e.t * .5 + ph));

  return ({
    title: "圣杯三 Three of Cups",
    key: { colors: [[153, 205, 219], [163, 213, 229], [145, 205, 224], [149, 204, 218]] },
    keepRects: [{ rect: [290, 462, 820, 500] }],
    springs: {
      armL: { k: 14, c: 4, target: lift(0, 1.6) },
      armC: { k: 14, c: 4, target: lift(2.1, 1.6) },
      armR: { k: 14, c: 4, target: lift(4.2, 1.6) },
    },
    layers: [
      // 身体背后是果实/地面/其他人，抠不干净 → noHole + 轮廓内衰减
      { name: "bodies", noHole: true, blur: 1, step: 8,
        poly: [[170,472],[880,472],[910,1100],[910,1610],[170,1610]],
        bones: [
          // 裙摆随舞轻摆
          { wave: 1, w: W.ell(480, 1470, 160, 85, .5), ph: (x, y, e) => e.t * 1.8 - x * .015, ax: e => 3 * e.amp, ay: e => .8 * e.amp },
          { wave: 1, w: W.ell(800, 1440, 70, 90, .5), ph: (x, y, e) => e.t * 1.7 + 1 - y * .02, ax: e => 2.5 * e.amp, ay: e => .6 * e.amp },
          { wave: 1, w: W.ell(245, 1090, 65, 90, .5), ph: (x, y, e) => e.t * 1.9 + 2 - y * .02, ax: e => 2.5 * e.amp, ay: e => .6 * e.amp },
          // 呼吸：三人错开相位
          { scale: [260, 880], w: W.ell(265, 720, 65, 110, .5), sx: e => .004 * e.breath * e.amp, sy: e => .008 * e.breath * e.amp },
          { scale: [520, 900], w: W.ell(520, 720, 120, 130, .5), sx: e => .004 * Math.sin(e.t * 1.5 + 1) * e.amp, sy: e => .008 * Math.sin(e.t * 1.5 + 1) * e.amp },
          { scale: [800, 880], w: W.ell(800, 720, 65, 110, .5), sx: e => .004 * Math.sin(e.t * 1.5 + 2) * e.amp, sy: e => .008 * Math.sin(e.t * 1.5 + 2) * e.amp },
        ] },
      // 三只举起的手臂 + 杯（背后是纯色天空 → key 抠图）
      { name: "arms", key: true, blur: 1,
        polys: [
          [[290,262],[432,262],[418,330],[404,395],[426,430],[432,472],[340,472],[350,420],[330,360]],
          [[468,130],[668,130],[618,212],[610,270],[612,472],[436,472],[470,380],[505,300],[530,250],[512,212]],
          [[652,260],[812,260],[782,320],[770,372],[770,472],[690,472],[695,390],[690,330]],
        ],
        bones: [
          { rot: [400, 530], w: armL, a: e => e.s.armL.x },
          { rot: [470, 520], w: armC, a: e => -e.s.armC.x },
          { rot: [730, 540], w: armR, a: e => -e.s.armR.x },
        ] },
    ],
    glows: [
      { x: 365, y: 320, r0: 10, r1: e => 80 + 15 * Math.sin(e.t * 1.4), color: [255, 225, 150], a: e => .12 + .06 * Math.sin(e.t * 1.4) },
      { x: 570, y: 190, r0: 10, r1: e => 90 + 15 * Math.sin(e.t * 1.4 + 2), color: [255, 225, 150], a: e => .12 + .06 * Math.sin(e.t * 1.4 + 2) },
      { x: 730, y: 310, r0: 10, r1: e => 80 + 15 * Math.sin(e.t * 1.4 + 4), color: [255, 225, 150], a: e => .12 + .06 * Math.sin(e.t * 1.4 + 4) },
      { x: 540, y: 700, r0: 120, r1: 620, color: [255, 200, 130], a: e => .05 + .02 * Math.sin(e.t * .7) },
    ],
    motes: { n: 40, rect: [58, 40, 1028, 1640], speed: [2, 6], dir: -1, color: [255, 205, 130] },
  });
});
