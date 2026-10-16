Live2DCard.register("RWSa-T-20", () => {
  const { W, smooth } = Live2DCard;
  // 号角喇叭口
  const BELL = [625, 952];
  // 棺中起身者举起的手臂：肩（截断处，权重 0）→ 手
  const ARMS = [
    { s: [433, 1162], h: [356, 1098], ph: 0.0 },
    { s: [661, 1167], h: [583, 1132], ph: 2.2 },
    { s: [701, 1167], h: [744, 1128], ph: 4.1 },
  ];
  const armPoly = ({ s: [sx, sy], h: [hx, hy] }, hw = 20, ext = 16) => {
    const L = Math.hypot(hx - sx, hy - sy), ux = (hx - sx) / L, uy = (hy - sy) / L, nx = -uy * hw, ny = ux * hw;
    const ex = hx + ux * ext, ey = hy + uy * ext;
    return [[sx + nx, sy + ny], [ex + nx, ey + ny], [ex - nx, ey - ny], [sx - nx, sy - ny]];
  };
  const armW = A => W.mul(W.cap(...A.s, ...A.h, 14, 26), (x, y) => smooth(6, 30, Math.hypot(x - A.s[0], y - A.s[1])));
  const flap = e => e.amp * (.018 * Math.sin(e.t * .9) + .004 * e.n(e.t * .4));

  return ({
    title: "XX 审判 Judgement",
    key: { colors: [[163, 213, 234], [158, 210, 230], [135, 200, 223], [149, 205, 223], [146, 202, 219], [176, 215, 232]], lo: 26, hi: 56 },
    keepRects: [
      { rect: [58, 40, 80, 620] },                 // 左翼贴边框
      { rect: [1012, 40, 1028, 340] },             // 右翼贴边框
      { rect: [58, 672, 300, 690] }, { rect: [58, 680, 74, 845] },        // 左云截断
      { rect: [780, 652, 1028, 670] }, { rect: [772, 660, 790, 845] }, { rect: [1012, 660, 1028, 845] }, // 右云截断
      { rect: [440, 398, 640, 428] },             // 头部层下缘截断
      ...ARMS.map(A => ({ rect: [A.s[0] - 24, A.s[1] - 14, A.s[0] + 24, A.s[1] + 24] })), // 肩部截断
    ],
    springs: {
      hair:  { k: 26, c: 2.4, force: e => e.amp * (e.wind * 2.4 * e.n(e.t * 1.1 + 3) + 1.2 * Math.sin(e.t * 1.3)) },
      cloud: { k: 2,  c: 1.8, target: e => e.amp * 3 * e.n(e.t * .16 + 3) + 2 * e.mx },
      ...Object.fromEntries(ARMS.map((A, i) => [`arm${i}`, { k: 7, c: 2.2, target: e => e.amp * .03 * Math.sin(e.t * (.8 + .13 * i) + A.ph) }])),
    },
    layers: [
      { name: "wingL", key: true, blur: 1, step: 14,
        poly: [[58,90],[100,66],[180,56],[262,60],[302,100],[306,250],[316,340],[346,410],[330,452],[280,472],[200,522],[120,562],[58,572]],
        bones: [
          { rot: [300, 462], w: W.mul(W.bandX(64, 120), W.bandY(530, 430)), a: e => -flap(e) },
        ] },
      { name: "wingR", key: true, blur: 1, step: 14,
        poly: [[770,50],[880,44],[990,78],[1028,120],[1028,320],[960,320],[900,345],[860,400],[830,470],[700,470],[680,420],[740,370],[768,280],[774,150]],
        bones: [
          { rot: [745, 455], w: W.mul(W.bandX(1016, 990), W.bandY(340, 250)), a: e => flap(e) },
        ] },
      { name: "head", key: true, blur: 1, step: 10, minus: ["wingL", "wingR"],
        poly: [[352,100],[460,74],[650,88],[730,160],[768,200],[740,250],[722,330],[640,362],[620,410],[470,420],[400,400],[350,320]],
        bones: [
          { wave: 1, w: W.mul(W.max(W.ell(390, 262, 58, 140, .5), W.ell(672, 228, 66, 110, .5), W.ell(525, 108, 130, 38, .5)), W.bandY(400, 340)),
            ph: (x, y, e) => e.t * 1.6 - y * .025 + x * .01, ax: e => e.s.hair.x * .8 + .8 * e.amp, ay: e => .8 * e.amp },
        ] },
      { name: "cloudL", key: true, blur: 1, step: 14,
        poly: [[58,680],[290,680],[290,842],[58,842]],
        bones: [
          { move: 1, w: W.mul(W.ell(160, 762, 100, 70, .5), W.bandX(66, 110)), dx: e => e.s.cloud.x, dy: e => .3 * e.s.cloud.x },
        ] },
      { name: "cloudR", key: true, blur: 1, step: 14,
        poly: [[780,660],[1028,660],[1028,842],[780,842]],
        bones: [
          { move: 1, w: W.mul(W.ell(900, 752, 100, 74, .5), W.bandX(1020, 995)), dx: e => -.9 * e.s.cloud.x, dy: e => .3 * e.s.cloud.x },
        ] },
      // 十字旗：背后是云和天空，轮廓内局部形变，边缘与旗杆处权重为 0
      { name: "flag", noHole: true, blur: 1, step: 10,
        poly: [[262,640],[560,640],[560,945],[262,945]],
        bones: [
          { wave: 1, w: W.mul(W.ell(395, 790, 120, 118, .5), W.bandX(540, 495)),
            ph: (x, y, e) => e.t * 2.2 + x * .022 + y * .006, ax: e => (.8 + 1.2 * e.wind) * e.amp, ay: e => (1.6 + 1.6 * e.wind) * e.amp },
        ] },
      { name: "risen", key: true, blur: .8, step: 6,
        polys: ARMS.map(A => armPoly(A)),
        bones: ARMS.map((A, i) => ({ rot: A.s, w: armW(A), a: e => e.s[`arm${i}`].x })),
      },
    ],
    glows: [
      { x: BELL[0], y: BELL[1], r0: 10, r1: e => 120 + 25 * Math.sin(e.t * 2.1), color: [255, 240, 170], a: e => .2 + .1 * Math.sin(e.t * 2.1) },
      { x: BELL[0], y: BELL[1] + 40, r1: 260, color: [255, 250, 220], a: e => .08 + .05 * Math.sin(e.t * .8) },
      { x: 525, y: 230, r1: 220, color: [255, 245, 200], a: e => .06 + .04 * Math.sin(e.t * .6 + 1) },
    ],
    motes: { n: 22, rect: [58, 40, 1028, 1050], speed: [3, 8], dir: -1, color: [255, 250, 230] },
    fx(g, e) {
      g.save(); g.globalCompositeOperation = "lighter";
      // 号声：从喇叭口向下扩散的弧形声波
      const [bx, by] = BELL;
      for (let i = 0; i < 4; i++) {
        const u = (e.t * .45 + i / 4) % 1, r = 30 + u * 230;
        g.strokeStyle = `rgba(255,245,200,${.4 * Math.sin(u * Math.PI) * (1 - u * .4)})`;
        g.lineWidth = 3 - 1.5 * u;
        g.beginPath(); g.arc(bx, by - 10, r, Math.PI * .22, Math.PI * .78); g.stroke();
      }
      g.restore();
    },
  });
});
