Live2DCard.register("RWSa-W-KI", () => {
  const { W } = Live2DCard;
  // 王座挂毯、地面网点都很杂：全部 noHole + 轮廓内衰减形变
  return ({
    title: "权杖国王 King of Wands",
    springs: {
      head:   { k: 9,  c: 4.5, target: e => e.amp * .018 * e.n(e.t * .25 + 1) + .012 * e.mx - .008 * e.my },
      lizard: { k: 10, c: 3.5, target: e => e.amp * .05 * e.n(e.t * .5 + 4) },
    },
    layers: [
      // 国王：头部（含王冠）+ 呼吸
      { name: "king", noHole: true, blur: 1, step: 8,
        poly: [[380,260],[620,260],[660,560],[760,640],[780,960],[250,960],[300,640],[400,560]],
        bones: [
          { rot: [500, 540], w: W.ell(480, 390, 115, 140, .45), a: e => e.s.head.x },
          { scale: [520, 950], w: W.mul(W.ell(520, 760, 230, 210, .5), W.bandY(950, 870)), sx: e => .003 * e.breath * e.amp, sy: e => .007 * e.breath * e.amp },
        ] },
      // 披风下摆：豹纹披风的下部轻摆，贴右边框和地面处权重为 0
      { name: "cape", noHole: true, blur: 1, step: 8,
        poly: [[820,1150],[1000,1150],[1010,1480],[820,1480]],
        bones: [
          { wave: 1, w: W.mul(W.ell(910, 1330, 90, 150, .5), W.bandY(1180, 1300), W.bandX(1005, 975)),
            ph: (x, y, e) => e.t * 1.6 - y * .015, ax: e => (1.2 + 2 * e.wind) * e.amp, ay: e => .4 * e.amp },
        ] },
      // 蜥蜴：尾巴摆动、头部微抬，腹部贴地处为 0
      { name: "lizard", noHole: true, blur: .8, step: 6,
        poly: [[650,1510],[900,1510],[900,1625],[650,1625]],
        bones: [
          { rot: [805, 1585], w: W.mul(W.cap(810, 1585, 885, 1550, 6, 20), W.bandX(805, 830)), a: e => e.amp * .12 * Math.sin(e.t * 1.8) * (.7 + .3 * e.n(e.t * .4)) },
          { rot: [715, 1555], w: W.mul(W.ell(685, 1535, 40, 26, .5), W.bandX(715, 695)), a: e => -e.s.lizard.x },
        ] },
    ],
    glows: [
      // 王冠暖色光晕
      { x: 470, y: 320, r0: 20, r1: e => 140 + 15 * Math.sin(e.t * 1.3), color: [255, 190, 90], a: e => .14 + .07 * Math.sin(e.t * 1.3) },
    ],
    motes: { n: 20, rect: [58, 40, 1028, 1500], speed: [2, 6], dir: -1, color: [255, 210, 140] },
  });
});
