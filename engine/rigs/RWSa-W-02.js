Live2DCard.register("RWSa-W-02", () => {
  const { W } = Live2DCard;
  const GLOBE = [386, 680];
  // 远处海面（左侧城墙外），只在 fx 里画闪烁光点
  const SEA = [[66, 1010, 215, 1100], [250, 1000, 400, 1100]];
  const rnd = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  return ({
    title: "权杖二 Two of Wands",
    key: { colors: [[214, 204, 200], [216, 207, 202], [221, 208, 202], [227, 217, 213], [204, 190, 184]] },
    springs: {
      head: { k: 9, c: 4.5, target: e => e.amp * .025 * e.n(e.t * .22 + 1) + .02 * e.mx - .01 * e.my },
      hem:  { k: 14, c: 2.2, force: e => e.amp * e.wind * 30 * e.n(e.t * .7 + 2) },
    },
    layers: [
      // 上半身（背后是天空，色键抠出）；y≈860 截断线处权重归零
      { name: "fig", key: true, blur: 1, step: 10,
        poly: [[318,650],[340,610],[380,595],[430,605],[470,560],[495,480],[540,430],[600,410],[660,418],[700,450],[715,520],[700,600],[735,640],[760,720],[772,820],[775,880],[318,880]],
        bones: [
          { rot: [590, 640], w: W.mul(W.ell(585, 530, 130, 120, .5), W.bandY(700, 620)), a: e => e.s.head.x },
          { scale: [560, 880], w: W.bandY(870, 700), sx: e => .004 * e.breath * e.amp, sy: e => .009 * e.breath * e.amp },
        ] },
      // 斗篷下摆：背景复杂，轮廓内局部形变，边缘权重为 0
      { name: "hem", noHole: true, blur: .8, step: 8,
        poly: [[520,1330],[760,1330],[760,1685],[520,1685]],
        bones: [
          { wave: 1, w: W.mul(W.ell(632, 1540, 88, 140, .55), W.bandY(1360, 1500)),
            ph: (x, y, e) => e.t * 1.6 - x * .02 - y * .01, ax: e => (1.5 + .12 * Math.abs(e.s.hem.x)) * e.amp + .08 * e.s.hem.x, ay: e => .6 * e.amp },
        ] },
    ],
    glows: [
      { x: GLOBE[0], y: GLOBE[1], r0: 30, r1: e => 120 + 15 * Math.sin(e.t * 1.3), color: [255, 240, 190], a: e => .18 + .1 * (.5 + .5 * Math.sin(e.t * 1.3)) },
    ],
    motes: { n: 16, rect: [58, 40, 1028, 1000], speed: [2, 6] },
    fx(g, e) {
      g.save(); g.globalCompositeOperation = "lighter";
      let i = 0;
      for (const [x0, y0, x1, y1] of SEA) for (let k = 0; k < 9; k++, i++) {
        const x = x0 + rnd(i) * (x1 - x0), y = y0 + rnd(i + 50) * (y1 - y0);
        const s = Math.max(0, Math.sin(e.t * (1.2 + rnd(i + 90)) + rnd(i + 20) * 6.28));
        const a = .45 * s * s * s;
        if (a < .01) continue;
        g.fillStyle = `rgba(255,255,240,${a})`;
        g.beginPath(); g.ellipse(x, y, 6 * s + 1, 1.2, 0, 0, 7); g.fill();
      }
      g.restore();
    },
  });
});
