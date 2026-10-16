/* Live2DCard —— 单张塔罗图 → 分层 + 补背景 + 骨骼网格 + 弹簧物理
 * 用法：页面先加载 window.CARD_IMG（base64 图），再调用 Live2DCard.run(config)
 * 坐标一律使用原图像素坐标（Pam-A 扫描图 1086×1810）
 */
(() => {
  // ---------- 数学工具 ----------
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const noise = t => (Math.sin(t) + .6 * Math.sin(t * 1.618 + 1.3) + .3 * Math.sin(t * 2.718 + 2.1)) / 1.9;
  const rotP = (p, c, a) => {
    if (!a) return;
    const s = Math.sin(a), co = Math.cos(a), dx = p[0] - c[0], dy = p[1] - c[1];
    p[0] = c[0] + dx * co - dy * s; p[1] = c[1] + dx * s + dy * co;
  };

  // ---------- 权重场（返回 (x,y)=>0..1） ----------
  const W = {
    one: () => 1,
    ell: (cx, cy, rx, ry, soft = .35) => (x, y) => 1 - smooth(1 - soft, 1 + soft * .3, Math.hypot((x - cx) / rx, (y - cy) / ry)),
    cap: (ax, ay, bx, by, rin, rout) => (x, y) => {
      const vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
      return 1 - smooth(rin, rout, Math.hypot(x - ax - vx * t, y - ay - vy * t));
    },
    bandY: (a, b) => (x, y) => smooth(a, b, y),
    bandX: (a, b) => (x, y) => smooth(a, b, x),
    mul: (...fs) => (x, y) => fs.reduce((m, f) => m * f(x, y), 1),
    max: (...fs) => (x, y) => Math.max(...fs.map(f => f(x, y))),
  };

  // 骨骼：rot 绕枢轴旋转 / scale 缩放 / wave 波动 / move 平移；r 为静止坐标
  function applyBone(b, p, w, e, r) {
    if (!w) return;
    if (b.rot) rotP(p, b.rot, b.a(e) * w);
    else if (b.scale) {
      const sx = b.sx ? b.sx(e) : 0, sy = b.sy ? b.sy(e) : 0;
      p[0] = b.scale[0] + (p[0] - b.scale[0]) * (1 + sx * w);
      p[1] = b.scale[1] + (p[1] - b.scale[1]) * (1 + sy * w);
    } else if (b.wave) {
      const ph = b.ph(r[0], r[1], e), ax = b.ax ? b.ax(e) : 0, ay = b.ay ? b.ay(e) : 0;
      p[0] += ax * Math.sin(ph) * w; p[1] += ay * Math.cos(ph) * w;
    } else if (b.move) {
      p[0] += (b.dx ? b.dx(e) : 0) * w; p[1] += (b.dy ? b.dy(e) : 0) * w;
    }
  }

  function run(cfg) {
    const Q = new URLSearchParams(location.search);
    const AMP = parseFloat(Q.get("amp") || "1");
    const FIXED_T = Q.has("t") ? parseFloat(Q.get("t")) : null;
    const DEBUG = Q.has("debug");
    const ONLY = Q.get("layer");
    const ART = cfg.art || [58, 40, 1028, 1645];
    const hint = document.getElementById("hint");
    if (cfg.title) document.title = `塔罗 · ${cfg.title}`;

    const img = new Image();
    img.onload = () => { try { build(); } catch (err) { hint.textContent = "初始化失败：" + err.message; throw err; } };
    img.src = window.CARD_IMG;

    function build() {
      const IW = img.width, IH = img.height, N = IW * IH;
      const base = document.createElement("canvas"); base.width = IW; base.height = IH;
      const bctx = base.getContext("2d", { willReadFrequently: true });
      bctx.drawImage(img, 0, 0);
      const src = bctx.getImageData(0, 0, IW, IH).data;

      const rasterize = (draw, blur = 0) => {
        const c = document.createElement("canvas"); c.width = IW; c.height = IH;
        const g = c.getContext("2d", { willReadFrequently: true });
        if (blur) g.filter = `blur(${blur}px)`;
        g.fillStyle = "#fff"; g.beginPath(); draw(g); g.fill();
        const d = g.getImageData(0, 0, IW, IH).data, m = new Float32Array(N);
        for (let i = 0; i < N; i++) m[i] = d[i * 4 + 3] / 255;
        return m;
      };
      const polyPath = pts => g => { g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); };
      const polysPath = polys => g => { for (const p of polys) polyPath(p)(g); };
      const polysOf = L => (L.polys || [L.poly]);

      // 背景色键：与任一背景色足够接近 → 视为背景
      let key = null;
      if (cfg.key) {
        const { colors, lo = 34, hi = 74 } = cfg.key;
        key = new Float32Array(N);
        for (let i = 0; i < N; i++) {
          let d = 1e9;
          for (const c of colors) d = Math.min(d, Math.hypot(src[i*4] - c[0], src[i*4+1] - c[1], src[i*4+2] - c[2]));
          key[i] = Math.min(1, Math.max(0, (d - lo) / (hi - lo)));
        }
      }

      const polyMask = {};
      for (const L of cfg.layers) polyMask[L.name] = rasterize(polysPath(polysOf(L)), L.blur ?? .8);
      const alpha = {};
      for (const L of cfg.layers) {
        const a = new Float32Array(N), pm = polyMask[L.name];
        const minus = (L.minus || []).map(n => polyMask[n]);
        const circ = (L.minusCircles || []).map(([x, y, r]) => rasterize(g => g.arc(x, y, r, 0, 7)));
        const useKey = L.key && key;
        for (let i = 0; i < N; i++) {
          let v = pm[i]; if (!v) continue;
          if (useKey) v *= key[i];
          for (const m of minus) v *= 1 - m[i];
          for (const m of circ) v *= 1 - m[i];
          a[i] = v;
        }
        alpha[L.name] = a;
      }

      const lum = (x, y) => { const i = (Math.round(y) * IW + Math.round(x)) * 4; return .3 * src[i] + .59 * src[i+1] + .11 * src[i+2]; };
      const ctx = { src, W: IW, H: IH, polyMask, alpha, lum, ART };

      // ---------- 补洞 ----------
      let hole = new Uint8Array(N);
      for (let i = 0; i < N; i++) for (const L of cfg.layers) if (!L.noHole && alpha[L.name][i] > .04) { hole[i] = 1; break; }
      hole = dilate(hole, IW, IH, cfg.dilate ?? 4);
      for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
        const i = y * IW + x;
        if (x < ART[0] || x >= ART[2] || y < ART[1] || y >= ART[3]) { hole[i] = 0; continue; }
        for (const k of cfg.keepRects || []) {
          const [x0, y0, x1, y1] = k.rect;
          if (x >= x0 && x < x1 && y >= y0 && y < y1 && !(k.except || []).some(n => alpha[n][i] > .04)) hole[i] = 0;
        }
      }
      const plate = pushPull(src, hole, IW, IH);
      const pc = document.createElement("canvas"); pc.width = IW; pc.height = IH;
      pc.getContext("2d").putImageData(new ImageData(plate, IW, IH), 0, 0);

      const layers = [{ name: "plate", canvas: pc, box: [0, 0, IW, IH], bones: [], cfg: {} }];
      for (const L of cfg.layers) {
        const box = bboxOf(polysOf(L).flat(), IW, IH);
        layers.push({ name: L.name, canvas: makeLayer(src, alpha[L.name], box, IW, IH, L.extra && (g => L.extra(g, ctx))), box, cfg: L });
      }
      startGL(IW, IH, layers);
      hint.textContent = cfg.hint || "Rider–Waite–Smith · Pam-A 1909 · 移动鼠标互动";
    }

    // ---------- 渲染 ----------
    function startGL(IW, IH, layers) {
      const canvas = document.getElementById("gl");
      const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: true });
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, `
        attribute vec2 p; attribute vec2 uv; uniform vec2 res; varying vec2 v;
        void main(){ v = uv; gl_Position = vec4(p.x / res.x * 2. - 1., 1. - p.y / res.y * 2., 0., 1.); }`));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, `
        precision mediump float; uniform sampler2D tex; varying vec2 v;
        void main(){ gl_FragColor = texture2D(tex, v); }`));
      gl.linkProgram(prog); gl.useProgram(prog);
      const aP = gl.getAttribLocation(prog, "p"), aUV = gl.getAttribLocation(prog, "uv");
      gl.uniform2f(gl.getUniformLocation(prog, "res"), IW, IH);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

      const byName = {};
      for (const L of layers) {
        const [x0, y0, x1, y1] = L.box, step = L.name === "plate" ? 1e9 : (L.cfg.step || 10);
        const nx = Math.max(1, Math.ceil((x1 - x0) / step)), ny = Math.max(1, Math.ceil((y1 - y0) / step));
        const rest = new Float32Array((nx + 1) * (ny + 1) * 2), uv = new Float32Array(rest.length);
        for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
          const k = (j * (nx + 1) + i) * 2, x = x0 + (x1 - x0) * i / nx, y = y0 + (y1 - y0) * j / ny;
          rest[k] = x; rest[k+1] = y; uv[k] = (x - x0) / (x1 - x0); uv[k+1] = (y - y0) / (y1 - y0);
        }
        const idx = new Uint16Array(nx * ny * 6); let q = 0;
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.set([a, b, c, b, d, c], q); q += 6;
        }
        const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, L.canvas);
        for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
        const pb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pb); gl.bufferData(gl.ARRAY_BUFFER, rest, gl.DYNAMIC_DRAW);
        const ub = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ub); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
        const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
        const bones = L.cfg.bones || [], n = rest.length / 2;
        const bw = bones.map(b => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = b.w(rest[i*2], rest[i*2+1]); return a; });
        L.mesh = { rest, pos: new Float32Array(rest), tex, pb, ub, ib, count: idx.length, bw };
        byName[L.name] = L;
      }

      // 单点按某图层骨骼变形（供 follow 使用）
      const deformPoint = (L, x, y, e) => {
        const p = [x, y], r = [x, y];
        for (const b of L.cfg.bones || []) applyBone(b, p, b.w(x, y), e, r);
        if (L.cfg.follow) { const f = L.cfg.follow, q = deformPoint(byName[f.layer], f.point[0], f.point[1], e); p[0] += q[0] - f.point[0]; p[1] += q[1] - f.point[1]; }
        return p;
      };
      const deform = (L, e) => {
        const m = L.mesh, bones = L.cfg.bones || [], R = m.rest, out = m.pos, p = [0, 0], r = [0, 0];
        let ox = 0, oy = 0;
        if (L.cfg.follow) { const f = L.cfg.follow, q = deformPoint(byName[f.layer], f.point[0], f.point[1], e); ox = q[0] - f.point[0]; oy = q[1] - f.point[1]; }
        for (let i = 0, n = R.length / 2; i < n; i++) {
          p[0] = r[0] = R[i*2]; p[1] = r[1] = R[i*2+1];
          for (let k = 0; k < bones.length; k++) applyBone(bones[k], p, m.bw[k][i], e, r);
          out[i*2] = p[0] + ox; out[i*2+1] = p[1] + oy;
        }
      };

      // ---------- 物理 ----------
      const st = {};
      for (const k of Object.keys(cfg.springs || {})) st[k] = { x: 0, v: 0, a: 0 };
      let mx = 0, my = 0, tmx = 0, tmy = 0, lastMove = -1e9;
      addEventListener("pointermove", ev => { tmx = ev.clientX / innerWidth * 2 - 1; tmy = ev.clientY / innerHeight * 2 - 1; lastMove = performance.now(); });
      const env = { t: 0, s: st, amp: AMP, n: noise, wind: 0, mx: 0, my: 0, breath: 0 };
      const setEnv = t => {
        env.t = t; env.mx = mx; env.my = my;
        env.wind = .55 + .45 * noise(t * .21 + 5);
        env.breath = Math.sin(t * 2 * Math.PI / (cfg.breathPeriod || 4.2));
      };
      const step = (t, dt) => {
        setEnv(t);
        for (const [k, sp] of Object.entries(cfg.springs || {})) {
          const s = st[k], target = sp.target ? sp.target(env) : 0, f = sp.force ? sp.force(env) : 0;
          s.a = sp.k * (target - s.x) - sp.c * s.v + f; s.v += s.a * dt; s.x += s.v * dt;
        }
      };

      const fx = document.getElementById("fx"), fctx = fx.getContext("2d");
      const M = cfg.motes;
      const motes = M ? Array.from({ length: M.n || 24 }, () => ({
        x: M.rect[0] + Math.random() * (M.rect[2] - M.rect[0]), y: Math.random() * (M.rect[3] - M.rect[1]),
        v: (M.speed || [4, 14])[0] + Math.random() * ((M.speed || [4, 14])[1] - (M.speed || [4, 14])[0]), r: 1 + Math.random() * 2.2, ph: Math.random() * 6.28 })) : [];

      const card = document.getElementById("card"), glare = document.getElementById("glare");
      let prev = null, acc = 0;
      function frame(now) {
        const t = FIXED_T ?? now / 1000;
        if (now - lastMove > 2500) { tmx = Math.sin(now / 2600) * .45; tmy = Math.cos(now / 3400) * .3; }
        mx += (tmx - mx) * .05; my += (tmy - my) * .05;
        if (FIXED_T != null) { if (prev == null) for (let k = 0; k < 600; k++) step(t - 5 + k / 120, 1 / 120); }
        else {
          acc += prev == null ? 0 : Math.min(.05, (now - prev) / 1000);
          while (acc > 1 / 120) { step(t - acc, 1 / 120); acc -= 1 / 120; }
        }
        prev = now; setEnv(t);

        card.style.transform = `rotateY(${mx * 9}deg) rotateX(${-my * 7}deg)`;
        glare.style.setProperty("--gx", `${50 + mx * 40}%`); glare.style.setProperty("--gy", `${30 + my * 40}%`);

        const dpr = Math.min(devicePixelRatio || 1, 2), cw = Math.round(canvas.clientWidth * dpr), ch = Math.round(canvas.clientHeight * dpr);
        if (canvas.width !== cw) { canvas.width = cw; canvas.height = ch; fx.width = cw; fx.height = ch; }
        gl.viewport(0, 0, cw, ch); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        const sx = cw / IW, sy = ch / IH;

        for (const L of layers) {
          if (ONLY && ONLY !== L.name) continue;
          const m = L.mesh;
          if (L.name !== "plate") {
            deform(L, env);
            gl.enable(gl.SCISSOR_TEST);
            gl.scissor(Math.round(ART[0] * sx), Math.round((IH - ART[3]) * sy), Math.round((ART[2] - ART[0]) * sx), Math.round((ART[3] - ART[1]) * sy));
          } else gl.disable(gl.SCISSOR_TEST);
          gl.bindBuffer(gl.ARRAY_BUFFER, m.pb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, m.pos);
          gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(aP);
          gl.bindBuffer(gl.ARRAY_BUFFER, m.ub); gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(aUV);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib); gl.bindTexture(gl.TEXTURE_2D, m.tex);
          gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_SHORT, 0);
        }

        // 光效
        fctx.setTransform(sx, 0, 0, sy, 0, 0); fctx.clearRect(0, 0, IW, IH);
        fctx.save(); fctx.beginPath(); fctx.rect(ART[0], ART[1], ART[2] - ART[0], ART[3] - ART[1]); fctx.clip();
        fctx.globalCompositeOperation = "lighter";
        for (const g of cfg.glows || []) {
          const a = g.a ? g.a(env) : .2, r1 = typeof g.r1 === "function" ? g.r1(env) : g.r1, c = g.color || [255, 250, 220];
          const gr = fctx.createRadialGradient(g.x, g.y, g.r0 || 0, g.x, g.y, r1);
          gr.addColorStop(0, `rgba(${c},${Math.max(0, a)})`); gr.addColorStop(1, `rgba(${c},0)`);
          fctx.fillStyle = gr; fctx.fillRect(g.x - r1, g.y - r1, r1 * 2, r1 * 2);
        }
        if (M) {
          const h = M.rect[3] - M.rect[1], c = M.color || [255, 252, 225];
          for (const d of motes) {
            const y = ((d.y - t * d.v * (M.dir || 1)) % h + h) % h + M.rect[1], x = d.x + Math.sin(t * .6 + d.ph) * 14;
            fctx.fillStyle = `rgba(${c},${.25 + .35 * Math.abs(Math.sin(t * .9 + d.ph))})`;
            fctx.beginPath(); fctx.arc(x, y, d.r, 0, 7); fctx.fill();
          }
        }
        fctx.globalCompositeOperation = "source-over";
        if (cfg.fx) cfg.fx(fctx, env);
        fctx.restore();
        if (DEBUG) drawDebug(fctx);
        if (FIXED_T == null) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    function drawDebug(g) {
      const cols = ["#f0f", "#0ff", "#00f", "#f00", "#0a0", "#f80", "#808", "#088"];
      g.save(); g.lineWidth = 2; g.font = "bold 22px sans-serif";
      cfg.layers.forEach((L, k) => {
        g.strokeStyle = g.fillStyle = cols[k % cols.length];
        for (const pts of (L.polys || [L.poly])) {
          g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.closePath(); g.stroke();
          g.fillText(L.name, pts[0][0] + 4, pts[0][1] + 20);
        }
        for (const b of L.bones || []) { const p = b.rot || b.scale; if (p) { g.beginPath(); g.arc(p[0], p[1], 6, 0, 7); g.fill(); } }
      });
      g.restore();
    }
  }

  // ---------- 图像处理 ----------
  function dilate(m, W, H, r) {
    const t = new Uint8Array(W * H), o = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) { let last = -1e9;
      for (let x = 0; x < W; x++) { if (m[y*W+x]) last = x; if (x - last <= r) t[y*W+x] = 1; }
      last = 1e9; for (let x = W - 1; x >= 0; x--) { if (m[y*W+x]) last = x; if (last - x <= r) t[y*W+x] = 1; } }
    for (let x = 0; x < W; x++) { let last = -1e9;
      for (let y = 0; y < H; y++) { if (t[y*W+x]) last = y; if (y - last <= r) o[y*W+x] = 1; }
      last = 1e9; for (let y = H - 1; y >= 0; y--) { if (t[y*W+x]) last = y; if (last - y <= r) o[y*W+x] = 1; } }
    return o;
  }

  function bboxOf(pts, W, H) {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    return [Math.max(0, Math.floor(Math.min(...xs)) - 2), Math.max(0, Math.floor(Math.min(...ys)) - 2),
            Math.min(W, Math.ceil(Math.max(...xs)) + 2), Math.min(H, Math.ceil(Math.max(...ys)) + 2)];
  }

  function makeLayer(src, alpha, box, W, H, extra) {
    const [x0, y0, x1, y1] = box, w = x1 - x0, h = y1 - y0;
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"), id = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y + y0) * W + x + x0, o = (y * w + x) * 4;
      id.data[o] = src[i*4]; id.data[o+1] = src[i*4+1]; id.data[o+2] = src[i*4+2]; id.data[o+3] = alpha[i] * 255;
    }
    g.putImageData(id, 0, 0);
    if (extra) { g.save(); g.translate(-x0, -y0); extra(g); g.restore(); }
    return c;
  }

  function pushPull(src, hole, W, H) {
    const lv = [{ w: W, h: H, c: new Float32Array(W * H * 3), a: new Float32Array(W * H) }];
    for (let i = 0; i < W * H; i++) { lv[0].a[i] = hole[i] ? 0 : 1; lv[0].c[i*3] = src[i*4]; lv[0].c[i*3+1] = src[i*4+1]; lv[0].c[i*3+2] = src[i*4+2]; }
    while (lv[lv.length - 1].w > 1 || lv[lv.length - 1].h > 1) {
      const p = lv[lv.length - 1], w = Math.ceil(p.w / 2), h = Math.ceil(p.h / 2);
      const c = new Float32Array(w * h * 3), a = new Float32Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let sr = 0, sg = 0, sb = 0, sa = 0;
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
          const xx = x * 2 + dx, yy = y * 2 + dy; if (xx >= p.w || yy >= p.h) continue;
          const j = yy * p.w + xx, k = p.a[j]; sa += k; sr += p.c[j*3] * k; sg += p.c[j*3+1] * k; sb += p.c[j*3+2] * k;
        }
        const i = y * w + x;
        if (sa > 0) { c[i*3] = sr / sa; c[i*3+1] = sg / sa; c[i*3+2] = sb / sa; }
        a[i] = Math.min(1, sa);
      }
      lv.push({ w, h, c, a });
    }
    for (let l = lv.length - 2; l >= 0; l--) {
      const L = lv[l], P = lv[l + 1];
      for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
        const i = y * L.w + x, k = L.a[i]; if (k >= 1) continue;
        const fx = Math.min(P.w - 1, Math.max(0, (x + .5) / 2 - .5)), fy = Math.min(P.h - 1, Math.max(0, (y + .5) / 2 - .5));
        const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(P.w - 1, x0 + 1), y1 = Math.min(P.h - 1, y0 + 1), tx = fx - x0, ty = fy - y0;
        for (let ch = 0; ch < 3; ch++) {
          const v = (P.c[(y0*P.w+x0)*3+ch] * (1-tx) + P.c[(y0*P.w+x1)*3+ch] * tx) * (1-ty) + (P.c[(y1*P.w+x0)*3+ch] * (1-tx) + P.c[(y1*P.w+x1)*3+ch] * tx) * ty;
          L.c[i*3+ch] = L.c[i*3+ch] * k + v * (1 - k);
        }
        L.a[i] = 1;
      }
    }
    const out = new Uint8ClampedArray(W * H * 4), c = lv[0].c;
    for (let i = 0; i < W * H; i++) {
      const n = hole[i] ? (Math.random() - .5) * 12 : 0;
      out[i*4] = c[i*3] + n; out[i*4+1] = c[i*3+1] + n; out[i*4+2] = c[i*3+2] + n * .6; out[i*4+3] = 255;
    }
    return out;
  }

  window.Live2DCard = { run, W, noise, smooth };
})();
