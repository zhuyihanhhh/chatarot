Live2DCard.register("RWSa-P-J2", () => {
  const { W } = Live2DCard;
  const COIN = [692, 452];
  const helmLeaf = W.ell(255, 285, 75, 85, .4);
  const horseLeaf = W.mul(W.ell(955, 615, 70, 50, .4), W.bandX(880, 930));
  const headW = W.ell(860, 760, 150, 200, .5);
  const pulse = e => .5 + .5 * Math.sin(e.t * 1.1);

  return ({
    title: "星币骑士 Knight of Pentacles",
    key: { colors: [[246, 233, 96], [245, 232, 91], [240, 221, 84], [242, 225, 84]] },
    // 马屁股贴左边框；腿脚接地处保持原图
    keepRects: [{ rect: [56, 770, 90, 1300] }, { rect: [80, 1360, 760, 1410] }],
    springs: {
      head: { k: 9,  c: 4.5, target: e => e.amp * .012 * e.n(e.t * .25 + 2) + .01 * e.mx },
      nod:  { k: 7,  c: 4,   target: e => e.amp * .012 * Math.sin(e.t * .5) * (.7 + .3 * e.n(e.t * .2)) },
      helm: { k: 45, c: 2.5, force: e => e.amp * (e.wind * 4 * e.n(e.t * 1.9 + 1) - 1.2 * e.s.head.a) },
      leaf: { k: 45, c: 2.5, force: e => e.amp * (e.wind * 4 * e.n(e.t * 2.1 + 5) - 1.5 * e.s.nod.a) },
    },
    layers: [
      { name: "fig", key: true,
        poly: [[58,780],[100,770],[180,770],[258,760],[255,560],[272,450],[232,420],[188,335],[186,250],[240,205],[330,212],[400,235],[470,250],[500,300],[500,370],[470,430],[500,560],[580,520],[625,515],[720,535],[800,545],[860,555],[900,565],[960,585],[1018,598],[1018,650],[960,665],[930,720],[945,820],[955,885],[910,905],[860,885],[812,950],[792,1050],[782,1150],[742,1250],[705,1290],[700,1395],[520,1395],[480,1395],[400,1395],[380,1300],[300,1300],[262,1300],[240,1200],[160,1180],[100,1270],[58,1290]],
        bones: [
          { rot: [930, 640], w: horseLeaf, a: e => e.s.leaf.x },
          { rot: [740, 690], w: W.max(headW, horseLeaf), a: e => e.s.nod.x },
          { rot: [300, 350], w: helmLeaf, a: e => e.s.helm.x },
          { rot: [420, 445], w: W.max(W.ell(400, 330, 115, 110, .45), helmLeaf), a: e => e.s.head.x },
          { scale: [440, 880], w: W.mul(W.ell(420, 640, 175, 260, .5), W.bandY(880, 800)), sx: e => .003 * e.breath * e.amp, sy: e => .007 * e.breath * e.amp },
          { scale: [330, 1200], w: W.mul(W.ell(330, 1000, 260, 190, .5), W.bandX(80, 170), W.bandY(1220, 1120)), sx: e => .003 * e.breath * e.amp, sy: e => .006 * e.breath * e.amp },
        ] },
    ],
    glows: [
      { x: COIN[0], y: COIN[1], r0: 40, r1: e => 170 + 30 * pulse(e), color: [255, 235, 140], a: e => .16 + .14 * pulse(e) },
      { x: COIN[0], y: COIN[1], r1: 60, color: [255, 255, 220], a: e => .08 + .12 * Math.sin(e.t * 1.7) ** 2 },
    ],
    motes: { n: 20, rect: [58, 40, 1028, 1400], speed: [2, 5], dir: -1, color: [255, 230, 150] },
  });
});
