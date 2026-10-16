Live2DCard.register("RWSa-W-09", () => {
  const { W } = Live2DCard;
  // 守卫被身后权杖和手中长杖包围，背景杂乱：整层 noHole，只在轮廓内做局部形变，权重在轮廓边缘衰减为 0
  const NECK = [668, 700];
  // 警惕张望：停顿 → 转头 → 停顿 → 转回
  const glance = t => { const p = t % 7; return p < 2.2 ? -1 : p < 3 ? -1 + 2 * Live2DCard.smooth(2.2, 3, p) : p < 5.6 ? 1 : 1 - 2 * Live2DCard.smooth(5.6, 6.4, p); };

  return ({
    title: "权杖九 Nine of Wands",
    springs: {
      head: { k: 10, c: 5, target: e => e.amp * (.022 * glance(e.t) + .006 * e.n(e.t * .5)) + .01 * e.mx },
    },
    layers: [
      { name: "guard", noHole: true, blur: 1, step: 8,
        poly: [[590,520],[750,520],[760,700],[880,760],[880,1080],[560,1080],[550,760],[590,700]],
        bones: [
          // 头部：绕脖颈微转（左右张望），附带一点水平平移；右侧紧贴握杖的手和长杖，x>715 权重归零
          { rot: NECK, w: W.mul(W.ell(660, 605, 68, 90, .4), (x, y) => 1 - Live2DCard.smooth(690, 718, x)), a: e => e.s.head.x },
          { move: 1, w: W.mul(W.ell(660, 605, 58, 78, .45), (x, y) => 1 - Live2DCard.smooth(690, 718, x)), dx: e => e.s.head.x * 60, dy: () => 0 },
          // 呼吸：胸腹轻微起伏
          { scale: [700, 1060], w: W.ell(705, 900, 140, 135, .5), sx: e => .004 * e.breath * e.amp, sy: e => .009 * e.breath * e.amp },
        ] },
    ],
    glows: [{ x: 560, y: 700, r0: 60, r1: 480, color: [255, 240, 205], a: e => .06 + .03 * Math.sin(e.t * .8) }],
    motes: { n: 20, rect: [58, 40, 1028, 1450] },
  });
});
