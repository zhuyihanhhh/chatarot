Live2DCard.register("RWSa-C-02", () => {
  const { W } = Live2DCard;
  // 狮头翼：左右翼各绕翼根旋转，翼根附近权重衰减到 0，狮头本身不动
  const wingL = W.mul(W.cap(400, 260, 100, 340, 40, 150), W.bandX(410, 340));
  const wingR = W.mul(W.cap(670, 250, 1000, 300, 40, 150), W.bandX(665, 735));
  const flap = e => e.amp * (.035 * Math.sin(e.t * 1.25) + .008 * e.n(e.t * .6 + 2));

  return ({
    title: "圣杯二 Two of Cups",
    key: { colors: [[193, 222, 235], [153, 207, 227], [155, 206, 228], [222, 234, 237]] },
    keepRects: [{ rect: [400, 360, 680, 440] }],
    springs: {
      flapL: { k: 30, c: 5, target: flap },
      headW: { k: 9, c: 4.5, target: e => e.amp * .02 * e.n(e.t * .23 + 1) + .012 * e.mx },
      headM: { k: 9, c: 4.5, target: e => e.amp * .02 * e.n(e.t * .21 + 5) + .012 * e.mx },
    },
    layers: [
      { name: "lion", key: true, blur: 1,
        poly: [[80,320],[150,240],[230,180],[320,150],[400,150],[440,160],[480,140],[560,140],[620,160],[690,150],[760,145],[830,170],[920,230],[1010,290],[1000,320],[930,330],[780,330],[700,340],[660,400],[640,420],[440,420],[410,380],[400,340],[300,330],[190,340],[110,360]],
        bones: [
          { rot: [400, 260], w: wingL, a: e => e.s.flapL.x },
          { rot: [670, 250], w: wingR, a: e => -e.s.flapL.x },
        ] },
      // 人物背后连着杯、手臂与远景 → noHole + 轮廓内衰减
      { name: "woman", noHole: true, blur: 1, step: 8,
        poly: [[150,460],[345,455],[350,640],[345,760],[330,900],[130,900],[120,660],[150,600]],
        bones: [
          { rot: [255, 630], w: W.ell(250, 545, 95, 95, .45), a: e => e.s.headW.x },
          { scale: [235, 900], w: W.mul(W.ell(235, 760, 95, 110, .55), W.bandY(890, 840)),
            sx: e => .004 * e.breath * e.amp, sy: e => .008 * e.breath * e.amp },
        ] },
      { name: "man", noHole: true, blur: 1, step: 8,
        poly: [[680,425],[895,425],[905,640],[960,700],[960,920],[720,920],[700,760],[690,640]],
        bones: [
          { rot: [790, 640], w: W.ell(785, 525, 100, 100, .45), a: e => e.s.headM.x },
          { scale: [820, 920], w: W.mul(W.ell(820, 770, 105, 120, .55), W.bandY(910, 860)),
            sx: e => .004 * Math.sin(e.t * 2 * Math.PI / 4.2 + 1.3) * e.amp, sy: e => .008 * Math.sin(e.t * 2 * Math.PI / 4.2 + 1.3) * e.amp },
        ] },
    ],
    glows: [
      { x: 455, y: 700, r0: 15, r1: e => 110 + 20 * Math.sin(e.t * 1.3), color: [255, 235, 160], a: e => .14 + .08 * Math.sin(e.t * 1.3) },
      { x: 610, y: 700, r0: 15, r1: e => 110 + 20 * Math.sin(e.t * 1.3 + 1.6), color: [255, 235, 160], a: e => .14 + .08 * Math.sin(e.t * 1.3 + 1.6) },
      { x: 540, y: 270, r0: 40, r1: 300, color: [255, 200, 150], a: e => .06 + .03 * Math.sin(e.t * .8) },
    ],
    motes: { n: 22, rect: [58, 40, 1028, 1640], speed: [2, 6], dir: -1, color: [255, 230, 170] },
  });
});
