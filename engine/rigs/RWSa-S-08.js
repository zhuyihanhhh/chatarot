Live2DCard.register("RWSa-S-08", () => {
  const { W } = Live2DCard;
  // 女子两侧紧贴剑身：权重只在身体内部，左右在剑前衰减为 0；头部单独轻颤
  const W_HEAD = W.ell(405, 530, 70, 80, .5);
  const W_CHEST = W.mul(W.ell(420, 760, 120, 170, .5), W.bandX(270, 320), W.bandX(575, 525));
  // 水洼里的涟漪中心（浅蓝水面）
  const RIPPLES = [[330, 1645, 0], [470, 1665, 1.7], [640, 1600, 3.1], [560, 1712, 4.4], [820, 1640, 2.3], [240, 1720, 5.2], [760, 1720, .9]];

  return ({
    title: "宝剑八 Eight of Swords",
    springs: {
      head: { k: 12, c: 4, target: e => e.amp * (.012 * e.n(e.t * .35 + 1) + .004 * Math.sin(e.t * 9) * Math.max(0, e.n(e.t * .5 + 4))) },
      trem: { k: 60, c: 6, target: e => e.amp * .6 * Math.sin(e.t * 11) * Math.max(0, e.n(e.t * .4 + 2)) },
    },
    layers: [
      { name: "woman", blur: 1, step: 8, noHole: true,
        poly: [[330,450],[480,450],[505,560],[580,600],[590,1100],[575,1530],[300,1530],[290,1100],[290,600],[330,570]],
        bones: [
          { rot: [405, 610], w: W_HEAD, a: e => e.s.head.x },
          { move: 1, w: W.max(W_HEAD, W_CHEST), dx: e => e.s.trem.x, dy: e => 0 },
          { scale: [420, 960], w: W_CHEST, sx: e => .004 * e.breath * e.amp, sy: e => .006 * e.breath * e.amp },
        ] },
    ],
    glows: [
      { x: 405, y: 530, r0: 40, r1: 300, color: [255, 235, 225], a: e => .04 + .02 * Math.sin(e.t * .6) },
    ],
    motes: { n: 14, rect: [58, 40, 1028, 1400], speed: [1, 4], dir: 1, color: [235, 235, 245] },
    fx(g, e) {
      g.save(); g.globalCompositeOperation = "lighter";
      for (const [x, y, ph] of RIPPLES) for (let i = 0; i < 2; i++) {
        const u = (e.t * .22 + ph * .19 + i * .5) % 1, r = 6 + u * 46;
        g.strokeStyle = `rgba(225,245,255,${.32 * (1 - u) * Math.min(1, u * 5)})`; g.lineWidth = 1.6;
        g.beginPath(); g.ellipse(x, y, r, r * .22, 0, 0, 7); g.stroke();
      }
      g.restore();
    },
  });
});
