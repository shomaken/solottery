/* Countdown + interactive lottery-themed canvas background */
(function () {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const LAUNCH_DURATION_DAYS = 15;
  const STORAGE_KEY = 'solottery_launch_ts_v1';

  const dom = {
    dd: document.getElementById('dd'),
    hh: document.getElementById('hh'),
    mm: document.getElementById('mm'),
    ss: document.getElementById('ss'),
    year: document.getElementById('year'),
    note: document.querySelector('.launch-note'),
    canvas: document.getElementById('bg-canvas')
  };

  // Footer year
  if (dom.year) dom.year.textContent = String(new Date().getFullYear());

  // No video/logo reveal anymore; using transparent logo in title only

  // Countdown: persist launch timestamp from first visit
  try {
    const now = Date.now();
    let launchTs = Number(localStorage.getItem(STORAGE_KEY));
    if (!Number.isFinite(launchTs) || launchTs < now) {
      launchTs = now + LAUNCH_DURATION_DAYS * DAY_MS;
      localStorage.setItem(STORAGE_KEY, String(launchTs));
    }

    function pad(n) { return n.toString().padStart(2, '0'); }
    function tick() {
      const nowTs = Date.now();
      const t = launchTs - nowTs;
      if (t <= 0) {
        dom.dd.textContent = '00';
        dom.hh.textContent = '00';
        dom.mm.textContent = '00';
        dom.ss.textContent = '00';
        if (dom.note) dom.note.textContent = 'Launching today';
        return;
      }
      const totalSeconds = Math.floor(t / 1000);
      const days = Math.floor(totalSeconds / (24 * 3600));
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      dom.dd.textContent = pad(days);
      dom.hh.textContent = pad(hours);
      dom.mm.textContent = pad(minutes);
      dom.ss.textContent = pad(seconds);

      // Update launch note using ceil to reflect whole days remaining (15 → 14 → 13 ...)
      const daysLeft = Math.max(0, Math.ceil(t / DAY_MS));
      if (dom.note) dom.note.textContent = `Launching in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
    }
    tick();
    setInterval(tick, 1000);
  } catch (_) {
    // If localStorage fails, fall back to non-persistent countdown
    const fallbackEnd = Date.now() + LAUNCH_DURATION_DAYS * DAY_MS;
    function pad(n) { return n.toString().padStart(2, '0'); }
    function tick() {
      const t = fallbackEnd - Date.now();
      if (t <= 0) return;
      const s = Math.floor(t / 1000);
      const d = Math.floor(s / (24 * 3600));
      const h = Math.floor((s % (24 * 3600)) / 3600);
      const m = Math.floor((s % 3600) / 60);
      const ss = s % 60;
      dom.dd.textContent = pad(d);
      dom.hh.textContent = pad(h);
      dom.mm.textContent = pad(m);
      dom.ss.textContent = pad(ss);
    }
    tick();
    setInterval(tick, 1000);
  }

  // Interactive canvas background: floating tokens, wheel slices, sparkles
  const canvas = dom.canvas;
  const ctx = canvas.getContext('2d', { alpha: true });
  let width = 0, height = 0, dpr = Math.min(2, window.devicePixelRatio || 1);

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Particles
  const rng = (min, max) => Math.random() * (max - min) + min;
  const TAU = Math.PI * 2;

  const tokens = [];
  const sparkles = [];
  let wheelAngle1 = 0;
  let wheelAngle2 = 0;

  function createToken() {
    const size = rng(18, 36);
    // Palette hues: gold ~50, deep red ~0
    const isGold = Math.random() < 0.6;
    const hue = isGold ? 50 : 0;
    return {
      x: rng(-50, width + 50),
      y: rng(-50, height + 50),
      r: size / 2,
      vx: rng(-0.2, 0.2),
      vy: rng(-0.15, 0.15),
      rot: rng(0, TAU),
      vr: rng(-0.01, 0.01),
      hue,
      sat: isGold ? 100 : 80,
      light: isGold ? 55 : 45
    };
  }

  function createSparkle(x, y) {
    return {
      x, y,
      life: rng(0.6, 1.2),
      age: 0,
      size: rng(1, 2.5),
      vx: rng(-0.4, 0.4),
      vy: rng(-0.6, -0.1)
    };
  }

  for (let i = 0; i < 24; i++) tokens.push(createToken());

  let mouseX = width / 2, mouseY = height / 2, repel = 0;
  window.addEventListener('pointermove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY; repel = 1;
  });
  window.addEventListener('pointerdown', (e) => {
    for (let i = 0; i < 20; i++) sparkles.push(createSparkle(e.clientX, e.clientY));
  });

  function drawToken(t) {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.rot);
    // token base
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, t.r);
    const colorMain = `hsl(${t.hue} ${t.sat}% ${t.light}%)`;
    const colorEdge = `hsl(${t.hue} ${Math.max(60, t.sat - 20)}% ${Math.max(28, t.light - 20)}%)`;
    grad.addColorStop(0, colorMain);
    grad.addColorStop(1, colorEdge);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, t.r, 0, TAU);
    ctx.fill();

    // currency mark
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, t.r * 0.65, 0, TAU);
    ctx.stroke();
    ctx.font = `${Math.floor(t.r * 0.9)}px Orbitron, Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillText('SLT', 0, 0);
    ctx.restore();
  }

  function drawWheelGhost(x, y, r, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.globalAlpha = 0.08;
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.fillStyle = i % 2 === 0 ? '#FFD700' : '#B22222';
      ctx.arc(0, 0, r, (i * TAU) / segments, ((i + 1) * TAU) / segments);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  let lastTs = 0;
  function frame(ts) {
    const dt = Math.min(33, ts - lastTs || 16) / 16.67;
    lastTs = ts;
    ctx.clearRect(0, 0, width, height);

    // wheel ghosts
    const r = Math.min(width, height) * 0.4;
    wheelAngle1 += 0.01 * dt; // clockwise
    wheelAngle2 -= 0.008 * dt; // counter-clockwise
    drawWheelGhost(width * 0.25, height * 0.25, r * 0.6, wheelAngle1);
    drawWheelGhost(width * 0.75, height * 0.75, r * 0.5, wheelAngle2);

    // update & draw tokens
    for (const t of tokens) {
      const dx = t.x - mouseX;
      const dy = t.y - mouseY;
      const dist2 = dx * dx + dy * dy;
      const radius = 120;
      if (repel && dist2 < radius * radius) {
        const d = Math.sqrt(Math.max(1, dist2));
        t.vx += (dx / d) * 0.06;
        t.vy += (dy / d) * 0.06;
      }
      t.x += t.vx * dt * 1.2;
      t.y += t.vy * dt * 1.2;
      t.rot += t.vr * dt;
      if (t.x < -60) t.x = width + 60; if (t.x > width + 60) t.x = -60;
      if (t.y < -60) t.y = height + 60; if (t.y > height + 60) t.y = -60;
      drawToken(t);
    }
    repel *= 0.98;

    // sparkles
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i];
      s.age += (dt / 60);
      s.x += s.vx * dt * 3;
      s.y += s.vy * dt * 3;
      const alpha = Math.max(0, 1 - s.age / s.life);
      if (alpha <= 0) { sparkles.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = alpha;
      // sparkles in gold and deep red
      ctx.fillStyle = Math.random() < 0.7 ? '#FFD700' : '#B22222';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();


