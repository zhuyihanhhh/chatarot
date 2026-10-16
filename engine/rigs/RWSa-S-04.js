Live2DCard.register("RWSa-S-04", () => {
  const { W } = Live2DCard;
  const ART = [58, 40, 1028, 1752];
  // 彩色玻璃窗各块的柔光，缓慢错相明暗
  const PANES = [[120, 140, [255, 210, 150], 0], [270, 120, [150, 190, 255], 2.1], [130, 420, [255, 230, 120], 4.2], [300, 400, [255, 140, 130], 1.3], [210, 280, [200, 170, 255], 3.3]];
  const pulse = (ph, e) => .5 + .5 * Math.sin(e.t * .5 + ph);

  return ({
    title: "宝剑四 Four of Swords",
    art: ART,
    layers: [
      // 雕像与石棺连成一体、背后是墙 → noHole；只让胸腹极轻起伏，轮廓边缘权重为 0
      { name: "statue", blur: 1, step: 8, noHole: true,
        poly: [[60,1120],[200,1100],[540,1080],[700,1110],[780,1140],[900,1150],[1028,1200],[1028,1320],[60,1320]],
        bones: [
          { scale: [500, 1265], w: W.ell(470, 1180, 230, 62, .55), sy: e => .012 * e.breath * e.amp },
        ] },
    ],
    glows: [
      ...PANES.map(([x, y, c, ph]) => ({ x, y, r0: 10, r1: e => 150 + 30 * pulse(ph, e), color: c, a: e => .05 + .1 * pulse(ph, e) })),
      // 窗光洒落的整体光晕
      { x: 230, y: 330, r0: 120, r1: 620, color: [255, 235, 190], a: e => .05 + .04 * Math.sin(e.t * .4) },
    ],
    motes: { n: 22, rect: [70, 560, 560, 1100], speed: [2, 6], dir: -1, color: [255, 238, 200] },
    fx(g, e) {
      // 由窗口斜射向右下的淡淡光束
      g.save(); g.globalCompositeOperation = "lighter";
      const a = .05 + .03 * Math.sin(e.t * .4);
      const gr = g.createLinearGradient(230, 560, 520, 1080);
      gr.addColorStop(0, `rgba(255,236,190,${a})`); gr.addColorStop(1, "rgba(255,236,190,0)");
      g.fillStyle = gr; g.beginPath();
      g.moveTo(70, 600); g.lineTo(390, 600); g.lineTo(640, 1080); g.lineTo(200, 1080); g.closePath(); g.fill();
      g.restore();
    },
  });
});
