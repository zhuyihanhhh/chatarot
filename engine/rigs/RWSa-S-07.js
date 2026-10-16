Live2DCard.register("RWSa-S-07", () => {
  const { W } = Live2DCard;
  // 踮脚走：两步一周期的轻快上颠
  const step = e => Math.abs(Math.sin(e.t * 2.2));
  // 人物整体：上身为 1，向下衰减；腿部背后是山丘（非纯色），在山丘线以下截断、权重为 0
  const W_BODY = W.bandY(1200, 1090);
  // 回头看的头部
  const NECK = [585, 655];
  const W_HEAD = W.ell(580, 545, 95, 120, .45);
  // 营帐小旗：旗杆处为 0，贴右边框处为 0
  const W_FLAG = W.mul(W.bandX(968, 990), W.bandX(1026, 1010), W.bandY(1128, 1110));

  return ({
    title: "宝剑七 Seven of Swords",
    key: { colors: [[247, 232, 86], [250, 236, 87], [245, 227, 120], [246, 232, 125]], lo: 30, hi: 64 },
    springs: {
      bob:  { k: 45, c: 7, target: e => -e.amp * 4 * step(e) },
      lean: { k: 12, c: 4.5, target: e => e.amp * .006 * Math.sin(e.t * 1.1) + .004 * e.mx },
      head: { k: 9, c: 4.5, target: e => e.amp * .025 * e.n(e.t * .3 + 1) - .015 * e.mx, force: e => -4 * e.s.bob.v * .002 },
      flag: { k: 30, c: 2.5, force: e => e.amp * e.wind * 3 * e.n(e.t * 1.6 + 5) },
    },
    layers: [
      { name: "fig", key: true, blur: 1, step: 8,
        poly: [[540,395],[600,395],[640,440],[700,430],[800,410],[850,430],[840,520],[880,560],[910,580],[905,640],[860,660],[820,680],[780,710],[740,700],[715,720],[700,800],[690,960],[700,1150],[715,1280],[340,1280],[300,1200],[190,1180],[150,1170],[140,1120],[180,1000],[230,860],[270,620],[260,570],[340,550],[360,470],[400,460],[430,530],[480,500]],
        bones: [
          { rot: NECK, w: W_HEAD, a: e => e.s.head.x },
          { rot: [520, 1480], w: W_BODY, a: e => e.s.lean.x },
          { move: 1, w: W_BODY, dx: e => e.amp * .8 * Math.sin(e.t * 1.1), dy: e => e.s.bob.x },
        ] },
      { name: "flag", key: true, blur: .6, step: 4,
        poly: [[960,1040],[990,1050],[1030,1080],[1030,1130],[990,1135],[960,1130]],
        bones: [
          { wave: 1, w: W_FLAG, ph: (x, y, e) => e.t * 4 - x * .08, ax: e => .5 * e.amp, ay: e => (1 + 1.5 * e.wind) * e.amp + e.s.flag.x },
        ] },
    ],
    keepRects: [
      { rect: [140, 1200, 720, 1290] },
      { rect: [60, 1505, 770, 1580] },
      { rect: [1012, 1040, 1036, 1140] },
    ],
    glows: [
      { x: 600, y: 600, r0: 60, r1: 520, color: [255, 240, 160], a: e => .05 + .03 * Math.sin(e.t * .7) },
    ],
    motes: { n: 20, rect: [58, 40, 1028, 1200], speed: [2, 6], dir: -1, color: [255, 245, 200] },
  });
});
