/* NeuroVision — Cinematic Starting Animation & Tripartite AI Brain / Web / JS Engine Architecture Visualizer */
(function () {
  "use strict";

  const t = (k) => (window.NV && window.NV.t ? window.NV.t(k) : k);

  const STAGES = [
    {
      id: "intro-title",
      badge: "AI ARCHITECTURE REVEAL",
      title: "Neural Networks Architecture",
      subtitle: "An interactive journey through synaptic mathematics, reactive web frontends, and client-side JIT compilation.",
      desc: "Inside your browser, modern artificial intelligence isn't magic—it is a harmonious synchronization of mathematical weight matrices, reactive visual frontends, and ultra-fast client-side JavaScript execution."
    },
    {
      id: "neural-network",
      badge: "CORE PILLAR 01 · THE ARTIFICIAL BRAIN",
      title: "The Neural Network: Synaptic Weights & Tensors",
      subtitle: "Multi-layer perceptron topology calculating forward activations: z = W · x + b, a = σ(z).",
      desc: "Modeled after biological brain synapses, artificial neurons receive weighted inputs, compute a dot product, add a bias offset, and pass through non-linear activation functions to formulate complex non-linear decisions."
    },
    {
      id: "website-layer",
      badge: "CORE PILLAR 02 · THE INTERACTIVE WEBSITE",
      title: "The Website: Reactive DOM, Canvas & Event Loop",
      subtitle: "60 FPS rendering pipeline, SVG vector graphs, and tactile user controls.",
      desc: "The website serves as the sensory perception and visualization plane. It translates tactile mouse gestures, drag-and-drop weights, and hyperparameter controls directly into tensor updates rendered in real-time."
    },
    {
      id: "js-engine",
      badge: "CORE PILLAR 03 · THE JS COMPILATION ENGINE",
      title: "The JavaScript Engine: V8 / JIT Tensor Execution",
      subtitle: "Ignition bytecode interpretation & TurboFan machine code compilation at native speeds.",
      desc: "Without external servers or Python runtimes, the browser's JavaScript engine (Google V8, SpiderMonkey) executes floating-point matrix multiplications using Typed Arrays (Float32Array) in microsecond latencies."
    },
    {
      id: "tripartite-connection",
      badge: "COMPLETE INTEGRATION · LIVE ARCHITECTURE",
      title: "The Tripartite Neural Loop: Brain ⇄ Web ⇄ JS Engine",
      subtitle: "Continuous high-speed data telemetry linking neural synapses, visual DOM, and JIT compilation.",
      desc: "Observe how signals flow seamlessly: The user manipulates weights in the Web Interface, the JS Engine executes matrix operations in microseconds, and the Neural Network updates its decision boundary in real-time."
    }
  ];

  let currentStage = 0;
  let isPlaying = false;
  let autoTimer = null;
  let animFrame = null;
  let canvas = null;
  let ctx = null;
  let particles = [];
  let connectionPulses = [];
  let stageProgress = 0;
  let overlayEl = null;

  function createIntroElements() {
    if (document.getElementById("nv-intro-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "nv-intro-overlay";
    overlay.className = "nv-intro-overlay active";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Introduction to How Artificial Intelligence Brain Works");

    overlay.innerHTML = `
      <div class="nv-intro-backdrop"></div>
      <div class="nv-intro-container">
        <!-- Top Control Bar -->
        <header class="nv-intro-topbar">
          <div class="nv-intro-brand">
            <span class="pulse-indicator"></span>
            <span class="intro-brand-title">NEUROVISION ARCHITECTURE SIMULATOR</span>
          </div>
          <div class="nv-intro-nav-pills" id="intro-stage-pills">
            ${STAGES.map((s, i) => `
              <button type="button" class="intro-pill ${i === 0 ? "active" : ""}" data-stage="${i}">
                <span class="pill-num">0${i + 1}</span>
                <span class="pill-name">${s.badge.split("·")[0].replace("CORE PILLAR ", "").trim()}</span>
              </button>
            `).join("")}
          </div>
          <div class="nv-intro-actions">
            <button type="button" class="intro-btn-icon" id="btn-intro-play" title="Auto Play / Pause" aria-label="Toggle auto play">
              <svg id="icon-play-state" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
            <button type="button" class="intro-btn-skip" id="btn-intro-skip">
              <span>Enter Lab</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- Main Visual Stage Area -->
        <div class="nv-intro-stage">
          <canvas id="nv-intro-canvas" class="nv-intro-canvas"></canvas>

          <!-- Floating High-Tech Typography & Narrative Panel -->
          <div class="nv-intro-narrative" id="intro-narrative">
            <div class="narrative-glass-card">
              <div class="narrative-badge-row">
                <span class="narrative-badge" id="intro-badge">AI ARCHITECTURE REVEAL</span>
                <span class="telemetry-badge" id="intro-telemetry">STATUS: SYNAPSE ONLINE</span>
              </div>
              <h2 class="narrative-heading" id="intro-heading">
                Introduction to How Artificial Intelligence Brain Works
              </h2>
              <p class="narrative-subheading" id="intro-subheading">
                A journey through biological-inspired neural mathematics, interactive web frontends, and browser JavaScript compilation engines.
              </p>
              <p class="narrative-desc" id="intro-desc">
                Inside your browser, modern artificial intelligence isn't magic—it is a harmonious synchronization of mathematical weight matrices, reactive visual frontends, and ultra-fast client-side JavaScript execution.
              </p>

              <!-- Live Interactive Telemetry Hud -->
              <div class="intro-hud-grid" id="intro-hud-grid">
                <div class="hud-item">
                  <span class="hud-label">SYNAPSE TOPOLOGY</span>
                  <strong class="hud-value" id="hud-synapses">2 → 4 → 3 → 1</strong>
                </div>
                <div class="hud-item">
                  <span class="hud-label">JS ENGINE RUNTIME</span>
                  <strong class="hud-value text-cyan" id="hud-runtime">V8 JIT (Float32)</strong>
                </div>
                <div class="hud-item">
                  <span class="hud-label">INFERENCE LATENCY</span>
                  <strong class="hud-value text-green" id="hud-latency">0.08 ms</strong>
                </div>
                <div class="hud-item">
                  <span class="hud-label">DOM DISPATCH</span>
                  <strong class="hud-value text-amber" id="hud-dom">60 FPS Hardware Accel</strong>
                </div>
              </div>

              <!-- Navigation & Progress Controls -->
              <div class="narrative-footer">
                <div class="narrative-controls">
                  <button type="button" class="pill-outline tight" id="btn-intro-prev">← Previous</button>
                  <button type="button" class="pill-primary tight" id="btn-intro-next">Next Step →</button>
                </div>
                <div class="intro-progress-bar">
                  <div class="progress-fill" id="intro-progress-fill" style="width: 20%;"></div>
                </div>
                <div class="step-counter">
                  <span id="intro-current-step">1</span> of 5
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlayEl = overlay;

    canvas = document.getElementById("nv-intro-canvas");
    if (canvas) {
      ctx = canvas.getContext("2d");
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
    }

    bindIntroEvents();
    initParticles();
    startCanvasLoop();
  }

  function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    if (ctx) ctx.scale(dpr, dpr);
  }

  function initParticles() {
    particles = [];
    const count = 75;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0006,
        vy: (Math.random() - 0.5) * 0.0006,
        radius: Math.random() * 2 + 1,
        color: i % 3 === 0 ? "#22d3ee" : i % 3 === 1 ? "#a78bfa" : "#34d399",
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function bindIntroEvents() {
    const btnSkip = document.getElementById("btn-intro-skip");
    const btnPlay = document.getElementById("btn-intro-play");
    const btnNext = document.getElementById("btn-intro-next");
    const btnPrev = document.getElementById("btn-intro-prev");
    const pills = document.querySelectorAll("#intro-stage-pills .intro-pill");

    if (btnSkip) btnSkip.addEventListener("click", () => closeIntro());
    if (btnPlay) btnPlay.addEventListener("click", () => toggleAutoPlay());
    if (btnNext) btnNext.addEventListener("click", () => nextStage());
    if (btnPrev) btnPrev.addEventListener("click", () => prevStage());

    pills.forEach((p) => {
      p.addEventListener("click", () => {
        const idx = parseInt(p.dataset.stage, 10);
        goToStage(idx);
      });
    });

    // Close on Escape
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlayEl && overlayEl.classList.contains("active")) {
        closeIntro();
      }
    });
  }

  function toggleAutoPlay() {
    isPlaying = !isPlaying;
    const icon = document.getElementById("icon-play-state");
    if (icon) {
      icon.innerHTML = isPlaying
        ? `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`
        : `<path d="M8 5v14l11-7z"/>`;
    }

    if (isPlaying) {
      runAutoPlay();
    } else {
      if (autoTimer) clearTimeout(autoTimer);
    }
  }

  function runAutoPlay() {
    if (!isPlaying) return;
    autoTimer = setTimeout(() => {
      if (currentStage < STAGES.length - 1) {
        goToStage(currentStage + 1);
        runAutoPlay();
      } else {
        goToStage(0);
        runAutoPlay();
      }
    }, 5500);
  }

  function goToStage(idx) {
    if (idx < 0 || idx >= STAGES.length) return;
    currentStage = idx;

    // Update UI elements
    const s = STAGES[currentStage];
    const badgeEl = document.getElementById("intro-badge");
    const headingEl = document.getElementById("intro-heading");
    const subEl = document.getElementById("intro-subheading");
    const descEl = document.getElementById("intro-desc");
    const stepEl = document.getElementById("intro-current-step");
    const progressEl = document.getElementById("intro-progress-fill");
    const telemetryEl = document.getElementById("intro-telemetry");

    if (badgeEl) badgeEl.textContent = s.badge;
    if (headingEl) {
      headingEl.classList.remove("text-reveal-anim");
      void headingEl.offsetWidth; // trigger reflow
      headingEl.textContent = s.title;
      headingEl.classList.add("text-reveal-anim");
    }
    if (subEl) subEl.textContent = s.subtitle;
    if (descEl) descEl.textContent = s.desc;
    if (stepEl) stepEl.textContent = currentStage + 1;
    if (progressEl) progressEl.style.width = `${((currentStage + 1) / STAGES.length) * 100}%`;

    // Update nav pills
    const pills = document.querySelectorAll("#intro-stage-pills .intro-pill");
    pills.forEach((p, i) => {
      p.classList.toggle("active", i === currentStage);
    });

    // Update telemetry HUD
    updateTelemetry(currentStage);

    // Dynamic HUD values
    const btnNext = document.getElementById("btn-intro-next");
    if (btnNext) {
      btnNext.textContent = currentStage === STAGES.length - 1 ? "Enter Lab →" : "Next Step →";
    }

    // Trigger visual synaptic burst
    triggerSynapseBurst(currentStage);
  }

  function nextStage() {
    if (currentStage < STAGES.length - 1) {
      goToStage(currentStage + 1);
    } else {
      closeIntro();
    }
  }

  function prevStage() {
    if (currentStage > 0) {
      goToStage(currentStage - 1);
    }
  }

  function updateTelemetry(stage) {
    const hudSynapses = document.getElementById("hud-synapses");
    const hudRuntime = document.getElementById("hud-runtime");
    const hudLatency = document.getElementById("hud-latency");
    const hudDom = document.getElementById("hud-dom");
    const telemetry = document.getElementById("intro-telemetry");

    switch (stage) {
      case 0:
        if (hudSynapses) hudSynapses.textContent = "Multi-Layer Topology";
        if (hudRuntime) hudRuntime.textContent = "V8 Engine Ready";
        if (hudLatency) hudLatency.textContent = "< 0.10 ms";
        if (hudDom) hudDom.textContent = "60 FPS Reactive Sync";
        if (telemetry) telemetry.textContent = "STATE: SYNCHRONIZED";
        break;
      case 1:
        if (hudSynapses) hudSynapses.textContent = "2 In · 7 Hidden · 1 Out";
        if (hudRuntime) hudRuntime.textContent = "Sigmoid Non-Linearity";
        if (hudLatency) hudLatency.textContent = "32 Weights Active";
        if (hudDom) hudDom.textContent = "Loss: BCE Matrix";
        if (telemetry) telemetry.textContent = "STATE: SYNAPSE MESH";
        break;
      case 2:
        if (hudSynapses) hudSynapses.textContent = "SVG Vector Graph";
        if (hudRuntime) hudRuntime.textContent = "Pointer Event Pipeline";
        if (hudLatency) hudLatency.textContent = "Sub-millisecond Render";
        if (hudDom) hudDom.textContent = "Hardware Accelerated";
        if (telemetry) telemetry.textContent = "STATE: DOM REACTIVE";
        break;
      case 3:
        if (hudSynapses) hudSynapses.textContent = "Ignition Bytecode";
        if (hudRuntime) hudRuntime.textContent = "TurboFan JIT Compiler";
        if (hudLatency) hudLatency.textContent = "Float32 TypedArray";
        if (hudDom) hudDom.textContent = "Zero Garbage Collection";
        if (telemetry) telemetry.textContent = "STATE: JIT COMPILED";
        break;
      case 4:
        if (hudSynapses) hudSynapses.textContent = "3-Way Continuous Loop";
        if (hudRuntime) hudRuntime.textContent = "Full Tripartite Mesh";
        if (hudLatency) hudLatency.textContent = "0.06 ms End-to-End";
        if (hudDom) hudDom.textContent = "Real-time Telemetry";
        if (telemetry) telemetry.textContent = "STATE: TRIPARTITE ACTIVE";
        break;
    }
  }

  function triggerSynapseBurst(stage) {
    connectionPulses = [];
    for (let i = 0; i < 18; i++) {
      connectionPulses.push({
        t: Math.random(),
        speed: 0.008 + Math.random() * 0.012,
        route: i % 3,
        color: i % 2 === 0 ? "#22d3ee" : "#a855f7"
      });
    }
  }

  /* ---------- Canvas Visualizer Animation ---------- */
  function startCanvasLoop() {
    let lastTime = performance.now();

    function render(now) {
      animFrame = requestAnimationFrame(render);
      const dt = now - lastTime;
      lastTime = now;

      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      ctx.clearRect(0, 0, W, H);

      // Draw dynamic background grid & ambient glowing spots
      drawGrid(W, H, now);

      // Render stage-specific graphics
      if (currentStage === 0) {
        drawIntroConcept(W, H, now);
      } else if (currentStage === 1) {
        drawNeuralNetworkStage(W, H, now);
      } else if (currentStage === 2) {
        drawWebsiteLayerStage(W, H, now);
      } else if (currentStage === 3) {
        drawJSEngineStage(W, H, now);
      } else if (currentStage === 4) {
        drawTripartiteConnectionStage(W, H, now);
      }
    }

    animFrame = requestAnimationFrame(render);
  }

  function drawGrid(W, H, now) {
    ctx.save();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.04)";
    ctx.lineWidth = 1;
    const gridSize = 48;
    const offX = (now * 0.005) % gridSize;
    const offY = (now * 0.005) % gridSize;

    for (let x = -gridSize + offX; x < W + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = -gridSize + offY; y < H + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Floating particles
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = 1;
      if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1;
      if (p.y > 1) p.y = 0;

      const px = p.x * W;
      const py = p.y * H;
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.002 + p.phase);

      ctx.beginPath();
      ctx.arc(px, py, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.25 * pulse;
      ctx.fill();
    }
    ctx.restore();
  }

  /* Stage 0: Overview Concept */
  function drawIntroConcept(W, H, now) {
    ctx.save();
    const cx = W * 0.5;
    const cy = H * 0.46;

    // Glowing orbital rings
    const ringCount = 3;
    for (let r = 1; r <= ringCount; r++) {
      const radius = 90 * r;
      const speed = (r % 2 === 0 ? 1 : -1) * (0.0004 / r);
      const angle = now * speed;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = r === 1 ? "rgba(34, 211, 238, 0.3)" : r === 2 ? "rgba(167, 139, 250, 0.2)" : "rgba(52, 211, 153, 0.15)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([12, 16]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Satellites on the ring
      const satCount = r * 2;
      for (let s = 0; s < satCount; s++) {
        const theta = angle + (Math.PI * 2 * s) / satCount;
        const sx = cx + radius * Math.cos(theta);
        const sy = cy + radius * Math.sin(theta);

        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fillStyle = r === 1 ? "#22d3ee" : r === 2 ? "#a855f7" : "#34d399";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Center Core: AI Brain Node
    const coreGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 70);
    coreGlow.addColorStop(0, "rgba(34, 211, 238, 0.8)");
    coreGlow.addColorStop(0.5, "rgba(168, 85, 247, 0.4)");
    coreGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.fillStyle = coreGlow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Core symbol
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("AI", cx, cy);

    ctx.restore();
  }

  /* Stage 1: Neural Network Architecture */
  function drawNeuralNetworkStage(W, H, now) {
    ctx.save();
    const cx = W * 0.5;
    const cy = H * 0.46;
    const layers = [2, 4, 3, 1];
    const layerNames = ["INPUT (x)", "HIDDEN 1 (H1)", "HIDDEN 2 (H2)", "OUTPUT (ŷ)"];
    const layerColors = ["#38bdf8", "#a855f7", "#a855f7", "#34d399"];

    const layerWidth = Math.min(W * 0.75, 680);
    const startX = cx - layerWidth / 2;
    const stepX = layerWidth / (layers.length - 1);

    const nodePositions = [];

    // Calculate node coordinates
    layers.forEach((count, l) => {
      const x = startX + l * stepX;
      const layerSpan = Math.min(H * 0.55, count * 70);
      const startY = cy - layerSpan / 2;
      const nodes = [];

      for (let j = 0; j < count; j++) {
        const y = count === 1 ? cy : startY + (layerSpan * j) / (count - 1);
        nodes.push({ x, y, layer: l, index: j, color: layerColors[l] });
      }
      nodePositions.push(nodes);
    });

    // Draw Synaptic Connections (Axons)
    for (let l = 0; l < nodePositions.length - 1; l++) {
      const currentLayer = nodePositions[l];
      const nextLayer = nodePositions[l + 1];

      currentLayer.forEach((a) => {
        nextLayer.forEach((b) => {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = "rgba(56, 189, 248, 0.22)";
          ctx.lineWidth = 1.4;
          ctx.stroke();

          // Flowing signal packets
          const speed = 0.0012;
          const offset = (now * speed + a.index * 0.2 + b.index * 0.15) % 1;
          const px = a.x + (b.x - a.x) * offset;
          const py = a.y + (b.y - a.y) * offset;

          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      });
    }

    // Draw Neurons
    nodePositions.forEach((nodes, l) => {
      nodes.forEach((n) => {
        const pulse = 0.8 + 0.2 * Math.sin(now * 0.004 + n.index);

        // Glow outer
        const g = ctx.createRadialGradient(n.x, n.y, 6, n.x, n.y, 24);
        g.addColorStop(0, n.color + "99");
        g.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(n.x, n.y, 24, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = "#090d16";
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fill();

        // Inner nucleus
        ctx.beginPath();
        ctx.arc(n.x, n.y, 5 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      });

      // Layer labels at top
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(layerNames[l], startX + l * stepX, cy - Math.min(H * 0.35, 170));
    });

    // Formula overlay at bottom
    ctx.fillStyle = "#38bdf8";
    ctx.font = "600 13px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("Forward Pass: z = Σ (w_i · x_i) + b  ⟶  Activation: a = σ(z)", cx, cy + Math.min(H * 0.35, 180));

    ctx.restore();
  }

  /* Stage 2: Website Layer (DOM & Canvas) */
  function drawWebsiteLayerStage(W, H, now) {
    ctx.save();
    const cx = W * 0.5;
    const cy = H * 0.46;

    // Simulated browser viewport frame
    const frameW = Math.min(W * 0.72, 600);
    const frameH = Math.min(H * 0.58, 340);
    const fx = cx - frameW / 2;
    const fy = cy - frameH / 2;

    // Browser chrome box
    ctx.beginPath();
    roundRect(ctx, fx, fy, frameW, frameH, 16);
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fill();

    // Top window controls
    ctx.beginPath();
    ctx.arc(fx + 22, fy + 18, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fx + 38, fy + 18, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#f59e0b";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fx + 54, fy + 18, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#10b981";
    ctx.fill();

    // Address bar pill
    roundRect(ctx, fx + 80, fy + 8, frameW - 160, 20, 6);
    ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("https://neurovision.internal/lab#realtime-ai", cx, fy + 22);

    // Inside UI Layout representation
    const contentY = fy + 44;
    const contentH = frameH - 56;

    // Left sidebar (controls representation)
    roundRect(ctx, fx + 16, contentY, frameW * 0.32, contentH, 10);
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fill();

    // Sliders inside sidebar
    for (let s = 0; s < 4; s++) {
      const sy = contentY + 24 + s * 42;
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Weight w${s + 1} slider:`, fx + 26, sy);

      // Track
      roundRect(ctx, fx + 26, sy + 6, frameW * 0.32 - 20, 4, 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fill();

      // Progress thumb
      const thumbX = fx + 26 + ((Math.sin(now * 0.002 + s) + 1) / 2) * (frameW * 0.32 - 28);
      ctx.beginPath();
      ctx.arc(thumbX, sy + 8, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#38bdf8";
      ctx.fill();
    }

    // Right canvas workspace representation
    roundRect(ctx, fx + frameW * 0.32 + 28, contentY, frameW * 0.62, contentH, 10);
    ctx.fillStyle = "rgba(10, 16, 28, 0.7)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fill();

    // Dynamic wave inside the simulated workspace
    ctx.beginPath();
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 2;
    for (let x = 0; x < frameW * 0.62; x += 4) {
      const y = contentY + contentH * 0.5 + Math.sin(x * 0.04 + now * 0.005) * 35;
      if (x === 0) ctx.moveTo(fx + frameW * 0.32 + 28 + x, y);
      else ctx.lineTo(fx + frameW * 0.32 + 28 + x, y);
    }
    ctx.stroke();

    // Floating UI indicator pills
    ctx.fillStyle = "#34d399";
    ctx.font = "600 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("HTML5 Canvas · Reactive DOM Events · 60 FPS RAF Loop", cx, fy + frameH + 28);

    ctx.restore();
  }

  /* Stage 3: JavaScript Engine (V8 & JIT) */
  function drawJSEngineStage(W, H, now) {
    ctx.save();
    const cx = W * 0.5;
    const cy = H * 0.46;

    const blockW = 150;
    const blockH = 120;
    const gap = 40;
    const startX = cx - (blockW * 3 + gap * 2) / 2;

    const blocks = [
      { name: "JS CODE", sub: "User Source Script", color: "#38bdf8", detail: "Float32Array Math" },
      { name: "IGNITION", sub: "Bytecode Interpreter", color: "#a855f7", detail: "LdaNamedProperty / Star" },
      { name: "TURBOFAN", sub: "Optimizing JIT Compiler", color: "#34d399", detail: "SIMD Machine Code" }
    ];

    blocks.forEach((b, i) => {
      const bx = startX + i * (blockW + gap);
      const by = cy - blockH / 2;

      // Card box
      roundRect(ctx, bx, by, blockW, blockH, 14);
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fill();

      // Text inside
      ctx.fillStyle = b.color;
      ctx.font = "bold 13px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(b.name, bx + blockW / 2, by + 30);

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = "10px 'Manrope', sans-serif";
      ctx.fillText(b.sub, bx + blockW / 2, by + 52);

      // Micro code preview box
      roundRect(ctx, bx + 12, by + 68, blockW - 24, 36, 6);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillText(b.detail, bx + blockW / 2, by + 90);

      // Connecting arrow to next
      if (i < blocks.length - 1) {
        const ax = bx + blockW;
        const ay = cy;
        const targetX = ax + gap;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(targetX, ay);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pulsing packet
        const pOffset = (now * 0.002 + i * 0.5) % 1;
        const packetX = ax + gap * pOffset;
        ctx.beginPath();
        ctx.arc(packetX, ay, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Subtext
    ctx.fillStyle = "#38bdf8";
    ctx.font = "600 12px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("Direct In-Browser JIT Compilation: Zero Server Round-Trips", cx, cy + blockH / 2 + 45);

    ctx.restore();
  }

  /* Stage 4: Tripartite Architecture Visualizer (Brain ⇄ Web ⇄ JS Engine) */
  function drawTripartiteConnectionStage(W, H, now) {
    ctx.save();
    const cx = W * 0.5;
    const cy = H * 0.44;
    const radius = Math.min(W * 0.32, 210);

    // 3 Nodes placed symmetrically in a triangle
    const nodeA = { name: "AI NEURAL NETWORK", sub: "Weights & Activation Synapses", color: "#38bdf8", x: cx - radius * 0.86, y: cy + radius * 0.55, icon: "🧠" };
    const nodeB = { name: "INTERACTIVE WEBSITE", sub: "DOM Controls & Canvas", color: "#a855f7", x: cx, y: cy - radius * 0.88, icon: "🌐" };
    const nodeC = { name: "JS EXECUTION ENGINE", sub: "V8 JIT / Typed Arrays", color: "#34d399", x: cx + radius * 0.86, y: cy + radius * 0.55, icon: "⚡" };

    const nodes = [nodeA, nodeB, nodeC];
    const connections = [
      [nodeA, nodeB, "Weight Tensors & Output Gradients"],
      [nodeB, nodeC, "Event Dispatch & Vector Ops"],
      [nodeC, nodeA, "Float32 Forward & Backward Pass"]
    ];

    // Draw bidirectional energy conduits between each pair
    connections.forEach(([n1, n2, label], idx) => {
      // Curved conduits
      ctx.beginPath();
      const midX = (n1.x + n2.x) / 2 + (cx - (n1.x + n2.x) / 2) * 0.25;
      const midY = (n1.y + n2.y) / 2 + (cy - (n1.y + n2.y) / 2) * 0.25;

      ctx.moveTo(n1.x, n1.y);
      ctx.quadraticCurveTo(midX, midY, n2.x, n2.y);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Flowing glowing packets along the conduit
      const packetCount = 4;
      for (let p = 0; p < packetCount; p++) {
        const tVal = (now * 0.0008 + p / packetCount + idx * 0.33) % 1;
        const px = (1 - tVal) * (1 - tVal) * n1.x + 2 * (1 - tVal) * tVal * midX + tVal * tVal * n2.x;
        const py = (1 - tVal) * (1 - tVal) * n1.y + 2 * (1 - tVal) * tVal * midY + tVal * tVal * n2.y;

        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = idx === 0 ? "#38bdf8" : idx === 1 ? "#a855f7" : "#34d399";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Draw Core Tripartite Hub in center
    const coreGlow = ctx.createRadialGradient(cx, cy, 5, cx, cy, 45);
    coreGlow.addColorStop(0, "rgba(56, 189, 248, 0.4)");
    coreGlow.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, Math.PI * 2);
    ctx.fillStyle = coreGlow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = "#0c1222";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SYNC", cx, cy);

    // Draw the 3 Pillars
    nodes.forEach((n) => {
      const cardW = 190;
      const cardH = 80;
      const bx = n.x - cardW / 2;
      const by = n.y - cardH / 2;

      // Glow halo
      const halo = ctx.createRadialGradient(n.x, n.y, 10, n.x, n.y, 60);
      halo.addColorStop(0, n.color + "33");
      halo.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(n.x, n.y, 60, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      // Card glass box
      roundRect(ctx, bx, by, cardW, cardH, 12);
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.strokeStyle = n.color;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = n.color;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fill();

      // Title & Subtitle
      ctx.fillStyle = n.color;
      ctx.font = "bold 11px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`${n.icon} ${n.name}`, n.x, by + 16);

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "10px 'Manrope', sans-serif";
      ctx.fillText(n.sub, n.x, by + 36);

      // Live status pill inside card
      roundRect(ctx, n.x - 45, by + 56, 90, 16, 8);
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fill();

      ctx.fillStyle = "#34d399";
      ctx.font = "600 8.5px 'JetBrains Mono', monospace";
      ctx.fillText("● ACTIVE 60FPS", n.x, by + 68);
    });

    ctx.restore();
  }

  function roundRect(c, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /* ---------- Show / Hide API ---------- */
  function openIntro() {
    createIntroElements();
    if (overlayEl) {
      overlayEl.classList.add("active");
      overlayEl.removeAttribute("aria-hidden");
      goToStage(0);
      document.body.style.overflow = "hidden";
    }
  }

  function closeIntro() {
    if (overlayEl) {
      overlayEl.classList.remove("active");
      overlayEl.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (isPlaying) toggleAutoPlay();
      try {
        localStorage.setItem("nv-intro-seen", "true");
      } catch (e) {}

      // Smooth scroll into main lab if hash or enter
      const labEl = document.getElementById("lab");
      if (labEl) {
        labEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  // Public API
  window.NVIntro = {
    open: openIntro,
    close: closeIntro,
    goToStage: goToStage
  };

  // Auto-launch on first visit
  document.addEventListener("DOMContentLoaded", () => {
    let seen = false;
    try {
      seen = localStorage.getItem("nv-intro-seen") === "true";
    } catch (e) {}

    // Check if user came with #intro in URL or hasn't seen it yet
    if (location.hash === "#intro" || !seen) {
      setTimeout(() => openIntro(), 400);
    }
  });

})();
