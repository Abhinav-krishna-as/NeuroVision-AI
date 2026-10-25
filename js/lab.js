/* NeuroVision — Network Lab page: hero art, training card, live diagram, neuron side panel. */
(function () {
  "use strict";
  const { MLP, mulberry32, xorCloud, ACTS } = window.NVNN;
  const t = (k) => NV.t(k);
  const $ = (id) => document.getElementById(id);

  const DATA = xorCloud();
  const SEED = 3;
  const fresh = () => new MLP([2, 4, 3, 1], "sigmoid", SEED);
  const TRAIN_EPOCHS = 1500;
  const LAYER_COLORS = ["var(--neuron-input)", "var(--neuron-hidden)", "var(--neuron-hidden)", "var(--neuron-output)"];
  const neuronName = (l, j) => (l === 0 ? `x${j + 1}` : l === 3 ? "O-1" : `H${l}-${j + 1}`);
  const ACT_LABEL = { step: "Step", sigmoid: "Sigmoid", tanh: "Tanh", relu: "ReLU" };

  let model = fresh(), saved = fresh();
  let inputs = [0.3, 0.7];
  let sel = { l: 1, j: 0 };
  let lr = 0.1;
  let stats = { loss: 0.68, acc: 0.5, live: false };
  let training = false, pulse = null, raf = 0;
  let panelRefs = null;

  /* ---------- Hero illustration ---------- */
  function buildHero() {
    const LAYERS = [6, 8, 9, 8, 3], W = 800, H = 640;
    const hex = (x, y, r) => Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
    }).join(" ");
    const nodes = LAYERS.flatMap((n, l) => {
      const x = 70 + (l * (W - 140)) / (LAYERS.length - 1), span = n * 62;
      return Array.from({ length: n }, (_, j) => ({ x, y: H / 2 - span / 2 + (span * (j + 0.5)) / n, l, j }));
    });
    const edges = nodes.flatMap((a) => nodes.filter((b) => b.l === a.l + 1).map((b) => [a, b]));
    const color = (l) => (l === 0 ? "var(--neuron-input)" : l === LAYERS.length - 1 ? "var(--violet)" : l < 3 ? "var(--cyan)" : "var(--violet)");
    const ribbons = [["var(--cyan)", 0], ["var(--blue)", 30], ["var(--violet)", -30], ["var(--amber)", 55]];
    $("hero-art").innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs>` +
      `<linearGradient id="hn-edge" x1="0" x2="${W}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="var(--neuron-input)"/><stop offset="0.5" stop-color="var(--cyan)"/><stop offset="1" stop-color="var(--violet)"/></linearGradient>` +
      `<radialGradient id="hn-glow"><stop offset="0" stop-color="var(--cyan)" stop-opacity="0.55"/><stop offset="1" stop-color="var(--cyan)" stop-opacity="0"/></radialGradient>` +
      `<filter id="hn-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter></defs>` +
      `<g stroke="url(#hn-edge)" stroke-width="0.8" opacity="0.35" fill="none">` +
      edges.map(([a, b]) => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" pathLength="1" class="nv-draw" style="animation-delay:${a.l * 120}ms"/>`).join("") +
      `</g><g fill="none" filter="url(#hn-blur)" opacity="0.8">` +
      ribbons.map(([c, o], i) => `<path d="M-20 ${600 + o} C 250 ${560 + o}, 480 ${120 - o}, 820 ${30 + o}" stroke="${c}" stroke-width="${i === 3 ? 1.5 : 3}" class="nv-flow" style="animation-delay:${i * -2}s"/>`).join("") +
      `</g>` +
      nodes.map((n, i) =>
        `<g class="nv-pop" style="animation-delay:${200 + n.l * 160 + n.j * 30}ms"><circle cx="${n.x}" cy="${n.y}" r="26" fill="url(#hn-glow)" class="nv-breathe" style="animation-delay:${(i % 7) * 0.5}s"/>` +
        (n.l === 0
          ? `<circle cx="${n.x}" cy="${n.y}" r="13" fill="var(--card-nested)" stroke="${color(n.l)}" stroke-width="2.5"/>`
          : `<polygon points="${hex(n.x, n.y, 14)}" fill="var(--card-nested)" stroke="${color(n.l)}" stroke-width="2.5"/>`) +
        `<circle cx="${n.x}" cy="${n.y}" r="5" fill="var(--foreground)"/></g>`).join("") +
      `</svg>`;
  }

  /* ---------- Announcements ---------- */
  const announce = (msg) => { $("announce").textContent = ""; setTimeout(() => { $("announce").textContent = msg; }, 20); };

  /* ---------- Architecture column ---------- */
  function buildArch() {
    const s = model.sizes, colors = ["var(--neuron-input)", "var(--neuron-hidden)", "var(--neuron-hidden)", "var(--neuron-output)"];
    const labels = [t("input"), t("hidden"), t("hidden"), t("output")];
    const arch = $("arch");
    arch.setAttribute("aria-label", `Input ${s[0]}, hidden ${s[1]}, hidden ${s[2]}, output ${s[3]} ${t("neurons")}`);
    arch.innerHTML = s.map((n, i) =>
      `<div class="arch-col"><div class="arch-dots" aria-hidden="true">${Array.from({ length: n }, () => `<span style="background:${colors[i]}"></span>`).join("")}</div>` +
      `<span class="arch-label">${NV.esc(labels[i])}</span><span class="arch-count">${n} ${NV.esc(t("neurons"))}</span></div>`).join("");
  }

  /* ---------- Stats ---------- */
  function renderStats(animate) {
    if (animate === false) { $("stat-loss")._cur = stats.loss; $("stat-acc")._cur = stats.acc * 100; }
    NV.countUp($("stat-loss"), stats.loss, (v) => v.toFixed(2));
    NV.countUp($("stat-acc"), stats.acc * 100, (v) => `${Math.round(v)}%`);
    $("cap-loss").textContent = stats.live ? t("liveCaption") : t("lossCaptionInit");
    $("cap-acc").textContent = stats.live ? t("liveCaption") : t("accCaptionInit");
  }

  /* ---------- Live diagram ---------- */
  const X = [120, 370, 620, 800], VW = 900, VH = 560, R = 36;
  const posY = (n, j) => VH / 2 + (j - (n - 1) / 2) * 128;
  const pt = (l, j) => ({ x: X[l], y: posY(model.sizes[l], j) });
  const layerName = (l) => (l === 0 ? t("input") : l === 3 ? t("output") : `${t("hidden")} ${l}`);

  function renderDiagram() {
    const svg = $("diagram");
    const active = document.activeElement && svg.contains(document.activeElement) ? document.activeElement.getAttribute("data-node") : null;
    const { as: acts } = model.forward(inputs);
    const sizes = model.sizes;
    let edges = "", labels = "";
    for (let l = 1; l < sizes.length; l++) for (let j = 0; j < sizes[l]; j++) for (let i = 0; i < sizes[l - 1]; i++) {
      const w = model.W[l - 1][j][i], a = pt(l - 1, i), b = pt(l, j), on = l === sel.l && j === sel.j;
      edges += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${w >= 0 ? "var(--cyan)" : "var(--neg)"}" stroke-width="${Math.min(9, 1 + Math.abs(w) * 1.8)}"` +
        `${w < 0 ? ' stroke-dasharray="6 4"' : ""} opacity="${on ? 0.95 : 0.22}" style="transition:opacity 250ms var(--ease-out-expo)"/>`;
      if (on) {
        const mx = a.x + (b.x - a.x) * 0.55, my = a.y + (b.y - a.y) * 0.55;
        labels += `<g aria-hidden="true"><rect x="${mx - 27}" y="${my - 12}" width="54" height="24" rx="12" fill="var(--card-nested)"/>` +
          `<text x="${mx}" y="${my + 5}" text-anchor="middle" font-size="13" font-family="var(--font-mono)" fill="${w >= 0 ? "var(--cyan)" : "var(--neg)"}">${NV.signed(w)}</text></g>`;
      }
    }
    let pulses = "";
    if (pulse) {
      const k = Math.min(2.999, pulse.p * 3);
      const seg = pulse.dir === "f" ? Math.floor(k) : 2 - Math.floor(k), local = k - Math.floor(k), l = seg + 1;
      for (let j = 0; j < sizes[l]; j++) for (let i = 0; i < sizes[l - 1]; i++) {
        const a = pt(l - 1, i), b = pt(l, j), f = pulse.dir === "f" ? local : 1 - local;
        pulses += `<circle cx="${a.x + (b.x - a.x) * f}" cy="${a.y + (b.y - a.y) * f}" r="${pulse.dir === "f" ? 4 : 3.5}" fill="${pulse.dir === "f" ? "var(--foreground)" : "var(--hot)"}"/>`;
      }
    }
    const selP = pt(sel.l, sel.j);
    let guides = `<g aria-hidden="true" stroke="var(--muted-foreground)" stroke-dasharray="2 5" stroke-width="1.2" fill="none">` +
      [0, 1].map((i) => `<line x1="0" y1="${pt(0, i).y}" x2="${X[0] - R}" y2="${pt(0, i).y}"/>`).join("") +
      `<line x1="${selP.x + R}" y1="${selP.y}" x2="${VW}" y2="${selP.y}" stroke="var(--foreground)"/></g>`;
    guides += [0, 1].map((i) => `<text aria-hidden="true" x="6" y="${pt(0, i).y - 12}" font-size="14" font-family="var(--font-mono)" fill="var(--muted-foreground)">x${i + 1} ${acts[0][i].toFixed(2)}</text>`).join("");

    let nodes = "";
    sizes.forEach((n, l) => {
      for (let j = 0; j < n; j++) {
        const { x, y } = pt(l, j), a = acts[l][j];
        const norm = model.act === "tanh" && l > 0 && l < 3 ? (a + 1) / 2 : Math.max(0, Math.min(1, a));
        const selected = sel.l === l && sel.j === j, name = neuronName(l, j), col = LAYER_COLORS[l];
        const body =
          (selected ? `<circle cx="${x}" cy="${y}" r="${R + 8}" fill="${col}" opacity="0.5" filter="url(#nd-glow)"/>` : "") +
          `<circle cx="${x}" cy="${y}" r="${R}" fill="var(--card-nested)" stroke="${col}" stroke-width="2.5"/>` +
          `<circle cx="${x}" cy="${y}" r="${R - 3}" fill="${col}" opacity="${0.12 + norm * 0.5}"/>` +
          (selected ? `<circle cx="${x}" cy="${y}" r="${R + 4}" fill="none" stroke="var(--foreground)" stroke-width="2.5"/>` : "") +
          `<circle class="nv-focus" cx="${x}" cy="${y}" r="${R + 9}" fill="none" stroke="var(--foreground)" stroke-width="2" stroke-dasharray="3 3"/>` +
          `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="15" font-weight="600" font-family="var(--font-mono)" fill="var(--foreground)">${a.toFixed(2)}</text>`;
        if (l === 0) nodes += `<g role="img" aria-label="${NV.esc(t("input"))} ${name}: ${a.toFixed(2)}">${body}</g>`;
        else nodes += `<g class="nv-node" data-node="${l}-${j}" data-l="${l}" data-j="${j}" role="button" tabindex="${selected ? 0 : -1}" aria-pressed="${selected}" aria-label="${NV.esc(layerName(l))}, ${name}, output ${a.toFixed(2)}">${body}</g>`;
      }
    });

    const layerHdrs = [
      { x: X[0], name: "INPUT (2)", col: "var(--cyan)" },
      { x: X[1], name: "HIDDEN 1 (4)", col: "var(--violet)" },
      { x: X[2], name: "HIDDEN 2 (3)", col: "var(--violet)" },
      { x: X[3], name: "OUTPUT (1)", col: "var(--neuron-output)" }
    ];
    let layerHdrSvg = layerHdrs.map(h =>
      `<g aria-hidden="true">` +
      `<line x1="${h.x}" y1="36" x2="${h.x}" y2="495" stroke="rgba(255,255,255,0.03)" stroke-dasharray="3 4"/>` +
      `<text x="${h.x}" y="22" text-anchor="middle" font-size="11" font-weight="700" font-family="var(--font-mono)" fill="${h.col}" letter-spacing="1">${h.name}</text>` +
      `</g>`
    ).join("");

    svg.setAttribute("aria-label", t("liveNet"));
    svg.innerHTML = `<defs><filter id="nd-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>` +
      layerHdrSvg +
      `<g aria-hidden="true">${edges}</g>${guides}<g aria-hidden="true">${pulses}</g><g aria-hidden="true">${labels}</g>${nodes}`;
    if (active) { const el = svg.querySelector(`[data-node="${active}"]`); if (el) el.focus({ preventScroll: true }); }

    // Update live spectrum strip (Photo 5 Fix)
    const specL0 = $("spec-l0");
    const specL1 = $("spec-l1");
    const specL2 = $("spec-l2");
    const specOut = $("spec-out");
    if (specL0) specL0.innerHTML = `<span class="spec-pill text-cyan">x₁: ${inputs[0].toFixed(2)}</span><span class="spec-pill text-cyan">x₂: ${inputs[1].toFixed(2)}</span>`;
    if (specL1) specL1.innerHTML = acts[1].map(v => `<span class="spec-pill text-violet">${v.toFixed(2)}</span>`).join("");
    if (specL2) specL2.innerHTML = acts[2].map(v => `<span class="spec-pill text-violet">${v.toFixed(2)}</span>`).join("");
    if (specOut) {
      const outV = acts[3][0];
      specOut.textContent = `ŷ: ${outV.toFixed(2)} (${outV >= 0.5 ? "Class 1" : "Class 0"})`;
      specOut.className = outV >= 0.5 ? "spec-pill text-green" : "spec-pill text-amber";
    }
    renderInspector();
  }

  function bindDiagram() {
    const svg = $("diagram");
    svg.addEventListener("click", (e) => {
      const g = e.target.closest("[data-node]");
      if (g) select({ l: +g.dataset.l, j: +g.dataset.j });
    });
    svg.addEventListener("keydown", (e) => {
      const g = e.target.closest("[data-node]");
      if (!g) return;
      let nl = +g.dataset.l, nj = +g.dataset.j;
      const sizes = model.sizes;
      if (e.key === "ArrowUp") nj--; else if (e.key === "ArrowDown") nj++;
      else if (e.key === "ArrowLeft") nl--; else if (e.key === "ArrowRight") nl++;
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select({ l: nl, j: nj }); return; }
      else return;
      e.preventDefault();
      nl = Math.max(1, Math.min(3, nl)); nj = Math.max(0, Math.min(sizes[nl] - 1, nj));
      select({ l: nl, j: nj });
      const el = svg.querySelector(`[data-node="${nl}-${nj}"]`); if (el) el.focus();
    });
  }

  /* ---------- Side panel ---------- */
  function buildPanel() {
    const panel = $("panel");
    const focusKey = document.activeElement && panel.contains(document.activeElement) ? document.activeElement.getAttribute("data-fk") : null;
    panel.innerHTML = "";
    const refs = (panelRefs = { w: [], wBadge: [], wBar: [], chips: [], acts: [] });
    const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
    const nested = (title) => { const s = h("section", "nested"); s.appendChild(h("h4", "", title)); const b = h("div", "stack-3"); b.style.marginTop = "0.5rem"; s.appendChild(b); return { s, b }; };

    const title = h("h3", "card-title", NV.esc(t("panelTitle"))); title.id = "panel-title";
    panel.setAttribute("aria-labelledby", "panel-title");
    panel.appendChild(title);

    const chipRow = h("div", "chip-row"); chipRow.setAttribute("role", "group"); chipRow.setAttribute("aria-label", t("neuronPicker"));
    [1, 2, 3].forEach((l) => { for (let j = 0; j < model.sizes[l]; j++) {
      const b = h("button", "neuron-chip", neuronName(l, j)); b.type = "button"; b.style.background = LAYER_COLORS[l];
      b.dataset.fk = `chip-${l}-${j}`; b.setAttribute("aria-pressed", l === sel.l && j === sel.j);
      b.addEventListener("click", () => select({ l, j }));
      chipRow.appendChild(b);
    } });
    panel.appendChild(chipRow);

    const body = h("div", "stack-3"); body.style.marginTop = "1rem"; panel.appendChild(body);

    // Inputs
    const inp = nested(t("inputs"));
    [0, 1].forEach((i) => {
      const wrap = h("div"); const row = h("div", "row-between");
      row.innerHTML = `<span class="var-name">x${i + 1}</span>`;
      const val = h("span", "var-value", inputs[i].toFixed(2)); row.appendChild(val); wrap.appendChild(row);
      const sl = NV.slider({ label: `${t("inputs")} x${i + 1}`, value: inputs[i], min: 0, max: 1, step: 0.01, def: i === 0 ? 0.3 : 0.7,
        onInput: (v) => { inputs[i] = v; val.textContent = v.toFixed(2); update(); } });
      sl.input.dataset.fk = `in-${i}`; wrap.appendChild(sl.el); inp.b.appendChild(wrap);
    });
    body.appendChild(inp.s);

    // Weights
    const incoming = model.W[sel.l - 1][sel.j];
    const wn = nested(`${t("weights")} · ${neuronName(sel.l, sel.j)}`);
    incoming.forEach((w, i) => {
      const wrap = h("div"); const row = h("div", "small-row");
      row.innerHTML = `<span class="var-name">w${i + 1}</span>`;
      const badge = h("span", "w-badge", `<span></span><span class="w-bar" aria-hidden="true"><i></i></span>`); row.appendChild(badge); wrap.appendChild(row);
      const src = neuronName(sel.l - 1, i);
      const sl = NV.slider({ label: `w${i + 1} ${t("from")} ${src}`, value: w, min: -4, max: 4, step: 0.05, def: () => saved.W[sel.l - 1][sel.j][i], format: NV.signed,
        onInput: (v) => { model.W[sel.l - 1][sel.j][i] = v; refresh(); } });
      sl.input.dataset.fk = `w-${i}`; wrap.appendChild(sl.el);
      wrap.appendChild(h("p", "from-note", `${NV.esc(t("from"))} ${src}`));
      wn.b.appendChild(wrap);
      refs.w.push(sl); refs.wBadge.push(badge);
    });
    body.appendChild(wn.s);

    // Bias
    const bn = nested(t("bias"));
    const brow = h("div", "small-row"); brow.innerHTML = `<span class="var-name">b</span>`;
    const bval = h("span", "var-value"); brow.appendChild(bval); bn.b.appendChild(brow);
    const bsl = NV.slider({ label: `${t("bias")} ${neuronName(sel.l, sel.j)}`, value: model.b[sel.l - 1][sel.j], min: -4, max: 4, step: 0.05, def: () => saved.b[sel.l - 1][sel.j],
      format: NV.signed, describedBy: "bias-cap", onInput: (v) => { model.b[sel.l - 1][sel.j] = v; refresh(); } });
    bsl.input.dataset.fk = "bias"; bn.b.appendChild(bsl.el);
    const cap = h("p", "from-note", NV.esc(t("biasCaption"))); cap.id = "bias-cap"; bn.b.appendChild(cap);
    body.appendChild(bn.s);
    refs.bias = bsl; refs.bval = bval;

    // Output
    const out = h("section", "nested"); out.setAttribute("aria-label", t("neuronOutput"));
    refs.zline = h("p", "z-line"); out.appendChild(refs.zline);
    const radios = h("div", "radio-row"); radios.setAttribute("role", "radiogroup"); radios.setAttribute("aria-label", t("activation"));
    ACTS.forEach((a) => {
      const b = h("button", "seg-btn", ACT_LABEL[a]); b.type = "button"; b.setAttribute("role", "radio"); b.dataset.fk = `act-${a}`;
      b.addEventListener("click", () => { model.act = a; refresh(); });
      radios.appendChild(b); refs.acts.push([a, b]);
    });
    out.appendChild(radios);
    const orow = h("div", "out-row"); refs.outLabel = h("span", "hint"); refs.outVal = h("output", "out-value"); refs.outVal.setAttribute("aria-live", "polite");
    refs.outVal.style.color = LAYER_COLORS[sel.l];
    orow.appendChild(refs.outLabel); orow.appendChild(refs.outVal); out.appendChild(orow);

    const curveSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    curveSvg.setAttribute("class", "act-curve-svg");
    curveSvg.setAttribute("viewBox", "0 0 240 64");
    out.appendChild(curveSvg);
    refs.curveSvg = curveSvg;

    body.appendChild(out);

    // Actions
    const act = h("div", "panel-actions");
    const apply = h("button", "pill-primary flex-1", NV.esc(t("apply"))); apply.type = "button"; apply.dataset.fk = "apply";
    apply.addEventListener("click", () => { saved = model.clone(); refresh(); announce(t("applied")); });
    const rev = h("button", "pill-outline", NV.esc(t("reset"))); rev.type = "button"; rev.dataset.fk = "revert";
    rev.addEventListener("click", () => { model = saved.clone(); refresh(); buildPanel(); announce(t("reverted")); });
    const rnd = h("button", "link-btn", NV.esc(t("randomize"))); rnd.type = "button"; rnd.dataset.fk = "rand";
    rnd.addEventListener("click", () => {
      const r = new MLP(model.sizes, model.act, (Date.now() % 100000) + 1);
      model.W = r.W; model.b = r.b; refresh(); buildPanel(); announce(t("randomized"));
    });
    act.append(apply, rev, rnd); panel.appendChild(act);

    updatePanel();
    if (focusKey) { const el = panel.querySelector(`[data-fk="${focusKey}"]`); if (el) el.focus({ preventScroll: true }); }
  }

  /** Update texts/values in the existing panel (does not recreate sliders, so dragging is smooth). */
  function updatePanel() {
    if (!panelRefs) return;
    const r = panelRefs, { as: acts, zs } = model.forward(inputs);
    const incoming = model.W[sel.l - 1][sel.j], bias = model.b[sel.l - 1][sel.j];
    incoming.forEach((w, i) => {
      const tone = w > 0 ? "pos" : w < 0 ? "neg" : "zero";
      const b = r.wBadge[i]; b.className = `w-badge ${tone}`;
      b.firstChild.textContent = NV.signed(w);
      b.querySelector("i").style.width = `${Math.min(100, (Math.abs(w) / 4) * 100)}%`;
      if (document.activeElement !== r.w[i].input) r.w[i].set(w);
    });
    r.bval.textContent = NV.signed(bias);
    if (document.activeElement !== r.bias.input) r.bias.set(bias);
    const prev = acts[sel.l - 1];
    r.zline.innerHTML = "z = " + incoming.map((w, i) => `(${w.toFixed(2)} × ${prev[i].toFixed(2)}) + `).join("") + `${bias.toFixed(2)} = <b>${zs[sel.l - 1][sel.j].toFixed(2)}</b>`;
    r.acts.forEach(([a, b]) => b.setAttribute("aria-checked", model.act === a));
    r.outLabel.textContent = `${t("neuronOutput")} · ${ACT_LABEL[sel.l === 3 ? "sigmoid" : model.act]}`;
    r.outVal.textContent = acts[sel.l][sel.j].toFixed(2);

    if (r.curveSvg) {
      const act = sel.l === 3 ? "sigmoid" : model.act;
      const curZ = zs[sel.l - 1][sel.j];
      const curA = acts[sel.l][sel.j];
      let pathD = "";
      for (let px = 0; px <= 240; px += 4) {
        const z = -4 + (px / 240) * 8;
        let a = 0;
        if (act === "sigmoid") a = 1 / (1 + Math.exp(-z));
        else if (act === "tanh") a = (Math.tanh(z) + 1) / 2;
        else if (act === "relu") a = Math.max(0, Math.min(1, z / 3));
        else if (act === "step") a = z >= 0 ? 1 : 0;
        const py = 54 - a * 44;
        pathD += (px === 0 ? "M" : " L") + `${px} ${py.toFixed(1)}`;
      }
      const dotX = Math.max(0, Math.min(240, ((curZ + 4) / 8) * 240));
      let normA = act === "tanh" ? (curA + 1) / 2 : Math.max(0, Math.min(1, curA));
      const dotY = 54 - normA * 44;

      r.curveSvg.innerHTML =
        '<line x1="0" y1="54" x2="240" y2="54" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>' +
        '<line x1="120" y1="4" x2="120" y2="60" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="2 3"/>' +
        `<path d="${pathD}" fill="none" stroke="${LAYER_COLORS[sel.l]}" stroke-width="2"/>` +
        `<circle cx="${dotX.toFixed(1)}" cy="${dotY.toFixed(1)}" r="4.5" fill="#ffffff" stroke="${LAYER_COLORS[sel.l]}" stroke-width="2"/>` +
        `<text x="8" y="16" fill="rgba(255,255,255,0.4)" font-size="9" font-family="var(--font-mono)">${ACT_LABEL[act]} curve</text>`;
    }
  }

  /* ---------- Forward-pass inspector (selected neuron) ---------- */
  function renderInspector() {
    const box = $("ws-inspector");
    if (!box) return;
    const { zs, as } = model.forward(inputs);
    const { l, j } = sel;
    const name = neuronName(l, j);
    if (l === 0) {
      box.innerHTML = `<div class="insp-head"><span class="insp-title">FORWARD PASS · ${name}</span><span class="insp-chip text-cyan">input neuron</span></div>` +
        `<p class="insp-note">Input neurons just hold the raw value you feed in: <strong class="font-mono text-cyan">${name} = ${inputs[j].toFixed(2)}</strong>. Select a hidden or output neuron to see how it combines the previous layer.</p>`;
      return;
    }
    const w = model.W[l - 1][j], b = model.b[l - 1][j], prev = as[l - 1], z = zs[l - 1][j], a = as[l][j];
    const act = l === 3 ? "Sigmoid" : (ACT_LABEL[model.act] || model.act);
    const terms = w.map((wi, i) => ({ n: neuronName(l - 1, i), wi, ai: prev[i], c: wi * prev[i] }));
    const maxAbs = Math.max(0.0001, Math.abs(b), ...terms.map(x => Math.abs(x.c)));
    const row = (label, left, c, cls) => {
      const pct = Math.min(100, Math.abs(c) / maxAbs * 100);
      return `<div class="insp-row"><span class="insp-label">${label}</span><span class="insp-math font-mono">${left}</span>` +
        `<span class="insp-bar"><i class="${c >= 0 ? "pos" : "neg"} ${cls || ""}" style="width:${pct}%"></i></span>` +
        `<span class="insp-val font-mono ${c >= 0 ? "text-green" : "text-amber"}">${c >= 0 ? "+" : "−"}${Math.abs(c).toFixed(3)}</span></div>`;
    };
    box.innerHTML =
      `<div class="insp-head"><span class="insp-title">FORWARD PASS · ${name}</span><span class="insp-chip text-violet">z = Σ(w·a) + b → ${act}(z)</span></div>` +
      `<div class="insp-rows">` +
      terms.map(x => row(x.n, `${x.wi.toFixed(2)} × ${x.ai.toFixed(2)}`, x.c)).join("") +
      row("bias", `b = ${b.toFixed(2)}`, b, "bias") +
      `</div>` +
      `<div class="insp-foot"><div class="insp-stat"><span>Weighted sum z</span><strong class="font-mono text-cyan">${z.toFixed(3)}</strong></div>` +
      `<span class="insp-arrow" aria-hidden="true">➔</span>` +
      `<div class="insp-stat"><span>${act}(z)</span><strong class="font-mono ${l === 3 ? (a >= 0.5 ? "text-green" : "text-amber") : "text-violet"}">${a.toFixed(3)}</strong></div>` +
      `<div class="insp-stat"><span>Inputs used</span><strong class="font-mono text-amber">${w.length}</strong></div></div>`;
  }

  /* ---------- State changes ---------- */
  function update() {
    renderDiagram();
    updatePanel();
    if (window.NV && window.NV.Analytics) {
      window.NV.Analytics.updateMatrix(model);
      if (window.NV.Analytics.refreshProbe) window.NV.Analytics.refreshProbe();
      if (window.NV.Analytics.updateHeroHUD) window.NV.Analytics.updateHeroHUD();
    }
  }
  function refresh() {
    const ev = model.evaluate(DATA.X, DATA.Y);
    stats = { loss: ev.loss, acc: ev.acc, live: true };
    NV.bg.set({ accuracy: ev.acc });
    renderStats(); update();
    if (window.NV && window.NV.Analytics) {
      window.NV.Analytics.benchmarkEngine(model);
      window.NV.Analytics.recordEpoch(0, ev.loss, ev.acc);
    }
  }
  function select(s) { sel = s; renderDiagram(); buildPanel(); }

  /* ---------- Training ---------- */
  function train() {
    if (training) return;
    training = true;
    const btn = $("btn-train"); btn.disabled = true; btn.textContent = t("training");
    announce(t("training")); NV.bg.set({ training: true });
    const rng = mulberry32(Date.now() & 0xffff);
    const per = NV.reduced() ? 300 : 8;
    let done = 0; const t0 = performance.now();
    const step = (now) => {
      for (let k = 0; k < per && done < TRAIN_EPOCHS; k++, done++) model.epoch(DATA.X, DATA.Y, lr, rng);
      const ev = model.evaluate(DATA.X, DATA.Y);
      stats = { loss: ev.loss, acc: ev.acc, live: true };
      NV.bg.set({ accuracy: ev.acc });
      if (!NV.reduced()) { const c = ((now - t0) % 1200) / 1200; pulse = c < 0.5 ? { dir: "f", p: c * 2 } : { dir: "b", p: (c - 0.5) * 2 }; }
      renderStats(); update();

      if (window.NV && window.NV.Analytics && done % 24 === 0) {
        window.NV.Analytics.recordEpoch(done, ev.loss, ev.acc);
      }

      if (done < TRAIN_EPOCHS) raf = requestAnimationFrame(step);
      else {
        training = false; pulse = null; NV.bg.set({ training: false });
        saved = model.clone(); btn.disabled = false; btn.textContent = t("simulate");
        update();
        if (window.NV && window.NV.Analytics) {
          window.NV.Analytics.recordEpoch(TRAIN_EPOCHS, ev.loss, ev.acc);
          window.NV.Analytics.benchmarkEngine(model);
        }
        announce(`${t("trainFinished")} ${t("loss")} ${ev.loss.toFixed(2)}, ${t("accuracy")} ${Math.round(ev.acc * 100)}%.`);
      }
    };
    raf = requestAnimationFrame(step);
  }
  function resetAll() {
    cancelAnimationFrame(raf);
    model = fresh(); saved = fresh(); training = false; pulse = null;
    const btn = $("btn-train"); btn.disabled = false; btn.textContent = t("simulate");
    stats = { loss: 0.68, acc: 0.5, live: false };
    NV.bg.set({ training: false, accuracy: 0.5 });
    renderStats(); buildPanel(); update(); announce(t("netReset"));
    if (window.NV && window.NV.Analytics) {
      window.NV.Analytics.resetHistory();
    }
  }

  document.addEventListener("nv-ready", () => {
    buildHero();
    const lrSl = NV.slider({ label: t("lr"), value: lr, min: 0.01, max: 1, step: 0.01, def: 0.1,
      onInput: (v) => { lr = v; $("lr-value").textContent = v.toFixed(2); } });
    $("lr-slider").appendChild(lrSl.el);
    $("btn-train").addEventListener("click", train);
    $("btn-reset").addEventListener("click", resetAll);
    const heroBtnIntro = document.getElementById("hero-btn-intro");
    if (heroBtnIntro) {
      heroBtnIntro.addEventListener("click", () => {
        if (window.NVIntro) window.NVIntro.open();
      });
    }
    bindDiagram();
    const build = () => {
      renderStats(false); lrSl.setLabel(t("lr"));
      if (!training) $("btn-train").textContent = t("simulate");
      renderDiagram(); buildPanel();
      if (window.NV && window.NV.Analytics) {
        window.NV.Analytics.init(model);
      }
    };
    NV.onLang(build);
    build();
    window.addEventListener("pagehide", () => NV.bg.set({ training: false }));
  });
})();
