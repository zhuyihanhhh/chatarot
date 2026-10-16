Live2DCard.register("RWSa-P-02", () => {
  const { W } = Live2DCard;
  const circle = (cx, cy, r, n = 36) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(i / n * 6.2832), cy + r * Math.sin(i / n * 6.2832)]);
  // 两枚星币
  const L = [142, 615, 92], R = [825, 952, 88];
  // 起舞摇摆：枢轴在脚踝附近，小腿以下（y>1480）权重为 0
  const PIV = [575, 1480];
  const swayW = W.mul(W.bandY(1440, 1230), W.bandX(70, 300));
  const sway = e => e.s.sway.x;
  // 星币及其附近的带子、托币的手一起起伏
  const nearL = W.ell(L[0], L[1] + 30, 150, 170, .55);
  const nearR = W.ell(R[0], R[1] + 30, 150, 170, .55);
  const bobL = e => e.s.coinL.x, bobR = e => e.s.coinR.x;
  const hatW = W.ell(545, 400, 110, 150, .5);

  return ({
    title: "星币二 Two of Pentacles",
    key: { colors: [[183, 220, 231], [205, 229, 237], [227, 239, 238], [230, 239, 239], [195, 225, 235]], lo: 30, hi: 70 },
    keepRects: [{ rect: [38, 480, 66, 760] }, { rect: [420, 1440, 760, 1510] }],
    springs: {
      sway:  { k: 3, c: 2.2, target: e => e.amp * (.017 * Math.sin(e.t * 1.25) + .004 * e.n(e.t * .5)) + .006 * e.mx },
      coinL: { k: 8, c: 3, target: e => e.amp * 7 * Math.sin(e.t * 1.6) + 3 * e.my },
      coinR: { k: 8, c: 3, target: e => e.amp * 7 * Math.sin(e.t * 1.6 + Math.PI) + 3 * e.my },
      hat:   { k: 7, c: 1.5, force: e => -6 * e.s.sway.a + e.amp * .02 * e.n(e.t * .9 + 3) },
    },
    layers: [
      { name: "figure", key: true, minus: ["coinL", "coinR"], blur: 1, step: 12,
        poly: [[66,500],[200,480],[330,560],[395,580],[410,480],[470,430],[540,262],[690,285],[640,520],[700,760],[870,830],[935,880],[955,1000],[910,1100],[800,1130],[730,1115],[700,1250],[722,1300],[712,1400],[730,1480],[640,1500],[620,1440],[560,1500],[460,1500],[420,1400],[395,1290],[340,1230],[300,1100],[270,1000],[200,970],[150,850],[120,770],[66,730]],
        bones: [
          { rot: [545, 520], w: hatW, a: e => e.s.hat.x },
          { move: 1, w: W.mul(nearL, W.bandX(66, 90)), dy: bobL },
          { move: 1, w: nearR, dy: bobR },
          { rot: PIV, w: swayW, a: sway },
        ] },
      { name: "coinL", key: true, blur: 1, poly: circle(L[0], L[1], L[2] + 5).map(([x, y]) => [Math.max(x, 66), y]),
        bones: [
          { move: 1, w: W.bandX(66, 90), dy: bobL },
          { rot: PIV, w: swayW, a: sway },
        ] },
      { name: "coinR", key: true, blur: 1, poly: circle(R[0], R[1], R[2] + 5),
        bones: [
          { move: 1, w: W.one, dy: bobR },
          { rot: PIV, w: swayW, a: sway },
        ] },
    ],
    glows: [
      { x: L[0], y: L[1], r0: 20, r1: 150, color: [255, 225, 120], a: e => .12 + .07 * Math.sin(e.t * 1.6) },
      { x: R[0], y: R[1], r0: 20, r1: 145, color: [255, 225, 120], a: e => .12 + .07 * Math.sin(e.t * 1.6 + Math.PI) },
    ],
    motes: { n: 10, rect: [58, 40, 1028, 1400], speed: [3, 7] },
    fx(g, e) {
      // 海浪波光
      g.save(); g.globalCompositeOperation = "lighter";
      for (let i = 0; i < 16; i++) {
        const x = 80 + ((i * 167) % 930), y = 1420 + ((i * 53) % 70) + 4 * Math.sin(e.t * 1.2 + x * .02);
        const a = Math.max(0, Math.sin(e.t * 1.7 + i * 2.1)) ** 5 * .5;
        if (a < .01 || (x > 430 && x < 760)) continue;
        const gr = g.createRadialGradient(x, y, 0, x, y, 14);
        gr.addColorStop(0, `rgba(240,252,255,${a})`); gr.addColorStop(1, "rgba(240,252,255,0)");
        g.fillStyle = gr; g.fillRect(x - 14, y - 14, 28, 28);
      }
      g.restore();
    },
  });
});
