Live2DCard.register("RWSa-P-08", () => {
  const { W } = Live2DCard;
  // 墙柱上挂的六枚星币
  const COINS = [[872, 170], [885, 415], [890, 680], [895, 930], [890, 1200], [905, 1545]].map((c, i) => ({ c, ph: i * 1.9 }));
  const shine = (s, e) => { const k = .5 + .5 * Math.sin(e.t * 1.2 + s.ph); return k * k; };
  // 敲击节奏：慢抬 → 快落 → 停顿；IMPACT 为落下瞬间
  const P = 1.15, IMPACT = .9;
  const smooth = x => x * x * (3 - 2 * x);
  const lift = t => {
    const p = t % P;
    if (p < .7) return smooth(p / .7);
    if (p < IMPACT) return 1 - smooth((p - .7) / (IMPACT - .7));
    return 0;
  };
  const CHISEL = [700, 1362];
  const WRIST = [535, 1235];
  // 握锤的手 + 锤子：前臂处衰减为 0
  const W_HAMMER = W.mul(W.max(W.ell(565, 1195, 55, 60, .5), W.cap(570, 1190, 605, 1060, 26, 52)), W.bandY(1265, 1230));
  // 上身呼吸：凳面以下为 0，左侧远离城堡
  const W_BODY = W.mul(W.ell(400, 1220, 200, 260, .5), W.bandY(1450, 1380), W.bandX(170, 230));

  return ({
    title: "星币八 Eight of Pentacles",
    art: [58, 40, 1028, 1752],
    layers: [
      // 背景是网点纸纹 → noHole + 轮廓内衰减
      { name: "man", blur: 1, step: 6, noHole: true,
        poly: [[170,1000],[440,880],[690,980],[700,1260],[560,1300],[460,1460],[170,1460]],
        bones: [
          { rot: WRIST, w: W_HAMMER, a: e => -e.amp * .035 * lift(e.t) },
          { scale: [420, 1450], w: W_BODY, sx: e => .003 * e.breath * e.amp, sy: e => .007 * e.breath * e.amp },
        ] },
    ],
    glows: COINS.map(s => ({ x: s.c[0], y: s.c[1], r0: 30, r1: e => 140 + 20 * shine(s, e), color: [255, 222, 120], a: e => .05 + .18 * shine(s, e) })),
    motes: { n: 14, rect: [58, 40, 1028, 1700], speed: [2, 5], dir: -1, color: [255, 235, 170] },
    fx(g, e) {
      // 敲击瞬间在凿尖迸出火花
      const age = ((e.t % P) - IMPACT + P) % P;
      if (age > .4) return;
      const k = 1 - age / .4, n = Math.floor(e.t / P);
      g.save(); g.globalCompositeOperation = "lighter";
      const gr = g.createRadialGradient(...CHISEL, 0, ...CHISEL, 30);
      gr.addColorStop(0, `rgba(255,240,180,${.6 * k * k})`); gr.addColorStop(1, "rgba(255,200,100,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(...CHISEL, 30, 0, 7); g.fill();
      for (let i = 0; i < 9; i++) {
        const r = Math.sin(n * 12.9898 + i * 78.233) * 43758.5453, h = r - Math.floor(r);
        const ang = -Math.PI * (.1 + .8 * ((i + h) / 9)), sp = 90 + 140 * h;
        const d = sp * age, x = CHISEL[0] + Math.cos(ang) * d, y = CHISEL[1] + Math.sin(ang) * d + 260 * age * age;
        g.strokeStyle = `rgba(255,${200 + 50 * h | 0},120,${.9 * k})`; g.lineWidth = 3.5;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(ang) * 18 * k, y - Math.sin(ang) * 18 * k); g.stroke();
      }
      g.restore();
    },
  });
});
