/* NeuroVision — Demo experiments: digit recognition, one neuron vs many, decision boundary. */
(function () {
  "use strict";
  const N = window.NVNN;
  const t = (k) => NV.t(k);
  const $ = (id) => document.getElementById(id);
  const C = NV.C, rgba = NV.rgba;
  const ORANGE = C.hot, CYAN = C.cyan;

  /* =============================== Tabs =============================== */
  const TABS = ["digits", "gates", "boundary"];
  function showTab(name, focus) {
    TABS.forEach((n) => {
      const on = n === name, tab = $("tab-" + n);
      tab.setAttribute("aria-selected", on);
      tab.tabIndex = on ? 0 : -1;
      $("panel-" + n).hidden = !on;
    });
    if (focus) $("tab-" + name).focus();
    try { history.replaceState(null, "", "#" + name); } catch (e) {}
    if (name !== "boundary") bd.stop();
    if (name !== "gates") gates.stop();
    NV.bg.kick();
  }
  function initTabs() {
    TABS.forEach((n) => $("tab-" + n).addEventListener("click", () => showTab(n)));
    $("demo-tabs").addEventListener("keydown", (e) => {
      const i = TABS.findIndex((n) => $("tab-" + n) === document.activeElement);
      if (i < 0) return;
      let k = -1;
      if (e.key === "ArrowRight") k = (i + 1) % 3; else if (e.key === "ArrowLeft") k = (i + 2) % 3;
      else if (e.key === "Home") k = 0; else if (e.key === "End") k = 2;
      if (k >= 0) { e.preventDefault(); showTab(TABS[k], true); }
    });
    const h = location.hash.replace("#", "");
    showTab(TABS.includes(h) ? h : "digits");
  }

  /** Segmented radio group helper. */
  function radioGroup(host, items, onPick) {
    let cur = items[0].id;
    const btns = items.map((it) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "seg-btn"; b.setAttribute("role", "radio");
      b.addEventListener("click", () => { cur = it.id; sync(); onPick(it.id); });
      host.appendChild(b); return b;
    });
    const sync = () => btns.forEach((b, i) => { b.setAttribute("aria-checked", items[i].id === cur); b.tabIndex = items[i].id === cur ? 0 : -1; });
    host.addEventListener("keydown", (e) => {
      const i = items.findIndex((it) => it.id === cur);
      let k = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") k = (i + 1) % items.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") k = (i + items.length - 1) % items.length;
      if (k >= 0) { e.preventDefault(); cur = items[k].id; sync(); btns[k].focus(); onPick(cur); }
    });
    return {
      labels: () => btns.forEach((b, i) => { b.textContent = typeof items[i].label === "function" ? items[i].label() : items[i].label; }),
      get: () => cur, set: (id) => { cur = id; sync(); }, sync,
    };
  }

  const canvasPos = (cv, e) => {
    const r = cv.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * cv.width, ((e.clientY - r.top) / r.height) * cv.height];
  };
  const argmax = (a) => { let b = 0; for (let i = 1; i < a.length; i++) if (a[i] > a[b]) b = i; return b; };

  /* ============================ 1. Digits ============================ */
  const digits = (function () {
    const cv = $("digit-canvas"), ctx = cv.getContext("2d");
    const netCv = $("digit-net"), nctx = netCv.getContext("2d");
    const prevCv = $("digit-preview"), pctx = prevCv.getContext("2d");
    const SIZES = [196, 48, 24, 10];
    const TOTAL = 15000, PER_FRAME = 150;
    let model = new N.SoftMLP(SIZES, 7), trained = false, progress = 0, acc = null;
    let strokes = [], drawing = false, lastActs = null, pending = false;

    // prob rows
    $("digit-probs").innerHTML = Array.from({ length: 10 }, (_, d) =>
      `<li class="prob" id="prob-${d}"><span>${d}</span><span class="bar"><i></i></span><span class="pct">0%</span></li>`).join("");

    function drawCanvas() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      // faint grid
      ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo((cv.width * i) / 4, 0); ctx.lineTo((cv.width * i) / 4, cv.height); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, (cv.height * i) / 4); ctx.lineTo(cv.width, (cv.height * i) / 4); ctx.stroke(); }
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 24;
      ctx.strokeStyle = "#fff"; ctx.shadowColor = rgba(C.cyan, 0.7); ctx.shadowBlur = 14;
      for (const s of strokes) {
        ctx.beginPath();
        s.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        if (s.length === 1) ctx.lineTo(s[0][0] + 0.01, s[0][1]);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    function drawNet(acts) {
      const W = netCv.width, H = netCv.height;
      nctx.clearRect(0, 0, W, H);
      const colX = [64, 270, 450, 640], cy0 = H / 2 + 12;
      const pos = (l, i, n) => {
        if (l === 0) return [colX[0], cy0];
        const span = l === 3 ? H - 96 : H - 64;
        return [colX[l], cy0 - span / 2 + (n === 1 ? span / 2 : (span * i) / (n - 1))];
      };
      // column headers + faint guides
      const heads = [["Input", "14×14"], ["Hidden 1", "48"], ["Hidden 2", "24"], ["Output", "10"]];
      nctx.textBaseline = "alphabetic";
      heads.forEach((hd, l) => {
        const cx = l === 0 ? colX[0] + 4 : colX[l];
        nctx.strokeStyle = "rgba(255,255,255,0.05)"; nctx.lineWidth = 1; nctx.setLineDash([2, 4]);
        nctx.beginPath(); nctx.moveTo(cx, 40); nctx.lineTo(cx, H - 8); nctx.stroke(); nctx.setLineDash([]);
        nctx.textAlign = "center";
        nctx.fillStyle = "rgba(255,255,255,0.85)"; nctx.font = "600 15px Manrope, sans-serif"; nctx.fillText(hd[0], cx, 20);
        nctx.fillStyle = "rgba(163,163,163,0.9)"; nctx.font = "13px 'JetBrains Mono', monospace"; nctx.fillText(hd[1], cx, 34);
      });
      // input grid
      const cell = 8, gx = colX[0] + 4 - (14 * cell) / 2, gy = cy0 - (14 * cell) / 2;
      for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) {
        const v = acts ? acts[0][y * 14 + x] : 0;
        nctx.fillStyle = `rgba(56,189,248,${0.08 + Math.min(1, v) * 0.92})`;
        nctx.fillRect(gx + x * cell, gy + y * cell, cell - 1, cell - 1);
      }
      if (!acts) return;
      const drawEdges = (l, thresh) => {
        const Wm = model.W[l - 1], prev = acts[l - 1], nIn = SIZES[l - 1], nOut = SIZES[l];
        let mx = 0;
        const vals = [];
        for (let j = 0; j < nOut; j++) for (let i = 0; i < nIn; i++) { const v = Wm[j][i] * prev[i]; vals.push([i, j, v]); mx = Math.max(mx, Math.abs(v)); }
        for (const [i, j, v] of vals) {
          const s = Math.abs(v) / (mx || 1);
          if (s < thresh) continue;
          const a = pos(l - 1, i, nIn), b = pos(l, j, nOut);
          nctx.strokeStyle = v >= 0 ? rgba(C.cyan, 0.08 + s * 0.6) : rgba(C.neg, 0.08 + s * 0.6);
          nctx.lineWidth = 0.4 + s * 1.2;
          nctx.beginPath(); nctx.moveTo(a[0], a[1]); nctx.lineTo(b[0], b[1]); nctx.stroke();
        }
      };
      drawEdges(2, 0.28); drawEdges(3, 0.12);
      // input -> h1 fan: strongest contributions per hidden node
      for (let j = 0; j < SIZES[1]; j++) {
        const row = model.W[0][j]; let bi = 0, bv = 0;
        for (let i = 0; i < 196; i++) { const v = row[i] * acts[0][i]; if (Math.abs(v) > Math.abs(bv)) { bv = v; bi = i; } }
        if (Math.abs(bv) < 0.15) continue;
        const b = pos(1, j, SIZES[1]);
        nctx.strokeStyle = rgba(bv > 0 ? C.cyan : C.neg, Math.min(0.45, Math.abs(bv) * 0.3));
        nctx.lineWidth = 0.6;
        nctx.beginPath(); nctx.moveTo(gx + 14 * cell, gy + (Math.floor(bi / 14) + 0.5) * cell); nctx.lineTo(b[0], b[1]); nctx.stroke();
      }
      const best = argmax(acts[3]);
      for (let l = 1; l <= 3; l++) {
        const a = acts[l], n = SIZES[l];
        let mx = 1e-6; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(a[i]));
        const r = l === 1 ? 2.4 : l === 2 ? 4 : 8;
        for (let i = 0; i < n; i++) {
          const [x, y] = pos(l, i, n), v = Math.max(0, a[i]) / (l === 3 ? 1 : mx);
          const col = l === 3 ? (i === best ? C.green : C.violet) : l === 1 ? C.violet : C.cyan;
          nctx.fillStyle = rgba(col, 0.15 + v * 0.85);
          nctx.beginPath(); nctx.arc(x, y, r, 0, Math.PI * 2); nctx.fill();
          nctx.strokeStyle = rgba(col, 0.8); nctx.lineWidth = 1; nctx.stroke();
          if (l === 3) {
            nctx.fillStyle = "#fff"; nctx.font = "600 11px 'JetBrains Mono', monospace"; nctx.textAlign = "left"; nctx.textBaseline = "middle";
            nctx.fillText(String(i), x + 14, y);
          }
        }
      }
    }

    function renderProbs(p) {
      const best = p ? argmax(p) : -1;
      for (let d = 0; d < 10; d++) {
        const row = $("prob-" + d), v = p ? p[d] : 0;
        row.classList.toggle("top", d === best && v > 0.2);
        row.querySelector("i").style.width = `${(v * 100).toFixed(1)}%`;
        row.querySelector(".pct").textContent = `${Math.round(v * 100)}%`;
      }
      const big = $("digit-pred");
      big.textContent = p && p[best] > 0.2 ? String(best) : "–";
    }

    function renderStatus() {
      const done = trained;
      $("digit-status").classList.toggle("done", done);
      $("digit-status-text").textContent = done ? t("trainedModel") : `${t("trainingModel")} ${Math.round(progress * 100)}%`;
      const bar = $("digit-progress");
      bar.setAttribute("aria-valuenow", Math.round(progress * 100));
      bar.querySelector("i").style.width = `${progress * 100}%`;
      bar.style.visibility = done ? "hidden" : "visible";
      $("digit-info").textContent = done ? `${t("trainedInfo")}${acc != null ? ` · ${Math.round(acc * 100)}% ${t("testAcc")}` : ""}` : "";
      $("digit-hint").textContent = strokes.length ? "" : t("drawSomething");
    }

    function predict() {
      pending = false;
      if (!strokes.length) { lastActs = null; pctx.clearRect(0, 0, 14, 14); renderProbs(null); drawNet(null); renderStatus(); return; }
      const x = N.featurize(strokes.map((s) => s.map((p) => [p[0], p[1]])), 1.7);
      // preview
      const im = pctx.createImageData(14, 14);
      for (let i = 0; i < 196; i++) { const v = Math.min(1, x[i]) * 255; im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
      pctx.putImageData(im, 0, 0);

      // Update raster telemetry HUD (Photo 2 Fix)
      let activePx = 0, sumX = 0, sumY = 0;
      for (let y = 0; y < 14; y++) for (let xCol = 0; xCol < 14; xCol++) {
        const val = x[y * 14 + xCol];
        if (val > 0.08) {
          activePx++;
          sumX += xCol * val;
          sumY += y * val;
        }
      }
      const activeEl = $("digit-active-px");
      const centroidEl = $("digit-centroid");
      if (activeEl) activeEl.textContent = `${activePx} / 196 (${Math.round((activePx / 196) * 100)}%)`;
      if (centroidEl) {
        if (activePx > 0) {
          const cx = (sumX / activePx).toFixed(1);
          const cy = (sumY / activePx).toFixed(1);
          centroidEl.textContent = `${cx}, ${cy}`;
        } else {
          centroidEl.textContent = "0.0, 0.0";
        }
      }

      if (!trained) { drawNet(null); renderStatus(); return; }
      lastActs = model.forward(x);
      renderProbs(lastActs[3]); drawNet(lastActs); renderStatus();
    }
    const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(predict); } };

    function clear() { strokes = []; drawCanvas(); predict(); }

    function sample(d) {
      strokes = N.DIGITS[d].map((s) => s.map((p) => [60 + p[0] * 300, 50 + p[1] * 320]));
      drawCanvas(); predict();
    }

    function bind() {
      cv.addEventListener("pointerdown", (e) => {
        cv.setPointerCapture(e.pointerId); cv.focus({ preventScroll: true });
        drawing = true; strokes.push([canvasPos(cv, e)]); drawCanvas(); schedule();
      });
      cv.addEventListener("pointermove", (e) => {
        if (!drawing) return;
        const s = strokes[strokes.length - 1], p = canvasPos(cv, e), l = s[s.length - 1];
        if (Math.hypot(p[0] - l[0], p[1] - l[1]) < 2) return;
        s.push(p); drawCanvas(); schedule();
      });
      const end = () => { drawing = false; };
      cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
      cv.addEventListener("keydown", (e) => {
        if (/^[0-9]$/.test(e.key)) { e.preventDefault(); sample(+e.key); }
        else if (e.key === "Delete" || e.key === "Backspace" || e.key === "Escape") { e.preventDefault(); clear(); }
      });
      $("digit-clear").addEventListener("click", clear);
      $("digit-mirror").addEventListener("click", (e) => {
        const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
        e.currentTarget.setAttribute("aria-pressed", on);
        $("digit-grid").classList.toggle("flip", on);
      });

      // Quick sample preset buttons (Photo 2 Fix)
      document.querySelectorAll(".num-key").forEach((b) => {
        b.addEventListener("click", () => sample(+b.dataset.digit));
      });
    }

    function startTraining() {
      NV.bg.set({ training: true, accuracy: 0.5 });
      let done = 0, loss = 0;
      const step = () => {
        const end = Math.min(TOTAL, done + PER_FRAME);
        for (; done < end; done++) {
          const d = done % 10, s = N.sampleDigit(d);
          model.train(N.featurize(s.strokes, s.thick), d, 0.03 - (0.02 * done) / TOTAL);
        }
        progress = done / TOTAL;
        NV.bg.set({ accuracy: 0.5 + 0.5 * progress * 0.9 });
        renderStatus();
        if (done < TOTAL) requestAnimationFrame(step);
        else {
          let ok = 0; const T = 300;
          for (let i = 0; i < T; i++) { const d = i % 10, s = N.sampleDigit(d); if (argmax(model.forward(N.featurize(s.strokes, s.thick))[3]) === d) ok++; }
          acc = ok / T; trained = true;
          NV.bg.set({ training: false, accuracy: acc });
          predict();
        }
      };
      requestAnimationFrame(step);
    }

    return {
      init() { bind(); drawCanvas(); drawNet(null); renderProbs(null); renderStatus(); startTraining(); },
      text() { renderStatus(); },
    };
  })();

  /* ============================ 2. Gates ============================ */
  const gates = (function () {
    const cv = $("gate-canvas"), ctx = cv.getContext("2d");
    let gate = "XOR", kind = "hidden", model = null, raf = 0, running = false, trainedOnce = false;
    const mk = () => (kind === "one" ? new N.MLP([2, 1], "sigmoid", 5) : new N.MLP([2, 4, 1], "tanh", 5));
    const gateName = () => gate;
    let pickG, pickM;

    function draw() {
      const W = cv.width, H = cv.height, G = 40, lo = -0.3, hi = 1.3;
      const off = document.createElement("canvas"); off.width = G; off.height = G;
      const octx = off.getContext("2d"), im = octx.createImageData(G, G);
      for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
        const px = lo + ((x + 0.5) / G) * (hi - lo), py = lo + ((y + 0.5) / G) * (hi - lo);
        const p = model.predict([px, 1 - py]);
        const c = NV.mix(ORANGE, CYAN, p), i = (y * G + x) * 4;
        im.data[i] = c[0]; im.data[i + 1] = c[1]; im.data[i + 2] = c[2]; im.data[i + 3] = 70 + Math.abs(p - 0.5) * 120;
      }
      octx.putImageData(im, 0, 0);
      ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, W, H);
      const X = (v) => ((v - lo) / (hi - lo)) * W, Y = (v) => (1 - (v - lo) / (hi - lo)) * H;
      // 0.5 contour hint: grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
      [0, 1].forEach((v) => { ctx.beginPath(); ctx.moveTo(X(v), 0); ctx.lineTo(X(v), H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, Y(v)); ctx.lineTo(W, Y(v)); ctx.stroke(); });
      N.GATE_X.forEach((x, i) => {
        const y = N.GATES[gate][i], cx = X(x[0]), cy = Y(x[1]);
        ctx.fillStyle = y ? rgba(CYAN, 1) : rgba(ORANGE, 1); ctx.strokeStyle = "#fff"; ctx.lineWidth = 3;
        ctx.beginPath();
        if (y) ctx.arc(cx, cy, 15, 0, Math.PI * 2); else ctx.rect(cx - 14, cy - 14, 28, 28);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#02040A"; ctx.font = "700 14px 'JetBrains Mono', monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(y), cx, cy + 1);
      });
    }

    function results() {
      const ys = N.GATES[gate];
      let ok = 0;
      $("gate-results").innerHTML = N.GATE_X.map((x, i) => {
        const p = model.predict(x), pred = p >= 0.5 ? 1 : 0, good = pred === ys[i];
        if (good) ok++;
        return `<li><span>${x[0]} ${gate} ${x[1]} = ${ys[i]}</span><span class="${good ? "ok" : "bad"}">${p.toFixed(2)} → ${pred} ${good ? "✓" : "✗"}</span></li>`;
      }).join("");

      // Update dynamic Truth Table (Photo 3 Fix)
      const truthBody = $("gate-truth-body");
      if (truthBody) {
        truthBody.innerHTML = N.GATE_X.map((x, i) => {
          const p = model.predict(x), pred = p >= 0.5 ? 1 : 0, good = pred === ys[i];
          return `<tr>
            <td style="color:var(--cyan); font-weight:700;">${x[0]}</td>
            <td style="color:var(--cyan); font-weight:700;">${x[1]}</td>
            <td style="color:#ffffff; font-weight:700;">${ys[i]}</td>
            <td style="color:${good ? "var(--neuron-output)" : "var(--neg)"}; font-weight:700;">${p.toFixed(2)} (${pred})</td>
            <td><span class="${good ? "ok" : "bad"}">${good ? "PASS ✓" : "FAIL ✗"}</span></td>
          </tr>`;
        }).join("");
      }

      // Update Separability Analysis (Photo 3 Fix)
      const sepBadge = $("gate-sep-badge");
      const eqEl = $("gate-equation");
      const noteEl = $("gate-theorem-note");

      if (gate === "XOR") {
        if (kind === "one") {
          if (sepBadge) {
            sepBadge.textContent = "NON-SEPARABLE (1 LINE CANNOT SPLIT)";
            sepBadge.style.color = "var(--neg)";
            sepBadge.style.borderColor = "rgba(244,63,94,0.4)";
          }
          if (eqEl) eqEl.textContent = "Single Hyperplane: w₁·x₁ + w₂·x₂ + b = 0";
          if (noteEl) noteEl.textContent = "Minsky & Papert (1969): Single linear hyperplane cannot partition XOR truth cases.";
        } else {
          if (sepBadge) {
            sepBadge.textContent = "SOLVED WITH 2 HYPERPLANES";
            sepBadge.style.color = "var(--neuron-output)";
            sepBadge.style.borderColor = "rgba(52,211,153,0.4)";
          }
          if (eqEl) eqEl.textContent = "Multi-Layer: σ(W₂ · tanh(W₁ · X + b₁) + b₂)";
          if (noteEl) noteEl.textContent = "Hidden layer non-linearly transforms feature space, allowing 4 cases to be split cleanly.";
        }
      } else {
        if (sepBadge) {
          sepBadge.textContent = "LINEARLY SEPARABLE";
          sepBadge.style.color = "var(--cyan)";
          sepBadge.style.borderColor = "rgba(34,211,238,0.4)";
        }
        if (eqEl) eqEl.textContent = "Single Hyperplane: w₁·x₁ + w₂·x₂ + b = 0";
        if (noteEl) noteEl.textContent = `${gate} cases can be cleanly separated by a single straight decision boundary.`;
      }

      $("gate-score").textContent = `${ok}/4 ${t("correct")}`;
      const v = $("gate-verdict");
      if (!trainedOnce) v.textContent = "";
      else if (ok === 4) v.textContent = t("solved");
      else if (!running) v.textContent = gate === "XOR" && kind === "one" ? t("xorFail") : "";
      return ok;
    }
    function title() { $("gate-score-title").textContent = `${gateName()} · ${kind === "one" ? t("oneNeuron") : t("hiddenLayer")}`; }
    function render() { draw(); results(); title(); }

    function stop() { cancelAnimationFrame(raf); if (running) { running = false; NV.bg.set({ training: false }); } const b = $("gate-train"); b.disabled = false; b.textContent = t("train"); }
    function reset() { stop(); model = mk(); trainedOnce = false; render(); }
    function train() {
      if (running) return;
      running = true; trainedOnce = true; const btn = $("gate-train"); btn.disabled = true; btn.textContent = t("training");
      NV.bg.set({ training: true });
      const ys = N.GATES[gate], rng = N.mulberry32(Date.now() & 0xffff), TOTAL = 3000, per = NV.reduced() ? 3000 : 40;
      let done = 0;
      const step = () => {
        for (let k = 0; k < per && done < TOTAL; k++, done++) model.epoch(N.GATE_X, ys, 0.5, rng);
        const ok = results(); draw();
        NV.bg.set({ accuracy: 0.5 + ok / 8 });
        if (done < TOTAL) raf = requestAnimationFrame(step);
        else { stop(); results(); }
      };
      raf = requestAnimationFrame(step);
    }

    return {
      init() {
        pickG = radioGroup($("gate-pick"), Object.keys(N.GATES).map((g) => ({ id: g, label: g })), (g) => { gate = g; reset(); });
        pickM = radioGroup($("gate-model"), [{ id: "one", label: () => t("oneNeuron") }, { id: "hidden", label: () => t("hiddenLayer") }], (k) => { kind = k; reset(); });
        pickG.set(gate); pickM.set(kind); pickG.labels(); pickM.labels();
        $("gate-train").addEventListener("click", train); $("gate-reset").addEventListener("click", reset);
        model = mk(); render();
      },
      text() { pickM.labels(); if (!running) $("gate-train").textContent = t("train"); render(); },
      stop,
    };
  })();

  /* ============================ 3. Boundary ============================ */
  const bd = (function () {
    const cv = $("bd-canvas"), ctx = cv.getContext("2d");
    let pts = [], model = null, running = false, raf = 0, team = 1, cursor = [0.5, 0.5], seed = 11, pick;
    const mk = () => new N.MLP([2, 10, 8, 1], "tanh", seed);
    const inp = (x, y) => [(x - 0.5) * 2, (y - 0.5) * 2];

    function initialPoints() {
      const r = N.mulberry32(5), out = [];
      for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.17; out.push({ x: 0.5 + Math.cos(a) * d, y: 0.5 + Math.sin(a) * d, c: 1 }); }
      for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2 + r() * 0.2, d = 0.36 + r() * 0.06; out.push({ x: 0.5 + Math.cos(a) * d, y: 0.5 + Math.sin(a) * d, c: 0 }); }
      return out;
    }

    function draw() {
      const W = cv.width, H = cv.height, G = 56;
      const off = document.createElement("canvas"); off.width = G; off.height = G;
      const octx = off.getContext("2d"), im = octx.createImageData(G, G);
      for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
        const p = model.predict(inp((x + 0.5) / G, (y + 0.5) / G));
        const c = NV.mix(ORANGE, CYAN, p), i = (y * G + x) * 4;
        im.data[i] = c[0]; im.data[i + 1] = c[1]; im.data[i + 2] = c[2]; im.data[i + 3] = 60 + Math.abs(p - 0.5) * 150;
      }
      octx.putImageData(im, 0, 0);
      ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1;
      for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo((W * i) / 8, 0); ctx.lineTo((W * i) / 8, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, (H * i) / 8); ctx.lineTo(W, (H * i) / 8); ctx.stroke(); }
      for (const p of pts) {
        const x = p.x * W, y = p.y * H;
        ctx.fillStyle = p.c ? rgba(CYAN, 1) : rgba(ORANGE, 1); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
        ctx.beginPath();
        if (p.c) ctx.arc(x, y, 8, 0, Math.PI * 2); else ctx.rect(x - 7, y - 7, 14, 14);
        ctx.fill(); ctx.stroke();
      }
      if (document.activeElement === cv) {
        const x = cursor[0] * W, y = cursor[1] * H;
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 22, y); ctx.lineTo(x + 22, y); ctx.moveTo(x, y - 22); ctx.lineTo(x, y + 22); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    function count() {
      const a = pts.filter((p) => p.c).length, b = pts.length - a;
      $("bd-count").textContent = `${pts.length} ${t("points")} · ○ ${a} · □ ${b}`;
    }
    function add(x, y) {
      pts.push({ x: Math.max(0.02, Math.min(0.98, x)), y: Math.max(0.02, Math.min(0.98, y)), c: team });
      count(); draw();
    }
    function stop() { cancelAnimationFrame(raf); if (running) { running = false; NV.bg.set({ training: false }); } $("bd-train").textContent = t("train"); }
    function toggle() {
      if (running) { stop(); return; }
      if (!pts.length) return;
      running = true; $("bd-train").textContent = t("pause"); NV.bg.set({ training: true });
      const step = () => {
        const Xs = pts.map((p) => inp(p.x, p.y)), Ys = pts.map((p) => p.c);
        const per = NV.reduced() ? 40 : 6;
        for (let k = 0; k < per; k++) model.epoch(Xs, Ys, 0.06);
        const ev = model.evaluate(Xs, Ys); NV.bg.set({ accuracy: ev.acc });
        draw(); raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    function reset() { stop(); pts = initialPoints(); seed = 11; model = mk(); count(); draw(); }
    function clear() { stop(); pts = []; model = mk(); count(); draw(); }

    return {
      init() {
        pick = radioGroup($("team-pick"), [{ id: 1, label: () => t("cyanTeam") }, { id: 0, label: () => t("orangeTeam") }], (id) => { team = +id; });
        pick.set(1); pick.labels();
        pts = initialPoints(); model = mk();
        cv.addEventListener("pointerdown", (e) => { const [x, y] = canvasPos(cv, e); cursor = [x / cv.width, y / cv.height]; add(cursor[0], cursor[1]); });
        cv.addEventListener("keydown", (e) => {
          const s = (e.shiftKey ? 0.1 : 0.025);
          if (e.key === "ArrowLeft") cursor[0] -= s; else if (e.key === "ArrowRight") cursor[0] += s;
          else if (e.key === "ArrowUp") cursor[1] -= s; else if (e.key === "ArrowDown") cursor[1] += s;
          else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); add(cursor[0], cursor[1]); return; }
          else return;
          e.preventDefault();
          cursor = cursor.map((v) => Math.max(0.02, Math.min(0.98, v))); draw();
        });
        cv.addEventListener("focus", draw); cv.addEventListener("blur", draw);
        $("bd-train").addEventListener("click", toggle); $("bd-clear").addEventListener("click", clear); $("bd-reset").addEventListener("click", reset);
        count(); draw();
      },
      text() { pick.labels(); if (!running) $("bd-train").textContent = t("train"); else $("bd-train").textContent = t("pause"); count(); },
      stop,
    };
  })();

  document.addEventListener("nv-ready", () => {
    digits.init(); gates.init(); bd.init(); initTabs();
    NV.onLang(() => { digits.text(); gates.text(); bd.text(); });
    NV.applyI18n(); digits.text(); gates.text(); bd.text();
    window.addEventListener("pagehide", () => NV.bg.set({ training: false }));
  });
})();
