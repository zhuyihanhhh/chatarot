Live2DCard.register("RWSa-W-03", () => {
  const { W, smooth } = Live2DCard;
  // 船只过小且海面为排线纹理，无法抠干净 → 改为 fx 水面波光
  const SEA = [[70, 1440, 200, 1600], [250, 1440, 280, 1560], [640, 1440, 720, 1600], [770, 1440, 860, 1600], [910, 1440, 1020, 1600]];
  const rnd = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  // 右臂伸向权杖、与杖身描边相连：右侧权重归零；底部截断线权重归零
  const W_FIG = (x, y) => (1 - smooth(600, 690, x)) * (1 - smooth(1250, 1370, y));

  return ({
    title: "权杖三 Three of Wands",
    key: { colors: [[228, 210, 113], [224, 206, 139], [224, 208, 109], [226, 209, 116]] },
    keepRects: [
      { rect: [690, 700, 760, 1400] },
      { rect: [250, 1350, 720, 1400] },
    ],
    springs: {
      head: { k: 9, c: 4.5, target: e => e.amp * .02 * e.n(e.t * .2 + 1) + .015 * e.mx },
      cape: { k: 14, c: 2, force: e => e.amp * e.wind * 25 * e.n(e.t * .8 + 3) },
    },
    layers: [
      { name: "fig", key: true, blur: 1, step: 10,
        poly: [[262,1380],[268,1100],[280,920],[300,830],[340,790],[395,770],[420,720],[410,660],[430,610],[475,585],[530,592],[560,630],[565,690],[600,730],[660,740],[700,760],[712,780],[712,1380]],
        bones: [
          { wave: 1, w: W.mul(W.ell(330, 980, 75, 200, .55), W.bandY(800, 900), W.bandY(1300, 1180)),
            ph: (x, y, e) => e.t * 1.5 - y * .012, ax: e => (1.5 + .1 * Math.abs(e.s.cape.x)) * e.amp + .08 * e.s.cape.x, ay: e => .4 * e.amp },
          { rot: [490, 740], w: W.mul(W.ell(495, 650, 72, 75, .5), W.bandY(725, 695)), a: e => e.s.head.x },
          { scale: [480, 1380], w: W_FIG, sx: e => .004 * e.breath * e.amp, sy: e => .007 * e.breath * e.amp },
        ] },
    ],
    glows: [
      { x: 540, y: 1460, r0: 60, r1: e => 420 + 30 * Math.sin(e.t * .8), color: [255, 225, 150], a: e => .1 + .05 * Math.sin(e.t * .8) },
    ],
    motes: { n: 18, rect: [58, 40, 1028, 1400], speed: [2, 6] },
    fx(g, e) {
      g.save(); g.globalCompositeOperation = "lighter";
      let i = 0;
      for (const [x0, y0, x1, y1] of SEA) for (let k = 0; k < Math.max(3, Math.round((x1 - x0) / 14)); k++, i++) {
        const x = x0 + rnd(i) * (x1 - x0), y = y0 + rnd(i + 70) * (y1 - y0);
        const s = Math.max(0, Math.sin(e.t * (1 + rnd(i + 90)) + rnd(i + 20) * 6.28));
        const a = .5 * s * s * s;
        if (a < .01) continue;
        g.fillStyle = `rgba(255,250,225,${a})`;
        g.beginPath(); g.ellipse(x + 3 * Math.sin(e.t * .5 + i), y, 7 * s + 1, 1.3, 0, 0, 7); g.fill();
      }
      g.restore();
    },
  });
});
