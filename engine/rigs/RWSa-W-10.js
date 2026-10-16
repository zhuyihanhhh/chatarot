Live2DCard.register("RWSa-W-10", () => {
  const { W, smooth } = Live2DCard;
  // 人物 + 十根权杖整体抠出（背后是天空）；腿与杖尾在 y=1340 处截断，截断线权重为 0
  const CUT = 1340, HIP = [520, CUT];
  // 负重整体权重：截断线归零、X 标题附近（中间权杖杖尖贴着标题）归零、右边框附近归零
  const W_BODY = W.mul(
    (x, y) => smooth(CUT, 1120, y),
    (x, y) => 1 - W.ell(540, 95, 110, 55, .45)(x, y),
  );
  // 蹒跚步伐：每步一次下沉，周期约 2.6 秒
  const STEP = 2.6;
  const sink = t => Math.pow(Math.abs(Math.sin(Math.PI * t / STEP)), 1.5);

  return ({
    title: "权杖十 Ten of Wands",
    key: { colors: [[120, 198, 217], [147, 200, 221], [158, 207, 227], [159, 207, 226], [119, 196, 214]] },
    keepRects: [
      { rect: [60, CUT - 10, 1030, CUT + 10] },
      { rect: [450, 45, 640, 140] },
    ],
    springs: {
      // 前倾滞后于下沉，带出沉重感
      lean: { k: 14, c: 5, target: e => e.amp * (.006 * sink(e.t - .3) - .002) },
    },
    layers: [
      { name: "man", key: true, blur: 1, step: 10,
        poly: [[65,62],[1018,62],[1020,560],[860,640],[850,960],[800,1100],[790,CUT],[90,CUT],[90,1100],[160,880],[65,500]],
        bones: [
          // 呼吸：背部起伏
          { scale: [480, 960], w: W.ell(470, 800, 160, 130, .5), sx: e => .004 * e.breath * e.amp, sy: e => .008 * e.breath * e.amp },
          // 前后微倾（绕髋部）
          { rot: HIP, w: W_BODY, a: e => e.s.lean.x },
          // 上下起伏
          { move: 1, w: W_BODY, dx: e => e.amp * .8 * Math.sin(2 * Math.PI * e.t / STEP / 2), dy: e => e.amp * 3.2 * sink(e.t) },
        ] },
    ],
    glows: [{ x: 560, y: 450, r0: 60, r1: 520, color: [255, 240, 205], a: e => .06 + .03 * Math.sin(e.t * .7) }],
    motes: { n: 18, rect: [58, 40, 1028, 1450] },
  });
});
