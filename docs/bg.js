/* Background demos. Cycle with the control, or ?bg=constellation|fireflies|aurora|drift|meteors|orbit */

const MODES = [
  { id: "constellation", label: "constellation" },
  { id: "fireflies", label: "fireflies" },
  { id: "aurora", label: "aurora" },
  { id: "drift", label: "drift" },
  { id: "meteors", label: "meteors" },
  { id: "orbit", label: "orbit" },
];

const COLOR_DOT = "90, 160, 190";
const COLOR_LINE = "25, 137, 198";

function startBackground() {
  const canvas = document.getElementById("bg");
  const cycleBtn = document.getElementById("bg-cycle");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const params = new URLSearchParams(window.location.search);
  let mode = params.get("bg") || "constellation";
  if (!MODES.some((m) => m.id === mode)) mode = "constellation";

  let width = 0;
  let height = 0;
  let dots = [];
  let blobs = [];
  let streaks = [];
  let t = 0;
  let raf = 0;
  let running = false;

  function label() {
    if (!cycleBtn) return;
    cycleBtn.hidden = reduced;
    cycleBtn.textContent = "Background: " + mode;
  }

  function spawnDots(count, speed) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      r: Math.random() * 1.6 + 0.8,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function setupMode() {
    const area = Math.max(1, width * height);
    const n = Math.round(Math.min(72, Math.max(22, area / 18000)));
    const span = Math.min(width, height);

    dots = [];
    blobs = [];
    streaks = [];

    if (mode === "constellation") dots = spawnDots(n, 0.26);
    else if (mode === "fireflies") dots = spawnDots(Math.round(n * 0.75), 0.12);
    else if (mode === "drift") {
      dots = spawnDots(n, 0);
      for (const d of dots) {
        d.vx = 0.18 + Math.random() * 0.12;
        d.vy = 0.28 + Math.random() * 0.18;
      }
    } else if (mode === "orbit") {
      dots = Array.from({ length: Math.round(n * 0.7) }, () => ({
        ang: Math.random() * Math.PI * 2,
        rad: span * (0.12 + Math.random() * 0.42),
        spin: (Math.random() * 0.004 + 0.0015) * (Math.random() < 0.5 ? 1 : -1),
        r: Math.random() * 1.4 + 0.7,
        cx: width * 0.5,
        cy: height * 0.42,
      }));
    } else if (mode === "aurora") {
      const max = Math.max(width, height);
      blobs = [
        { x: width * 0.25, y: height * 0.35, r: max * 0.28, vx: 0.55, vy: 0.38, c: "122, 162, 255", phase: 0 },
        { x: width * 0.7, y: height * 0.6, r: max * 0.24, vx: -0.48, vy: 0.42, c: "137, 240, 242", phase: 1.7 },
        { x: width * 0.55, y: height * 0.22, r: max * 0.2, vx: 0.4, vy: -0.5, c: "90, 140, 255", phase: 3.1 },
        { x: width * 0.35, y: height * 0.75, r: max * 0.18, vx: -0.35, vy: -0.32, c: "160, 210, 255", phase: 4.4 },
      ];
    } else if (mode === "meteors") {
      streaks = [];
    }
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setupMode();
  }

  function bounce(p) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > width) p.vx *= -1;
    if (p.y < 0 || p.y > height) p.vy *= -1;
    p.x = Math.min(width, Math.max(0, p.x));
    p.y = Math.min(height, Math.max(0, p.y));
  }

  function wrap(p) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x > width + 8) p.x = -8;
    if (p.y > height + 8) p.y = -8;
    if (p.x < -8) p.x = width + 8;
    if (p.y < -8) p.y = height + 8;
  }

  function drawConstellation() {
    const link = width < 700 ? 110 : 140;
    for (const d of dots) bounce(d);
    ctx.lineWidth = 1.15;
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i];
        const b = dots[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist >= link) continue;
        ctx.strokeStyle = `rgba(${COLOR_LINE}, ${(1 - dist / link) * 0.38})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    for (const d of dots) {
      ctx.fillStyle = `rgba(${COLOR_DOT}, 0.7)`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFireflies() {
    for (const d of dots) bounce(d);
    for (const d of dots) {
      const pulse = 0.35 + Math.sin(t * 0.03 + d.phase) * 0.25;
      ctx.fillStyle = `rgba(${COLOR_DOT}, ${pulse})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r + 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawAurora() {
    ctx.globalCompositeOperation = "lighter";
    for (const b of blobs) {
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < width * 0.12 || b.x > width * 0.88) b.vx *= -1;
      if (b.y < height * 0.12 || b.y > height * 0.88) b.vy *= -1;
      const breathe = b.r * (1 + Math.sin(t * 0.012 + b.phase) * 0.18);
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, breathe);
      g.addColorStop(0, `rgba(${b.c}, 0.28)`);
      g.addColorStop(0.45, `rgba(${b.c}, 0.1)`);
      g.addColorStop(1, `rgba(${b.c}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, breathe, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function drawDrift() {
    for (const d of dots) wrap(d);
    for (const d of dots) {
      ctx.fillStyle = `rgba(${COLOR_DOT}, 0.45)`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function spawnMeteor() {
    const fromTop = Math.random() < 0.6;
    streaks.push({
      x: fromTop ? Math.random() * width : -20,
      y: fromTop ? -20 : Math.random() * height * 0.6,
      vx: 3.2 + Math.random() * 2.4,
      vy: 1.6 + Math.random() * 1.8,
      life: 1,
      len: 40 + Math.random() * 50,
    });
  }

  function drawMeteors() {
    if (streaks.length < 3 && Math.random() < 0.02) spawnMeteor();
    ctx.lineWidth = 1.4;
    ctx.lineCap = "round";
    for (let i = streaks.length - 1; i >= 0; i--) {
      const s = streaks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.008;
      const mag = Math.hypot(s.vx, s.vy) || 1;
      const tx = s.x - (s.vx / mag) * s.len;
      const ty = s.y - (s.vy / mag) * s.len;
      const g = ctx.createLinearGradient(tx, ty, s.x, s.y);
      g.addColorStop(0, "rgba(122, 162, 255, 0)");
      g.addColorStop(1, `rgba(${COLOR_DOT}, ${Math.max(0, s.life) * 0.85})`);
      ctx.strokeStyle = g;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
      if (s.life <= 0 || s.x > width + 80 || s.y > height + 80) streaks.splice(i, 1);
    }
  }

  function drawOrbit() {
    for (const d of dots) {
      d.ang += d.spin;
      const x = d.cx + Math.cos(d.ang) * d.rad;
      const y = d.cy + Math.sin(d.ang) * d.rad * 0.62;
      ctx.fillStyle = `rgba(${COLOR_DOT}, 0.55)`;
      ctx.beginPath();
      ctx.arc(x, y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame() {
    t += 1;
    ctx.clearRect(0, 0, width, height);
    if (mode === "constellation") drawConstellation();
    else if (mode === "fireflies") drawFireflies();
    else if (mode === "aurora") drawAurora();
    else if (mode === "drift") drawDrift();
    else if (mode === "meteors") drawMeteors();
    else if (mode === "orbit") drawOrbit();
    raf = requestAnimationFrame(frame);
  }

  function play() {
    if (running || reduced) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function pause() {
    running = false;
    cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, width, height);
  }

  function apply() {
    label();
    if (reduced) {
      pause();
      return;
    }
    const url = new URL(window.location.href);
    if (mode === "constellation") url.searchParams.delete("bg");
    else url.searchParams.set("bg", mode);
    history.replaceState(null, "", url);
    resize();
    pause();
    play();
  }

  if (cycleBtn) {
    cycleBtn.addEventListener("click", () => {
      const i = MODES.findIndex((m) => m.id === mode);
      mode = MODES[(i + 1) % MODES.length].id;
      apply();
    });
  }

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
    else play();
  });

  apply();
}

startBackground();
