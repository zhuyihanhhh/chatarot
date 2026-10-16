Live2DCard.register("RWSa-C-J2", () => {
  const { W } = Live2DCard;
  const CUP = [672, 420];
  const cupPulse = e => .5 + .5 * Math.sin(e.t * 1.1);
  // 行走：两步一周期的起伏
  const step = e => Math.abs(Math.sin(e.t * 1.5));
  // 马身+骑士：腿部截断处（y≈1300 以下）为 0；贴左边框（马臀）和右边框（马头）处为 0
  const W_WALK = W.mul(W.bandY(1300, 1170), W.bandX(70, 150), W.bandX(1025, 985), W.bandY(130, 200));
  // 马头：颈部以下衰减，口鼻贴近右边框处为 0
  const W_HEAD = W.mul(W.ell(880, 930, 170, 190, .5), W.bandX(1020, 990), W.bandY(1130, 1080));
  // 头盔小翅膀：翅根（x≈330）以右衰减为 0，翅尖贴近左边框处也为 0
  const W_WING = W.mul(W.ell(200, 195, 160, 60, .5), W.bandX(330, 290), W.bandX(55, 90));

  return ({
    title: "圣杯骑士 Knight of Cups",
    art: [58, 40, 1028, 1645],
    key: { colors: [[176, 217, 234], [191, 223, 236], [172, 216, 232], [205, 229, 236], [220, 235, 238]], lo: 14, hi: 34 },
    keepRects: [
      { rect: [30, 150, 75, 240] },      // 翅尖靠左边框
      { rect: [1000, 700, 1040, 1140] }, // 马头靠右边框
      { rect: [40, 700, 80, 1300] },     // 马臀靠左边框
    ],
    springs: {
      bob:  { k: 40, c: 7, target: e => -e.amp * 2.5 * step(e) },
      nod:  { k: 12, c: 4, target: e => e.amp * (.025 * Math.sin(e.t * 1.5 * 2 + .8) + .008 * e.n(e.t * .3)) },
      wing: { k: 30, c: 2.2, force: e => e.amp * (2.5 * e.wind * e.n(e.t * 1.8 + 4)) - 6 * e.s.bob.v * .02 },
    },
    layers: [
      { name: "rider", key: true, blur: 1, step: 8,
        poly: [[40,150],[180,140],[300,150],[420,240],[470,300],[620,330],[760,350],[760,700],[880,700],[1000,760],[1030,900],[1030,1120],[900,1130],[760,1150],[640,1200],[600,1320],[200,1320],[60,1300],[40,760],[120,750],[250,640],[250,400],[300,250],[40,240]],
        bones: [
          { wave: 1, w: W_WING, ph: (x, y, e) => e.t * 5 - x * .03, ax: e => .6 * e.amp, ay: e => (1.2 + 1.5 * e.wind) * e.amp },
          { rot: [330, 200], w: W_WING, a: e => e.s.wing.x * .03 },
          { rot: [770, 830], w: W_HEAD, a: e => e.s.nod.x },
          { move: 1, w: W_WALK, dy: e => e.s.bob.x, dx: e => 0 },
        ] },
    ],
    glows: [
      { x: CUP[0], y: CUP[1], r0: 30, r1: e => 190 + 25 * cupPulse(e), color: [255, 235, 150], a: e => .14 + .08 * cupPulse(e) },
      { x: CUP[0], y: CUP[1] - 20, r1: e => 90 + 10 * cupPulse(e), color: [255, 250, 215], a: e => .1 + .06 * cupPulse(e) },
    ],
    motes: { n: 14, rect: [58, 40, 1028, 1200], speed: [2, 5], dir: -1, color: [255, 245, 210] },
  });
});
