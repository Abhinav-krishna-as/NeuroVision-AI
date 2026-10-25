/* NeuroVision — tiny neural-network library (no dependencies). */
(function (root) {
  "use strict";
  const ACTS = ["step", "sigmoid", "tanh", "relu"];
  const sig = (x) => 1 / (1 + Math.exp(-x));

  function activate(a, x) {
    switch (a) {
      case "step": return x >= 0 ? 1 : 0;
      case "sigmoid": return sig(x);
      case "tanh": return Math.tanh(x);
      case "relu": return Math.max(0, x);
    }
  }
  /** Derivative w.r.t. z. Step uses a sigmoid surrogate so it can still learn. */
  function dActivate(a, x) {
    switch (a) {
      case "step":
      case "sigmoid": { const s = sig(x); return s * (1 - s); }
      case "tanh": { const t = Math.tanh(x); return 1 - t * t; }
      case "relu": return x > 0 ? 1 : 0.01;
    }
  }
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const bce = (p, y) => {
    const e = 1e-7;
    return -(y * Math.log(p + e) + (1 - y) * Math.log(1 - p + e));
  };

  /** Fully-connected network: hidden layers use `act`, single sigmoid output. */
  class MLP {
    constructor(sizes, act, seed) {
      this.sizes = sizes;
      this.act = act || "sigmoid";
      const r = mulberry32(seed == null ? 1 : seed);
      this.W = [];
      this.b = [];
      for (let l = 1; l < sizes.length; l++) {
        const nIn = sizes[l - 1];
        const scale = Math.sqrt(2 / nIn) * 1.4;
        this.W.push(Array.from({ length: sizes[l] }, () => Array.from({ length: nIn }, () => (r() * 2 - 1) * scale)));
        this.b.push(Array.from({ length: sizes[l] }, () => (r() * 2 - 1) * 0.2));
      }
    }
    clone() {
      const m = Object.create(MLP.prototype);
      m.sizes = this.sizes.slice();
      m.act = this.act;
      m.W = this.W.map((L) => L.map((row) => row.slice()));
      m.b = this.b.map((row) => row.slice());
      return m;
    }
    forward(x) {
      const zs = [], as = [x];
      let a = x;
      for (let l = 0; l < this.W.length; l++) {
        const last = l === this.W.length - 1;
        const z = this.W[l].map((row, j) => row.reduce((s, w, i) => s + w * a[i], this.b[l][j]));
        zs.push(z);
        a = z.map((v) => (last ? sig(v) : activate(this.act, v)));
        as.push(a);
      }
      return { zs, as };
    }
    predict(x) { const { as } = this.forward(x); return as[as.length - 1][0]; }
    trainSample(x, y, lr) {
      const { zs, as } = this.forward(x);
      const L = this.W.length;
      const p = as[L][0];
      let delta = [p - y];
      for (let l = L - 1; l >= 0; l--) {
        const aPrev = as[l];
        let prev = null;
        if (l > 0) {
          prev = aPrev.map((_, i) => {
            let s = 0;
            for (let j = 0; j < delta.length; j++) s += this.W[l][j][i] * delta[j];
            return s * dActivate(this.act, zs[l - 1][i]);
          });
        }
        for (let j = 0; j < delta.length; j++) {
          const row = this.W[l][j];
          for (let i = 0; i < row.length; i++) row[i] -= lr * delta[j] * aPrev[i];
          this.b[l][j] -= lr * delta[j];
        }
        if (prev) delta = prev;
      }
      return bce(p, y);
    }
    epoch(X, Y, lr, rng) {
      rng = rng || Math.random;
      const order = X.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const k = Math.floor(rng() * (i + 1));
        const tmp = order[i]; order[i] = order[k]; order[k] = tmp;
      }
      let s = 0;
      for (const i of order) s += this.trainSample(X[i], Y[i], lr);
      return s / Math.max(1, order.length);
    }
    evaluate(X, Y) {
      if (!X.length) return { loss: 0, acc: 0 };
      let loss = 0, ok = 0;
      X.forEach((x, i) => {
        const p = this.predict(x);
        loss += bce(p, Y[i]);
        if (p >= 0.5 === Y[i] >= 0.5) ok++;
      });
      return { loss: loss / X.length, acc: ok / X.length };
    }
  }

  const GATES = { AND: [0, 0, 0, 1], OR: [0, 1, 1, 1], XOR: [0, 1, 1, 0] };
  const GATE_X = [[0, 0], [0, 1], [1, 0], [1, 1]];

  /** Jittered XOR cloud used by the Network Lab. */
  function xorCloud(n, seed) {
    n = n || 64;
    const r = mulberry32(seed || 11);
    const X = [], Y = [];
    for (let i = 0; i < n; i++) {
      const c = GATE_X[i % 4];
      X.push([c[0] * 0.8 + 0.1 + (r() - 0.5) * 0.16, c[1] * 0.8 + 0.1 + (r() - 0.5) * 0.16]);
      Y.push(c[0] !== c[1] ? 1 : 0);
    }
    return { X, Y };
  }

  /* ---------- Softmax classifier used by the digit demo ---------- */
  class SoftMLP {
    constructor(sizes, seed) {
      this.sizes = sizes;
      const r = mulberry32(seed || 7);
      this.W = [];
      this.b = [];
      for (let l = 1; l < sizes.length; l++) {
        const nIn = sizes[l - 1], s = Math.sqrt(2 / nIn);
        this.W.push(Array.from({ length: sizes[l] }, () => Float64Array.from({ length: nIn }, () => (r() * 2 - 1) * s * 1.7)));
        this.b.push(new Float64Array(sizes[l]));
      }
    }
    forward(x) {
      const as = [x];
      let a = x;
      const L = this.W.length;
      for (let l = 0; l < L; l++) {
        const W = this.W[l], b = this.b[l];
        const z = new Float64Array(W.length);
        for (let j = 0; j < W.length; j++) {
          const row = W[j];
          let s = b[j];
          for (let i = 0; i < row.length; i++) s += row[i] * a[i];
          z[j] = s;
        }
        if (l < L - 1) {
          for (let j = 0; j < z.length; j++) if (z[j] < 0) z[j] *= 0.01;
        } else {
          let mx = -Infinity;
          for (let j = 0; j < z.length; j++) mx = Math.max(mx, z[j]);
          let sum = 0;
          for (let j = 0; j < z.length; j++) { z[j] = Math.exp(z[j] - mx); sum += z[j]; }
          for (let j = 0; j < z.length; j++) z[j] /= sum;
        }
        a = z;
        as.push(a);
      }
      return as;
    }
    train(x, label, lr) {
      const as = this.forward(x);
      const L = this.W.length;
      let delta = Float64Array.from(as[L]);
      delta[label] -= 1;
      for (let l = L - 1; l >= 0; l--) {
        const W = this.W[l], b = this.b[l], aPrev = as[l];
        let prev = null;
        if (l > 0) {
          prev = new Float64Array(aPrev.length);
          for (let j = 0; j < W.length; j++) {
            const row = W[j], d = delta[j];
            for (let i = 0; i < row.length; i++) prev[i] += row[i] * d;
          }
          for (let i = 0; i < prev.length; i++) prev[i] *= aPrev[i] > 0 ? 1 : 0.01;
        }
        for (let j = 0; j < W.length; j++) {
          const row = W[j], d = lr * delta[j];
          for (let i = 0; i < row.length; i++) row[i] -= d * aPrev[i];
          b[j] -= d;
        }
        if (prev) delta = prev;
      }
      return -Math.log(as[L][label] + 1e-9);
    }
  }

  /* ---------- Digit strokes: one rasteriser for training AND drawing ---------- */
  const arc = (cx, cy, rx, ry, a0, a1, n) => {
    n = n || 18;
    return Array.from({ length: n + 1 }, (_, i) => {
      const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
      return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
    });
  };
  const DIGITS = [
    [arc(0.5, 0.5, 0.32, 0.5, 0, 360, 24)],
    [[[0.3, 0.22], [0.55, 0], [0.55, 1]]],
    [arc(0.5, 0.27, 0.32, 0.27, 190, 395, 14).concat([[0.12, 1], [0.9, 1]])],
    [arc(0.48, 0.26, 0.3, 0.26, 200, 450, 14), arc(0.48, 0.74, 0.34, 0.26, 270, 520, 14)],
    [[[0.72, 1], [0.72, 0], [0.08, 0.68], [0.95, 0.68]]],
    [[[0.85, 0], [0.2, 0], [0.16, 0.44]].concat(arc(0.48, 0.68, 0.38, 0.32, 255, 510, 14))],
    [[[0.8, 0.02], [0.45, 0.12], [0.25, 0.4], [0.17, 0.68]].concat(arc(0.5, 0.68, 0.33, 0.32, 180, 540, 20))],
    [[[0.08, 0], [0.92, 0], [0.4, 1]]],
    [arc(0.5, 0.27, 0.28, 0.25, 0, 360, 18), arc(0.5, 0.74, 0.34, 0.27, 0, 360, 20)],
    [arc(0.5, 0.32, 0.32, 0.3, 0, 360, 20), [[0.82, 0.32], [0.78, 0.75], [0.4, 1]]],
  ];

  /** Densify polylines so that jitter reads as hand-drawn wobble. */
  function densify(strokes, step) {
    return strokes.map((s) => {
      const out = [s[0]];
      for (let i = 1; i < s.length; i++) {
        const a = s[i - 1], b = s[i];
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const n = Math.max(1, Math.round(d / step));
        for (let k = 1; k <= n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
      }
      return out;
    });
  }

  /**
   * Rasterise strokes (any coordinate space) to a 28x28 grid, scaled so the drawing
   * fits a 20px box and centred on its centre of mass (MNIST-style), then 2x2 pooled to 14x14.
   */
  function featurize(strokes, thick) {
    thick = thick || 1.7;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of strokes) for (const p of s) {
      x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
    }
    const w = Math.max(x1 - x0, 1e-6), h = Math.max(y1 - y0, 1e-6);
    const sc = 20 / Math.max(w, h, 0.0001);
    const tx = (p) => (p[0] - x0) * sc + (28 - w * sc) / 2;
    const ty = (p) => (p[1] - y0) * sc + (28 - h * sc) / 2;
    const g = new Float32Array(784);
    for (const s of strokes) {
      for (let i = 0; i < s.length; i++) {
        const a = [tx(s[i]), ty(s[i])];
        const b = i + 1 < s.length ? [tx(s[i + 1]), ty(s[i + 1])] : a;
        const minx = Math.max(0, Math.floor(Math.min(a[0], b[0]) - thick - 1)), maxx = Math.min(27, Math.ceil(Math.max(a[0], b[0]) + thick + 1));
        const miny = Math.max(0, Math.floor(Math.min(a[1], b[1]) - thick - 1)), maxy = Math.min(27, Math.ceil(Math.max(a[1], b[1]) + thick + 1));
        const dx = b[0] - a[0], dy = b[1] - a[1], len2 = dx * dx + dy * dy;
        for (let yy = miny; yy <= maxy; yy++) for (let xx = minx; xx <= maxx; xx++) {
          const px = xx + 0.5, py = yy + 0.5;
          let t = len2 ? ((px - a[0]) * dx + (py - a[1]) * dy) / len2 : 0;
          t = Math.max(0, Math.min(1, t));
          const d = Math.hypot(px - (a[0] + dx * t), py - (a[1] + dy * t));
          const v = Math.max(0, Math.min(1, thick + 0.6 - d));
          const k = yy * 28 + xx;
          if (v > g[k]) g[k] = v;
        }
      }
    }
    // centre of mass shift
    let m = 0, cx = 0, cy = 0;
    for (let yy = 0; yy < 28; yy++) for (let xx = 0; xx < 28; xx++) { const v = g[yy * 28 + xx]; m += v; cx += v * xx; cy += v * yy; }
    let g2 = g;
    if (m > 0) {
      const sx = Math.round(13.5 - cx / m), sy = Math.round(13.5 - cy / m);
      g2 = new Float32Array(784);
      for (let yy = 0; yy < 28; yy++) for (let xx = 0; xx < 28; xx++) {
        const nx = xx + sx, ny = yy + sy;
        if (nx >= 0 && nx < 28 && ny >= 0 && ny < 28) g2[ny * 28 + nx] = g[yy * 28 + xx];
      }
    }
    const out = new Float64Array(196);
    for (let yy = 0; yy < 14; yy++) for (let xx = 0; xx < 14; xx++) {
      out[yy * 14 + xx] = (g2[yy * 2 * 28 + xx * 2] + g2[yy * 2 * 28 + xx * 2 + 1] + g2[(yy * 2 + 1) * 28 + xx * 2] + g2[(yy * 2 + 1) * 28 + xx * 2 + 1]) / 4;
    }
    return out;
  }

  /** A randomly "hand-drawn" version of digit d. */
  function sampleDigit(d, rng) {
    rng = rng || Math.random;
    const j = (a) => (rng() * 2 - 1) * a;
    const rot = j(0.22), shear = j(0.25), sx = 0.85 + rng() * 0.3, sy = 0.85 + rng() * 0.3;
    const wob = 0.025 + rng() * 0.03;
    const strokes = densify(DIGITS[d], 0.07).map((s) => {
      const phase = rng() * 6, freq = 3 + rng() * 4;
      return s.map((p, i) => {
        let x = (p[0] - 0.5) * sx + (p[1] - 0.5) * shear, y = (p[1] - 0.5) * sy;
        const c = Math.cos(rot), sn = Math.sin(rot);
        const rx = x * c - y * sn, ry = x * sn + y * c;
        return [rx + Math.sin(i / freq + phase) * wob + j(0.012), ry + Math.cos(i / freq + phase) * wob + j(0.012)];
      });
    });
    return { strokes, thick: 1.4 + rng() * 0.9 };
  }

  root.NVNN = { ACTS, activate, dActivate, mulberry32, MLP, SoftMLP, GATES, GATE_X, xorCloud, DIGITS, featurize, sampleDigit, densify };
  if (typeof module !== "undefined") module.exports = root.NVNN;
})(typeof window !== "undefined" ? window : globalThis);
