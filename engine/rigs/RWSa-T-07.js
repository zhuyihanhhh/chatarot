Live2DCard.register("RWSa-T-07", () => {
  const { W } = Live2DCard;
  const WAND = [207, 502];
  // 华盖上的星星（原图像素坐标）与闪烁相位
  const STARS = [[271,156],[350,147],[412,160],[471,147],[325,172],[250,197],[375,197],[450,210],[333,218],
    [612,156],[662,160],[729,147],[758,152],[812,168],[654,210],[725,193],[800,202]].map((c, i) => ({ c, ph: i * 2.37 % 6.28 }));
  const breathAt = (e, off) => Math.sin(e.t * 2 * Math.PI / 4.2 + off);

  // 三个部件都不做色键：权重从中心向多边形边缘平滑衰减到 0，边缘处与原图完全重合
  return ({
    title: "VII 战车 The Chariot",
    layers: [
      { name: "driver", blur: 1, step: 10, noHole: true,
        poly: [[350,440],[720,440],[720,880],[350,880]],
        bones: [
          { scale: [535, 860], w: W.ell(535, 660, 140, 170, .6), sx: e => .004 * e.breath * e.amp, sy: e => .008 * e.breath * e.amp },
        ] },
      { name: "sphB", blur: 1, step: 10, noHole: true,
        poly: [[80,1120],[400,1120],[400,1640],[80,1640]],
        bones: [
          { rot: [215, 1390], w: W.ell(215, 1255, 110, 120, .5), a: e => e.amp * .012 * e.n(e.t * .2 + 1) },
          { scale: [240, 1630], w: W.ell(240, 1470, 130, 120, .6), sx: e => .005 * breathAt(e, 1.1) * e.amp, sy: e => .008 * breathAt(e, 1.1) * e.amp },
        ] },
      { name: "sphW", blur: 1, step: 10, noHole: true,
        poly: [[640,1110],[1010,1110],[1010,1640],[640,1640]],
        bones: [
          { rot: [835, 1390], w: W.ell(835, 1250, 110, 120, .5), a: e => e.amp * .012 * e.n(e.t * .2 + 4) },
          { scale: [800, 1630], w: W.ell(800, 1480, 140, 120, .6), sx: e => .005 * breathAt(e, 2.6) * e.amp, sy: e => .008 * breathAt(e, 2.6) * e.amp },
        ] },
    ],
    glows: [
      ...STARS.map(s => ({ x: s.c[0], y: s.c[1], r1: e => 16 + 6 * Math.sin(e.t * 1.7 + s.ph), color: [255, 255, 235], a: e => Math.max(0, .45 * Math.sin(e.t * 1.7 + s.ph)) })),
      { x: 542, y: 214, r0: 10, r1: e => 70 + 10 * Math.sin(e.t * 1.3), color: [255, 240, 160], a: e => .25 + .12 * Math.sin(e.t * 1.3) },
      { x: WAND[0], y: WAND[1], r0: 6, r1: e => 60 + 12 * Math.sin(e.t * 1.5), color: [255, 250, 210], a: e => .35 + .15 * Math.sin(e.t * 1.5) },
    ],
    motes: { n: 22, rect: [58, 40, 1028, 1100] },
    fx(g, e) {
      g.save(); g.globalCompositeOperation = "lighter";
      for (const s of STARS) {
        const k = Math.max(0, Math.sin(e.t * 1.7 + s.ph)), a = .5 * k * k, L = 10 + 14 * k;
        if (a < .02) continue;
        g.strokeStyle = `rgba(255,255,240,${a})`; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(s.c[0] - L, s.c[1]); g.lineTo(s.c[0] + L, s.c[1]); g.moveTo(s.c[0], s.c[1] - L); g.lineTo(s.c[0], s.c[1] + L); g.stroke();
      }
      g.restore();
    },
  });
});
