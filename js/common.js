/* NeuroVision — shared: palette, background store, i18n, top bar, animated background, UI helpers. */
(function () {
  "use strict";
  const NV = (window.NV = {});

  /* ---------- Palette (sRGB mirror of the CSS tokens) ---------- */
  NV.C = {
    bg: [2, 4, 10], cyan: [34, 211, 238], blue: [59, 130, 246], violet: [167, 139, 250],
    sky: [56, 189, 248], green: [34, 197, 94], hot: [255, 90, 45], amber: [245, 165, 36],
    neg: [255, 138, 91], white: [255, 255, 255], dim: [71, 85, 105], circuit: [120, 140, 170],
  };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  NV.rgba = rgba; NV.mix = mix;

  /* ---------- Reduced motion ---------- */
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  NV.reduced = () => mql.matches;
  NV.mql = mql;

  /* ---------- Background state ---------- */
  let bgState = { training: false, accuracy: 0.5, kick: -1e9 };
  NV.bg = {
    get: () => bgState,
    set: (p) => { bgState = Object.assign({}, bgState, p); },
    kick: () => { bgState = Object.assign({}, bgState, { kick: performance.now() }); },
  };

  /* ---------- i18n ---------- */
  const en = {
    skip: "Skip to content", navLab: "Network lab", navDemos: "Demo experiments", langSwitch: "Switch language to Thai",
    heroTitle: "Neural Networks",
    heroBody: "Explore synaptic weights, forward tensor propagation, and client-side JavaScript execution in real-time.",
    enterLab: "Enter Network Lab", tryDemos: "Try Demos & Experiments",
    labTitle: "Inside a tiny network",
    labIntro: "Two inputs, two hidden layers, one answer. Pick a neuron, move its weights and see the whole network react.",
    arch: "Network architecture", input: "Input", hidden: "Hidden", output: "Output", neurons: "neurons",
    loss: "Training loss", accuracy: "Accuracy",
    lossCaptionInit: "Illustrative initial value", accCaptionInit: "Illustrative starting point",
    liveCaption: "Measured on the training data",
    lr: "Learning rate", slow: "Slow", fast: "Fast", simulate: "Simulate training", training: "Training…", reset: "Reset",
    liveNet: "Live network", diagramHint: "Click a neuron, or focus one and use the arrow keys.",
    positive: "Positive weight", negative: "Negative weight", thicker: "Thicker line = stronger",
    panelTitle: "Inputs, weights & bias", neuronPicker: "Choose a neuron", inputs: "Inputs", weights: "Weights", bias: "Bias",
    biasCaption: "Shifts when this neuron switches on.", from: "from", activation: "Activation", neuronOutput: "Neuron output",
    apply: "Apply changes", randomize: "Randomize", applied: "Changes applied.",
    trainFinished: "Training finished.", netReset: "Network reset.", reverted: "Neuron changes reverted.", randomized: "Weights randomized.",
    demosTitle: "Three experiments", demosIntro: "Draw, train and break real neural networks, right here in the browser.",
    tabDigits: "Read handwriting", tabGates: "One neuron vs many", tabBoundary: "Bend the boundary",
    digitTitle: "Handwritten digit recognition",
    digitSub1: "Draw a digit with your finger or mouse. The network reads it as you draw.",
    digitSub2: "Watch the signal flow through each layer in real time.",
    trainedModel: "Trained model", trainingModel: "Training model",
    trainedInfo: "Trained in your browser on generated digits when this page opened.",
    clear: "Clear", mirror: "Left / Right", netInput: "Network input (14x14)", netDiagram: "Network diagram",
    canvasLabel: "Drawing area. Press a number key 0 to 9 to draw a sample digit, Delete to clear.",
    prediction: "Prediction", drawSomething: "Draw a digit to begin.", testAcc: "accuracy on fresh samples",
    gatesTitle: "Can one neuron learn it?",
    gatesBody: "One neuron draws one straight line. AND and OR are easy. XOR needs two lines, so it needs a hidden layer.",
    gate: "Logic gate", model: "Model", oneNeuron: "One neuron", hiddenLayer: "Hidden layer", train: "Train",
    xorFail: "One straight line can't split XOR. Add a hidden layer.", solved: "All four cases are correct.", correct: "correct",
    gateCanvas: "Decision field for the selected logic gate. The four corner points are the four input cases.",
    boundaryTitle: "Decision boundary playground",
    boundaryBody: "Place cyan and orange points, then press Train. The colored field bends around your data.",
    team: "Point color", cyanTeam: "Cyan (circle)", orangeTeam: "Orange (square)", pause: "Pause", circle: "Circle", points: "points",
    boundaryCanvas: "Point field. Click to place a point. With the keyboard, use the arrow keys to move the cursor and Enter to place a point.",
    back: "Back to the lab", notFound: "Page not found",
  };
  const th = {
    skip: "ข้ามไปยังเนื้อหา", navLab: "ห้องทดลองเครือข่าย", navDemos: "การทดลองสาธิต", langSwitch: "Switch language to English",
    heroTitle: "ดูว่าเครื่องจักรเรียนรู้อย่างไร",
    heroBody: "ปรับอินพุต ขยับน้ำหนัก และดูโครงข่ายประสาทจริงเรียนรู้ทีละสัญญาณ",
    enterLab: "เข้าสู่ห้องทดลอง", tryDemos: "ลองการสาธิต",
    labTitle: "ภายในเครือข่ายขนาดเล็ก",
    labIntro: "สองอินพุต สองชั้นซ่อน หนึ่งคำตอบ เลือกนิวรอน ขยับน้ำหนัก แล้วดูทั้งเครือข่ายตอบสนอง",
    arch: "สถาปัตยกรรมเครือข่าย", input: "อินพุต", hidden: "ชั้นซ่อน", output: "เอาต์พุต", neurons: "นิวรอน",
    loss: "ค่าความผิดพลาด", accuracy: "ความแม่นยำ",
    lossCaptionInit: "ค่าเริ่มต้นตัวอย่าง", accCaptionInit: "จุดเริ่มต้นตัวอย่าง", liveCaption: "วัดจากข้อมูลฝึก",
    lr: "อัตราการเรียนรู้", slow: "ช้า", fast: "เร็ว", simulate: "จำลองการฝึก", training: "กำลังฝึก…", reset: "รีเซ็ต",
    liveNet: "เครือข่ายสด", diagramHint: "คลิกนิวรอน หรือโฟกัสแล้วใช้ปุ่มลูกศร",
    positive: "น้ำหนักบวก", negative: "น้ำหนักลบ", thicker: "เส้นหนา = แรงกว่า",
    panelTitle: "อินพุต น้ำหนัก และไบแอส", neuronPicker: "เลือกนิวรอน", inputs: "อินพุต", weights: "น้ำหนัก", bias: "ไบแอส",
    biasCaption: "เลื่อนจุดที่นิวรอนนี้เริ่มทำงาน", from: "จาก", activation: "ฟังก์ชันกระตุ้น", neuronOutput: "ผลลัพธ์นิวรอน",
    apply: "ใช้การเปลี่ยนแปลง", randomize: "สุ่ม", applied: "ใช้การเปลี่ยนแปลงแล้ว",
    trainFinished: "ฝึกเสร็จแล้ว", netReset: "รีเซ็ตเครือข่ายแล้ว", reverted: "ย้อนการเปลี่ยนแปลงนิวรอนแล้ว", randomized: "สุ่มน้ำหนักแล้ว",
    demosTitle: "สามการทดลอง", demosIntro: "วาด ฝึก และทดสอบโครงข่ายประสาทจริงในเบราว์เซอร์",
    tabDigits: "อ่านลายมือ", tabGates: "หนึ่งนิวรอนกับหลายชั้น", tabBoundary: "ดัดเส้นแบ่ง",
    digitTitle: "การจดจำตัวเลขลายมือ",
    digitSub1: "วาดตัวเลขด้วยนิ้วหรือเมาส์ เครือข่ายจะอ่านขณะคุณวาด",
    digitSub2: "ดูสัญญาณไหลผ่านแต่ละชั้นแบบเรียลไทม์",
    trainedModel: "โมเดลที่ฝึกแล้ว", trainingModel: "กำลังฝึกโมเดล",
    trainedInfo: "ฝึกในเบราว์เซอร์ของคุณด้วยตัวเลขที่สร้างขึ้นเมื่อเปิดหน้านี้",
    clear: "ล้าง", mirror: "ซ้าย / ขวา", netInput: "อินพุตเครือข่าย (14x14)", netDiagram: "แผนภาพเครือข่าย",
    canvasLabel: "พื้นที่วาด กดปุ่มตัวเลข 0 ถึง 9 เพื่อวาดตัวอย่าง กด Delete เพื่อล้าง",
    prediction: "คำทำนาย", drawSomething: "วาดตัวเลขเพื่อเริ่ม", testAcc: "ความแม่นยำกับตัวอย่างใหม่",
    gatesTitle: "นิวรอนเดียวเรียนรู้ได้ไหม?",
    gatesBody: "นิวรอนเดียววาดเส้นตรงได้เส้นเดียว AND และ OR ง่าย แต่ XOR ต้องใช้สองเส้น จึงต้องมีชั้นซ่อน",
    gate: "ลอจิกเกต", model: "โมเดล", oneNeuron: "นิวรอนเดียว", hiddenLayer: "มีชั้นซ่อน", train: "ฝึก",
    xorFail: "เส้นตรงเส้นเดียวแยก XOR ไม่ได้ ลองเพิ่มชั้นซ่อน", solved: "ถูกต้องครบทั้งสี่กรณี", correct: "ถูก",
    gateCanvas: "พื้นการตัดสินใจของลอจิกเกตที่เลือก จุดทั้งสี่มุมคือสี่กรณีอินพุต",
    boundaryTitle: "สนามทดลองเส้นแบ่งการตัดสินใจ",
    boundaryBody: "วางจุดสีฟ้าและสีส้ม แล้วกดฝึก พื้นสีจะโค้งตามข้อมูลของคุณ",
    team: "สีของจุด", cyanTeam: "ฟ้า (วงกลม)", orangeTeam: "ส้ม (สี่เหลี่ยม)", pause: "หยุด", circle: "วงกลม", points: "จุด",
    boundaryCanvas: "สนามจุด คลิกเพื่อวางจุด ใช้ปุ่มลูกศรเลื่อนเคอร์เซอร์และ Enter เพื่อวางจุด",
    back: "กลับไปห้องทดลอง", notFound: "ไม่พบหน้า",
  };
  let lang = "en";
  const listeners = [];
  NV.t = (k) => (lang === "th" ? th[k] || en[k] : en[k]) || k;
  NV.lang = () => lang;
  NV.onLang = (fn) => listeners.push(fn);
  NV.applyI18n = (root) => {
    (root || document).querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = NV.t(el.dataset.i18n); });
    (root || document).querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", NV.t(el.dataset.i18nAria)); });
  };
  NV.setLang = (l) => {
    lang = l;
    document.documentElement.lang = l;
    try { localStorage.setItem("nv-lang", l); } catch (e) {}
    NV.applyI18n();
    const tg = document.getElementById("lang-toggle");
    if (tg) { tg.textContent = l === "en" ? "ภาษา" : "EN"; tg.setAttribute("aria-label", NV.t("langSwitch")); }
    const title = document.querySelector("[data-title-" + l + "]");
    if (title) document.title = title.getAttribute("data-title-" + l);
    listeners.forEach((fn) => fn(l));
  };

  /* ---------- Small helpers ---------- */
  NV.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  NV.signed = (w) => `${w > 0 ? "+" : w < 0 ? "−" : ""}${Math.abs(w).toFixed(2)}`;

  /** Animate a number inside an element (jumps instantly with reduced motion). */
  NV.countUp = (el, value, format) => {
    const from = el._cur == null ? value : el._cur;
    cancelAnimationFrame(el._raf);
    if (NV.reduced() || from === value) { el._cur = value; el.textContent = format(value); return; }
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / 400);
      const v = from + (value - from) * (1 - Math.pow(1 - k, 3));
      el._cur = v; el.textContent = format(v);
      if (k < 1) el._raf = requestAnimationFrame(tick);
    };
    el._raf = requestAnimationFrame(tick);
  };

  /** Native range input: keyboard + screen-reader friendly. Double-click/tap resets. */
  NV.slider = (o) => {
    const wrap = document.createElement("div");
    wrap.className = "range-wrap";
    const input = document.createElement("input");
    input.type = "range"; input.className = "nv-range";
    input.min = o.min; input.max = o.max; input.step = o.step;
    if (o.describedBy) input.setAttribute("aria-describedby", o.describedBy);
    const fmt = o.format || ((v) => v.toFixed(2));
    wrap.appendChild(input);
    let tip = null;
    const sync = () => {
      const v = parseFloat(input.value);
      const fill = ((v - o.min) / (o.max - o.min)) * 100;
      input.style.setProperty("--fill", fill + "%");
      input.setAttribute("aria-valuetext", fmt(v));
      if (tip) { tip.textContent = fmt(v); tip.style.left = `calc(${fill}% + ${(0.5 - fill / 100) * 20}px)`; }
    };
    const setDrag = (on) => {
      if (on) {
        input.dataset.dragging = "1";
        tip = document.createElement("span"); tip.className = "range-tip"; tip.setAttribute("aria-hidden", "true");
        wrap.appendChild(tip); sync();
        const up = () => { delete input.dataset.dragging; if (tip) tip.remove(); tip = null; window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
        window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
      }
    };
    input.addEventListener("pointerdown", () => setDrag(true));
    input.addEventListener("input", () => { sync(); o.onInput(parseFloat(input.value)); });
    wrap.addEventListener("dblclick", () => { const d = typeof o.def === "function" ? o.def() : o.def; input.value = d; sync(); o.onInput(d); });
    const api = {
      el: wrap, input,
      setLabel: (l) => input.setAttribute("aria-label", l),
      set: (v) => { input.value = v; sync(); },
    };
    api.setLabel(o.label); api.set(o.value);
    return api;
  };

  /* ---------- Top bar + background injection ---------- */
  function buildChrome() {
    const page = document.body.dataset.page || "lab";
    const bgHost = document.getElementById("bg-host");
    if (bgHost) {
      bgHost.className = "bg-root";
      bgHost.setAttribute("aria-hidden", "true");
      bgHost.innerHTML =
        '<div class="bg-base"></div>' +
        '<div class="bg-circuit" id="bg-circuit"><svg><defs><pattern id="nv-circuit" width="240" height="240" patternUnits="userSpaceOnUse">' +
        '<g fill="none" stroke="var(--muted-foreground)" stroke-width="1"><path d="M0 40 H60 V100 H140"/><path d="M240 160 H180 V210 H100 V240"/><path d="M120 0 V30 H200 V90"/><path d="M20 240 V180 H70"/></g>' +
        '<g fill="var(--muted-foreground)"><circle cx="140" cy="100" r="3"/><circle cx="200" cy="90" r="3"/><circle cx="70" cy="180" r="3"/><rect x="160" y="130" width="40" height="2"/><rect x="160" y="136" width="24" height="2"/><rect x="20" y="120" width="30" height="2"/></g>' +
        '</pattern></defs><rect width="200%" height="200%" fill="url(#nv-circuit)" class="nv-circuit-drift"/></svg></div>' +
        '<canvas class="bg-canvas" id="bg-canvas"></canvas><div class="bg-vignette"></div><div class="nv-grain"></div>';
    }
    const top = document.getElementById("topbar");
    if (top) {
      top.className = "topbar";
      top.innerHTML =
        '<div class="topbar-inner">' +
        '<a href="index.html" class="brand"><svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><circle cx="6" cy="9" r="3" fill="var(--neuron-input)"/><circle cx="6" cy="19" r="3" fill="var(--neuron-input)"/><circle cx="22" cy="14" r="3.5" fill="var(--neuron-output)"/><path d="M6 9 L22 14 M6 19 L22 14" stroke="var(--cyan)" stroke-width="1.5"/></svg>' +
        '<span class="brand-name">NeuroVision</span><span class="sr-only">NeuroVision</span></a>' +
        '<nav aria-label="Main" class="topnav"><div class="topnav-pill">' +
        `<a href="index.html" class="tab-link" data-i18n="navLab" ${page === "lab" ? 'aria-current="page"' : ""}></a>` +
        `<a href="demos.html" class="tab-link" data-i18n="navDemos" ${page === "demos" ? 'aria-current="page"' : ""}></a>` +
        '</div></nav><div class="topbar-end">' +
        '<button type="button" class="btn-intro-launch" id="btn-topbar-intro" title="Launch AI Architecture Visualization"><span class="brand-dot"></span><span>AI Brain Intro</span></button>' +
        '<button type="button" class="lang-toggle" id="lang-toggle"></button></div></div>';
      document.getElementById("lang-toggle").addEventListener("click", () => NV.setLang(lang === "en" ? "th" : "en"));
      const btnIntro = document.getElementById("btn-topbar-intro");
      if (btnIntro) {
        btnIntro.addEventListener("click", () => {
          if (window.NVIntro) window.NVIntro.open();
        });
      }
    }
  }

  /* ---------- Animated background (canvas) ---------- */
  function startBackground() {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    const circuit = document.getElementById("bg-circuit");
    const ctx = canvas.getContext("2d");
    const C = NV.C;
    const LAYERS = [6, 8, 9, 8, 3];
    const RIBBONS = [
      { c: C.cyan, w: 2.2, off: 0, sp: 0.00012 }, { c: C.blue, w: 1.8, off: 0.05, sp: 0.0001 },
      { c: C.violet, w: 1.6, off: -0.05, sp: 0.00014 }, { c: C.cyan, w: 1.2, off: 0.1, sp: 0.00009 },
      { c: C.amber, w: 0.8, off: -0.09, sp: 0.00011 },
    ];
    const DIGIT = [[0.2, 0.15], [0.5, 0], [0.8, 0.15], [0.75, 0.38], [0.45, 0.48], [0.8, 0.6], [0.85, 0.85], [0.5, 1], [0.15, 0.85]];
    let W = 0, H = 0, dpr = 1, nodes = [], edges = [], particles = [], edgeCache = null, raf = 0, last = 0;
    let lastInput = performance.now(), mouse = { x: 0, y: 0 };

    const hexPath = (x, y, r) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        const px = x + r * Math.cos(a), py = y + r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const layout = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      nodes = [];
      const x0 = W * 0.06, x1 = W * 0.94;
      LAYERS.forEach((n, l) => {
        const x = x0 + ((x1 - x0) * l) / (LAYERS.length - 1);
        const span = Math.min(H * 0.72, n * 90);
        for (let j = 0; j < n; j++) {
          const y = H / 2 - span / 2 + (n === 1 ? span / 2 : (span * j) / (n - 1));
          nodes.push({ x, y, layer: l, hex: l > 0, phase: Math.random() * Math.PI * 2 });
        }
      });
      edges = [];
      nodes.forEach((a, i) => nodes.forEach((b, k) => { if (b.layer === a.layer + 1) edges.push([i, k]); }));
      edgeCache = document.createElement("canvas");
      edgeCache.width = canvas.width; edgeCache.height = canvas.height;
      const ec = edgeCache.getContext("2d");
      ec.scale(dpr, dpr); ec.lineWidth = 0.5; ec.strokeStyle = rgba(C.cyan, 0.1);
      edges.forEach(([a, b]) => { ec.beginPath(); ec.moveTo(nodes[a].x, nodes[a].y); ec.lineTo(nodes[b].x, nodes[b].y); ec.stroke(); });
      const count = Math.round(Math.max(40, Math.min(120, (W * H) / 15000)));
      particles = Array.from({ length: count }, (_, i) => ({
        e: Math.floor(Math.random() * edges.length), t: Math.random(), speed: 0.0015 + Math.random() * 0.003,
        color: i % 9 === 0 ? C.amber : i % 2 ? C.cyan : C.violet, back: false,
      }));
    };

    const draw = (now) => {
      const s = NV.bg.get();
      const reduced = NV.reduced();
      const sinceKick = now - s.kick;
      const zk = sinceKick < 500 ? 1 - sinceKick / 500 : 0;
      const zoom = 1 + 0.08 * Math.sin(zk * Math.PI);
      const fade = 1 - 0.6 * Math.sin(zk * Math.PI);
      const idle = !reduced && now - lastInput > 20000;
      const speedMul = s.training ? 3.2 : 1, bright = s.training ? 1.5 : 1;
      const accT = Math.max(0, Math.min(1, (s.accuracy - 0.5) * 2));
      const hiddenC = accT < 0.5 ? mix(C.violet, C.cyan, accT * 2) : mix(C.cyan, C.green, (accT - 0.5) * 2 * 0.6);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.globalAlpha = fade;
      const px = reduced ? 0 : mouse.x * 6, py = reduced ? 0 : mouse.y * 6;
      ctx.translate(W / 2 + px, H / 2 + py); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);
      ctx.globalCompositeOperation = "lighter";

      const tt = reduced ? 0 : now;
      RIBBONS.forEach((r, i) => {
        const w = Math.sin(tt * r.sp + i) * 0.06;
        ctx.beginPath();
        ctx.moveTo(-W * 0.05, H * (0.95 + r.off));
        ctx.bezierCurveTo(W * 0.3, H * (0.85 + w + r.off), W * 0.6, H * (0.25 - w + r.off), W * 1.05, H * (0.05 + r.off));
        ctx.strokeStyle = rgba(r.c, 0.05 * bright); ctx.lineWidth = r.w * 10; ctx.stroke();
        ctx.strokeStyle = rgba(r.c, 0.22 * bright); ctx.lineWidth = r.w; ctx.stroke();
      });
      if (edgeCache) { ctx.globalAlpha = fade; ctx.drawImage(edgeCache, 0, 0, W, H); }

      for (const p of particles) {
        if (!reduced) {
          p.t += p.back ? -p.speed * 0.5 : p.speed * speedMul;
          if (p.t > 1 || p.t < 0) {
            p.e = Math.floor(Math.random() * edges.length);
            p.back = s.training && Math.random() < 0.25;
            p.t = p.back ? 1 : 0;
          }
        }
        const ed = edges[p.e] || [0, 0];
        const A = nodes[ed[0]], B = nodes[ed[1]];
        if (!A || !B) continue;
        const x = A.x + (B.x - A.x) * p.t, y = A.y + (B.y - A.y) * p.t;
        ctx.fillStyle = rgba(p.back ? C.hot : p.color, (p.back ? 0.8 : 0.55) * bright);
        ctx.beginPath(); ctx.arc(x, y, p.back ? 2.2 : 1.4, 0, Math.PI * 2); ctx.fill();
      }

      // Proximity synaptic lines between moving particles
      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        const edI = edges[particles[i].e] || [0, 0];
        const AI = nodes[edI[0]], BI = nodes[edI[1]];
        if (!AI || !BI) continue;
        const xi = AI.x + (BI.x - AI.x) * particles[i].t;
        const yi = AI.y + (BI.y - AI.y) * particles[i].t;

        for (let j = i + 1; j < Math.min(i + 15, particles.length); j++) {
          const edJ = edges[particles[j].e] || [0, 0];
          const AJ = nodes[edJ[0]], BJ = nodes[edJ[1]];
          if (!AJ || !BJ) continue;
          const xj = AJ.x + (BJ.x - AJ.x) * particles[j].t;
          const yj = AJ.y + (BJ.y - AJ.y) * particles[j].t;

          const dx = xi - xj, dy = yi - yj;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 65) {
            const alpha = (1 - dist / 65) * 0.18 * bright;
            ctx.strokeStyle = rgba(C.cyan, alpha);
            ctx.beginPath();
            ctx.moveTo(xi, yi);
            ctx.lineTo(xj, yj);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const pulse = reduced ? 0.7 : 0.6 + 0.4 * Math.sin(now / 650 + n.phase);
        const col = n.layer === 0 ? C.sky : n.layer === LAYERS.length - 1 ? mix(C.violet, hiddenC, 0.6) : hiddenC;
        const r = 6;
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 28);
        g.addColorStop(0, rgba(col, 0.32 * pulse * bright)); g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, 28, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = rgba(col, 0.55); ctx.lineWidth = 1.2;
        if (n.hex) hexPath(n.x, n.y, r + 3); else { ctx.beginPath(); ctx.arc(n.x, n.y, r + 3, 0, Math.PI * 2); }
        ctx.stroke();
        ctx.fillStyle = rgba(C.white, 0.5 + 0.4 * pulse);
        ctx.beginPath(); ctx.arc(n.x, n.y, 2.6, 0, Math.PI * 2); ctx.fill();
      }

      if (idle) {
        const k = ((now - lastInput - 20000) % 6000) / 6000;
        ctx.strokeStyle = rgba(C.cyan, 0.25 * (1 - k)); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(W / 2, H / 2, k * Math.max(W, H) * 0.6, 0, Math.PI * 2); ctx.stroke();
        const size = Math.min(W, H) * 0.22, ox = W / 2 - size * 0.5, oy = H / 2 - size * 0.5;
        const prog = Math.min(1, k * 1.6) * (DIGIT.length - 1);
        ctx.strokeStyle = rgba(C.white, 0.18); ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath();
        for (let i = 0; i <= Math.floor(prog); i++) {
          const d = DIGIT[i];
          if (i === 0) ctx.moveTo(ox + d[0] * size, oy + d[1] * size); else ctx.lineTo(ox + d[0] * size, oy + d[1] * size);
        }
        const fi = Math.floor(prog);
        if (fi < DIGIT.length - 1) {
          const f = prog - fi, a = DIGIT[fi], b = DIGIT[fi + 1];
          ctx.lineTo(ox + (a[0] + (b[0] - a[0]) * f) * size, oy + (a[1] + (b[1] - a[1]) * f) * size);
        }
        ctx.stroke();
      }
      ctx.restore();
    };

    const loop = (now) => { raf = requestAnimationFrame(loop); if (now - last < 15) return; last = now; draw(now); };
    const start = () => { cancelAnimationFrame(raf); if (NV.reduced()) draw(performance.now()); else raf = requestAnimationFrame(loop); };
    const onInput = () => { lastInput = performance.now(); };

    layout(); start();
    window.addEventListener("resize", () => { layout(); if (NV.reduced()) draw(performance.now()); });
    document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAnimationFrame(raf); else start(); });
    window.addEventListener("pointermove", (e) => {
      onInput();
      mouse = { x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 };
      if (!NV.reduced() && circuit) circuit.style.translate = `${mouse.x * -24}px ${mouse.y * -24}px`;
    }, { passive: true });
    window.addEventListener("keydown", onInput);
    window.addEventListener("pointerdown", onInput, { passive: true });
    mql.addEventListener("change", start);
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildChrome();
    startBackground();
    NV.bg.kick();
    let saved = "en";
    try { saved = localStorage.getItem("nv-lang") || "en"; } catch (e) {}
    NV.setLang(saved === "th" ? "th" : "en");
    document.dispatchEvent(new Event("nv-ready"));
  });
})();
