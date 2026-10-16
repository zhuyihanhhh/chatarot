Live2DCard.register("RWSa-S-05", () => {
  const { W } = Live2DCard;
  const ART = [58, 40, 1028, 1752];
  // 男子肩上的两把剑：权重为 0，保持不动
  const noSwords = (x, y) => 1 - W.cap(840, 330, 735, 1010, 30, 60)(x, y);
  // 乱云抠不干净（灰云带排线、贴边框）→ 静止，fx 里叠半透明雾气横移
  const MIST = Array.from({ length: 7 }, (_, i) => ({ y: 140 + i * 140, w: 380 + (i * 97) % 220, h: 50 + (i * 23) % 40, v: 10 + (i * 7) % 9, x0: (i * 331) % 1400, a: .16 + ((i * 13) % 6) / 50 }));

  return ({
    title: "宝剑五 Five of Swords",
    art: ART,
    springs: {
      head: { k: 9, c: 4.5, target: e => e.amp * .025 * e.n(e.t * .25 + 1) + .015 * e.mx },
    },
    layers: [
      // 前景男子：背景是天空乱云，noHole + 轮廓内衰减
      { name: "man", blur: 1, step: 8, noHole: true,
        poly: [[560,560],[640,500],[760,500],[800,560],[860,720],[960,800],[1010,1000],[960,1110],[760,1180],[560,1180],[520,1000],[540,820],[580,700]],
        bones: [
          { rot: [690, 720], w: W.mul(W.ell(665, 625, 105, 105, .45), W.bandX(790, 745), noSwords), a: e => e.s.head.x },
          { scale: [740, 1150], w: W.mul(W.ell(745, 900, 215, 190, .5), noSwords),
            sx: e => .005 * e.breath * e.amp, sy: e => .009 * e.breath * e.amp },
        ] },
      // 远处两人：缓慢呼吸，轮廓内衰减
      { name: "far1", blur: 1, step: 8, noHole: true,
        poly: [[90,1080],[300,1080],[310,1420],[90,1420]],
        bones: [{ scale: [190, 1400], w: W.ell(195, 1210, 85, 120, .5), sx: e => .006 * Math.sin(e.t * .9) * e.amp, sy: e => .008 * Math.sin(e.t * .9) * e.amp }] },
      { name: "far2", blur: 1, step: 8, noHole: true,
        poly: [[385,1260],[480,1260],[480,1440],[385,1440]],
        bones: [{ scale: [430, 1430], w: W.ell(430, 1340, 38, 62, .5), sx: e => .008 * Math.sin(e.t * .8 + 1.7) * e.amp, sy: e => .01 * Math.sin(e.t * .8 + 1.7) * e.amp }] },
    ],
    fx(g, e) {
      g.save();
      g.beginPath(); g.rect(ART[0], ART[1], ART[2] - ART[0], 1160 - ART[1]); g.clip();
      for (const m of MIST) {
        const x = ART[0] - m.w + ((m.x0 + e.t * m.v * e.amp) % (ART[2] - ART[0] + m.w * 2));
        g.save(); g.translate(x, m.y + 8 * Math.sin(e.t * .2 + m.x0)); g.scale(1, m.h / m.w);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, m.w / 2);
        gr.addColorStop(0, `rgba(235,232,238,${m.a})`); gr.addColorStop(1, "rgba(235,232,238,0)");
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, m.w / 2, 0, 7); g.fill();
        g.restore();
      }
      g.restore();
    },
  });
});
