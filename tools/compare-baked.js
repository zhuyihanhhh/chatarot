// 在 tools/bake.html 页面上下文中运行：比较若干张牌的烘焙图层与运行时拆层的像素差
window.compareBaked = async (stems) => {
  const out = [];
  const px = c => { const t = document.createElement("canvas"); t.width = c.width; t.height = c.height; const g = t.getContext("2d"); g.drawImage(c, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
  for (const stem of stems) {
    if (!Live2DCard.rigs[stem]) await new Promise((res, rej) => { const s = document.createElement("script"); s.src = `../engine/rigs/${stem}.js`; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    const cfg = Live2DCard.rig(stem);
    const meta = await (await fetch(`../assets/baked/${stem}/meta.json`, { cache: "no-cache" })).json();
    const rt = Live2DCard.extractLayers(await Live2DCard.loadImage(`../assets/cards/${stem}.jpg`), cfg);
    const diffs = [];
    for (let i = 0; i < meta.layers.length; i++) {
      const a = px(rt.layers[i].canvas), b = px(await Live2DCard.loadImage(`../assets/baked/${stem}/${meta.layers[i].file}`));
      let d = 0, n = 0, max = 0;
      for (let k = 0; k < a.length; k += 4) {
        const wa = a[k + 3] / 255, wb = b[k + 3] / 255;
        if (wa < .02 && wb < .02) continue;
        const e = (Math.abs(a[k] * wa - b[k] * wb) + Math.abs(a[k + 1] * wa - b[k + 1] * wb) + Math.abs(a[k + 2] * wa - b[k + 2] * wb)) / 3;
        d += e; n++; if (e > max) max = e;
      }
      diffs.push(`${meta.layers[i].name}:${(d / Math.max(1, n)).toFixed(1)}`);
    }
    out.push(`${stem} hash=${meta.hash === Live2DCard.rigHash(cfg) ? "ok" : "STALE"} ${diffs.join(" ")}`);
  }
  return out.join("\n");
};
