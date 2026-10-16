Live2DCard.register("RWSa-P-03", () => {
  const { W } = Live2DCard;
  // 拱门上的三枚星币
  const COINS = [[545, 290], [430, 430], [650, 430]];
  // 敲击点（石匠手中工具触到石柱处）
  const HIT = [438, 930];
  // 敲击节奏：0..1 的锯齿，抬起慢、落下快
  const knock = e => { const p = (e.t * .9) % 1; return p < .75 ? p / .75 : 1 - (p - .75) / .25; };
  const hitPulse = e => { const p = (e.t * .9) % 1; return p < .75 ? 0 : Math.max(0, 1 - Math.abs(p - .97) / .1); };

  return ({
    title: "星币三 Three of Pentacles",
    springs: {
      arm: { k: 40, c: 9, target: e => -e.amp * .03 * knock(e) },
    },
    layers: [
      // 石匠前臂与手：背景杂乱，noHole + 轮廓内衰减；枢轴在肩部
      { name: "arm", noHole: true, step: 8,
        poly: [[230, 800], [300, 820], [370, 870], [430, 890], [455, 930], [430, 975], [370, 975], [300, 950], [235, 920]],
        bones: [
          { rot: [255, 860], w: W.mul(W.cap(255, 860, 425, 930, 30, 70), W.bandX(240, 300)), a: e => e.s.arm.x },
        ] },
      // 修士（持图纸者 + 斗篷修士）：呼吸
      { name: "monks", noHole: true, step: 12,
        poly: [[590, 800], [720, 760], [800, 790], [880, 830], [915, 1000], [920, 1400], [905, 1720], [600, 1720], [520, 1300], [480, 1100], [560, 960]],
        bones: [
          { scale: [700, 1700], w: W.mul(W.ell(690, 1050, 190, 330, .45), W.bandY(1600, 1350)),
            sx: e => .004 * e.amp * e.breath, sy: e => .006 * e.amp * e.breath },
          { move: 1, w: W.ell(665, 860, 55, 60, .5), dy: e => 1.5 * e.amp * e.breath, dx: e => .8 * e.amp * e.n(e.t * .3) + 1.2 * e.mx },
        ] },
    ],
    glows: COINS.map(([x, y], i) => ({ x, y, r0: 10, r1: e => 95 + 8 * Math.sin(e.t * .8 + i * 2.1), color: [255, 225, 140], a: e => .14 + .07 * Math.sin(e.t * .8 + i * 2.1) })),
    motes: { n: 22, rect: [60, 560, 1020, 1640], speed: [2, 5], color: [235, 225, 210] },
    fx(g, e) {
      const t = e.t, h = hitPulse(e);
      const [x, y] = HIT;
      g.save(); g.globalCompositeOperation = "lighter";
      if (h > .01) {
        const gr = g.createRadialGradient(x, y, 0, x, y, 30);
        gr.addColorStop(0, `rgba(255,230,170,${.5 * h})`); gr.addColorStop(1, "rgba(255,230,170,0)");
        g.fillStyle = gr; g.fillRect(x - 30, y - 30, 60, 60);
      }
      // 每次敲击迸出的火花 / 石屑
      const cyc = Math.floor(t * .9 - .75), p = t * .9 - .75 - cyc;
      if (p >= 0 && p < .7) {
        for (let i = 0; i < 9; i++) {
          const s = Math.sin(cyc * 12.9 + i * 78.2) * 43758.5, r = s - Math.floor(s);
          const ang = -2.6 + r * 2.6, sp = 60 + 90 * ((r * 7) % 1);
          const px = x + Math.cos(ang) * sp * p * 1.2, py = y + Math.sin(ang) * sp * p * 1.2 + 160 * p * p;
          const a = (1 - p / .7) * .8;
          g.fillStyle = i % 3 ? `rgba(255,210,120,${a})` : `rgba(230,225,215,${a})`;
          g.beginPath(); g.arc(px, py, i % 3 ? 2.2 : 3, 0, 7); g.fill();
        }
      }
      g.restore();
    },
  });
});
