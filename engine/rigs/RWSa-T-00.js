Live2DCard.register("RWSa-T-00", () => {
  const { W } = Live2DCard;
  const SUN = [945, 105];
  const BAG = [[728,280],[745,250],[770,228],[790,210],[812,212],[826,228],[845,245],[868,270],[876,320],[868,382],[850,422],[800,434],[742,420],[706,384],[698,340],[708,300]];
  const feather = W.cap(600, 268, 770, 200, 10, 28);
  const rose = W.cap(912, 566, 930, 440, 18, 48);
  const bark = t => { const p = t % 4.6; return p < 1.1 ? Math.sin(p / 1.1 * Math.PI * 3) * Math.sin(p / 1.1 * Math.PI) : 0; };

  // 被行囊挡住的光芒：沿太阳放射方向探测，穿过行囊后仍继续的光芒在行囊区域内补画
  function rebuildRays(g, { polyMask, lum, ART, W: IW }) {
    const bag = polyMask.bag, R = 150, runs = []; let run = null;
    for (let a = 80; a <= 215; a += .1) {
      const r = a * Math.PI / 180, x = SUN[0] + Math.cos(r) * R, y = SUN[1] + Math.sin(r) * R;
      const dark = x >= ART[0] && x < ART[2] && y >= ART[1] && y < ART[3] && lum(x, y) < 110;
      if (dark && !run) run = [a, a]; else if (dark) run[1] = a; else if (run) { runs.push(run); run = null; }
    }
    g.beginPath(); BAG.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.clip();
    g.strokeStyle = "rgb(24,20,16)";
    for (const [a0, a1] of runs) {
      const a = (a0 + a1) / 2 * Math.PI / 180, cx = Math.cos(a), cy = Math.sin(a);
      let gap = 0, rEnter = -1;
      for (let r = R; r < 700; r++) {
        const x = SUN[0] + cx * r, y = SUN[1] + cy * r;
        if (x < ART[0] || y > ART[3]) break;
        if (bag[Math.round(y) * IW + Math.round(x)] > .5) { if (rEnter < 0) rEnter = r; continue; }
        if (rEnter >= 0) {
          let dk = 0; for (let k = 0; k < 4; k++) if (lum(x + cx * k, y + cy * k) < 110) dk++;
          if (dk >= 3) {
            g.lineWidth = Math.max(4, (a1 - a0 + .1) * Math.PI / 180 * R); g.beginPath();
            g.moveTo(SUN[0] + cx * (rEnter - 3), SUN[1] + cy * (rEnter - 3)); g.lineTo(SUN[0] + cx * (r + 3), SUN[1] + cy * (r + 3)); g.stroke();
          }
          break;
        }
        if (lum(x, y) < 110) gap = 0; else if (++gap > 6) break;
      }
    }
  }

  return ({
    title: "0 愚者 The Fool",
    key: { colors: [[246, 234, 100]] },
    keepRects: [{ rect: [320, 1080, 740, 1111], except: ["dog"] }],
    springs: {
      sway:    { k: 8,  c: 4.5, target: e => e.amp * .006 * e.n(e.t * .4) + .007 * e.mx },
      head:    { k: 10, c: 5,   target: e => e.amp * .035 * e.n(e.t * .27 + 2) + .05 * e.mx - .02 * e.my },
      feather: { k: 60, c: 3,   force: e => e.amp * (-1.2 * e.s.head.a - 2 * e.s.sway.a + e.wind * 5 * e.n(e.t * 1.7 + 1)) },
      bag:     { k: 10, c: .9,  force: e => e.amp * (e.wind * 1.4 * e.n(e.t * .9 + 4) - 3 * e.s.sway.a - .8 * e.s.head.a) },
      rose:    { k: 40, c: 2.2, force: e => e.amp * e.wind * 5 * e.n(e.t * 2.3 + 3) },
      arm:     { k: 12, c: 5,   target: e => e.amp * .02 * e.n(e.t * .35 + 7) },
      hem:     { k: 25, c: 3,   force: e => -e.s.sway.v * 900 + e.amp * 40 * e.n(e.t * .8) },
    },
    layers: [
      { name: "rays", key: true, minus: ["fig", "bag"], minusCircles: [[945, 105, 108]], blur: 0,
        poly: [[570,40],[1034,40],[1034,420],[860,420],[700,240],[570,165]],
        extra: rebuildRays,
        bones: [
          { scale: SUN, w: W.one, sx: e => e.amp * .012 * Math.sin(e.t * 1.2), sy: e => e.amp * .012 * Math.sin(e.t * 1.2) },
          { rot: SUN, w: W.one, a: e => e.amp * .012 * e.n(e.t * .15) },
        ] },
      { name: "dog", blur: 1.2,
        poly: [[824,1148],[866,1144],[914,1170],[936,1210],[908,1246],[958,1280],[992,1288],[1034,1308],[1034,1378],[1002,1380],[1016,1500],[1000,1542],[948,1532],[944,1446],[904,1378],[830,1358],[756,1320],[698,1276],[678,1236],[712,1234],[776,1280],[812,1240],[834,1206],[820,1172]],
        bones: [
          { rot: [958, 1330], w: W.mul(W.cap(962, 1325, 1030, 1340, 18, 52), W.bandX(940, 965)), a: e => e.amp * .3 * Math.sin(e.t * 10) * (.75 + .25 * e.n(e.t * .5)) },
          { rot: [890, 1255], w: W.ell(876, 1196, 72, 64), a: e => -e.amp * (.05 * bark(e.t) + .02 * Math.sin(e.t * 1.3)) },
          { rot: [790, 1300], w: W.cap(690, 1240, 780, 1290, 15, 40), a: e => -e.amp * (.04 * bark(e.t) + .015 * Math.sin(e.t * 2.1)) },
          { scale: [850, 1400], w: W.ell(850, 1330, 130, 80, .6), sy: e => .008 * (e.amp * Math.sin(e.t * 7) * .5 + .5) },
        ] },
      { name: "fig", key: true, minus: ["bag"],
        poly: [[60,626],[300,468],[468,284],[545,264],[600,254],[650,236],[700,214],[740,196],[772,194],[782,212],[752,238],[726,262],[712,300],[720,420],[860,430],[880,418],[965,418],[992,520],[992,610],[988,760],[968,842],[900,870],[760,882],[700,960],[650,1000],[690,1050],[712,1100],[372,1100],[335,990],[300,965],[222,900],[200,830],[150,770],[60,770]],
        bones: [
          { rot: [912, 566], w: rose, a: e => e.s.rose.x },
          { rot: [780, 610], w: W.max(W.cap(790, 605, 960, 560, 40, 90), rose), a: e => e.s.arm.x + e.breath * .004 * e.amp },
          { wave: 1, w: W.mul(W.ell(850, 770, 150, 105), W.bandY(650, 850)), ph: (x, y, e) => e.t * 2.2 - y * .02 - x * .012, ax: e => (2.5 + 5 * e.wind) * e.amp, ay: e => (1.25 + 2.5 * e.wind) * e.amp },
          { wave: 1, w: W.mul(W.ell(290, 775, 95, 110), W.bandY(690, 860)), ph: (x, y, e) => e.t * 2 - y * .022 + x * .01, ax: e => (2 + 4 * e.wind) * e.amp, ay: e => (.8 + 1.6 * e.wind) * e.amp },
          { rot: [600, 272], w: feather, a: e => e.s.feather.x },
          { rot: [535, 455], w: W.max(W.ell(565, 360, 105, 95), feather), a: e => e.s.head.x },
          { scale: [480, 780], w: W.ell(480, 620, 200, 180, .6), sx: e => .004 * e.breath * e.amp, sy: e => .01 * e.breath * e.amp },
          { move: 1, w: W.mul(W.ell(510, 930, 230, 95), W.bandY(860, 990)), dx: e => e.s.hem.x * .1 },
          { rot: [520, 1390], w: W.bandY(1080, 860), a: e => e.s.sway.x },
        ] },
      { name: "bag", key: true, poly: BAG, follow: { layer: "fig", point: [800, 222] },
        bones: [{ rot: [800, 222], w: W.one, a: e => e.s.bag.x }] },
    ],
    glows: [
      { x: 945, y: 105, r0: 60, r1: e => 330 + 30 * (.5 + .5 * Math.sin(e.t * 1.2)), a: e => .18 + .1 * (.5 + .5 * Math.sin(e.t * 1.2)) },
      { x: 528, y: 105, r1: 34, color: [255, 255, 230], a: e => .25 + .25 * Math.sin(e.t * 2.6) },
    ],
    motes: { n: 28, rect: [58, 40, 1028, 1190] },
  });
});
