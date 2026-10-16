Live2DCard.register("RWSa-C-09", () => {
  const { W } = Live2DCard;
  // 九只杯的杯身中心（弧形排列）与闪光相位
  const CUPS = [[62, 470], [160, 420], [265, 395], [395, 370], [520, 355], [645, 365], [770, 400], [880, 440], [985, 490]]
    .map((c, i) => ({ c, ph: i * 2.39 }));
  const twinkle = (s, e) => { const k = .5 + .5 * Math.sin(e.t * 1.4 + s.ph); return k * k; };

  return ({
    title: "圣杯九 Nine of Cups",
    springs: {
      head: { k: 9, c: 4.5, target: e => e.amp * .022 * e.n(e.t * .25 + 1) + .015 * e.mx },
    },
    layers: [
      // 男子背后是带黑条纹的蓝布，抠不干净 → noHole + 轮廓内局部形变，权重在轮廓内衰减到 0
      { name: "man", blur: 1, step: 8, noHole: true,
        poly: [[400,645],[560,635],[700,690],[740,800],[790,940],[810,1160],[230,1160],[240,940],[320,820],[380,720]],
        bones: [
          { rot: [512, 885], w: W.ell(525, 775, 140, 100, .45), a: e => e.s.head.x },
          { scale: [512, 1170], w: W.mul(W.ell(512, 1000, 245, 150, .5), W.bandY(1160, 1100)),
            sx: e => .004 * e.breath * e.amp, sy: e => .008 * e.breath * e.amp },
        ] },
    ],
    glows: [
      ...CUPS.map(s => ({ x: s.c[0], y: s.c[1], r0: 10, r1: e => 70 + 25 * twinkle(s, e), color: [255, 235, 150], a: e => .05 + .22 * twinkle(s, e) })),
      { x: 520, y: 400, r0: 80, r1: 560, color: [255, 220, 140], a: e => .06 + .03 * Math.sin(e.t * .7) },
    ],
    motes: { n: 30, rect: [58, 40, 1028, 1640], speed: [2, 6], dir: -1, color: [255, 225, 150] },
    fx(g, e) {
      g.save(); g.globalCompositeOperation = "lighter";
      // 杯口星芒：闪光峰值时出现
      for (const s of CUPS) {
        const k = twinkle(s, e), a = .5 * Math.max(0, k - .55) / .45;
        if (a <= .01) continue;
        const x = s.c[0] + 18 * Math.sin(s.ph), y = s.c[1] - 50, L = 18 + 28 * k;
        for (const [dx, dy, l] of [[1, 0, L], [0, 1, L], [.707, .707, L * .4], [.707, -.707, L * .4]]) {
          const gr = g.createLinearGradient(x - dx * l, y - dy * l, x + dx * l, y + dy * l);
          gr.addColorStop(0, "rgba(255,250,220,0)"); gr.addColorStop(.5, `rgba(255,250,220,${a})`); gr.addColorStop(1, "rgba(255,250,220,0)");
          g.strokeStyle = gr; g.lineWidth = 2; g.beginPath(); g.moveTo(x - dx * l, y - dy * l); g.lineTo(x + dx * l, y + dy * l); g.stroke();
        }
      }
      g.restore();
    },
  });
});
