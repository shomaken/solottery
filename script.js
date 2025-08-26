/* Typewriter + interactive lottery-themed canvas background */
(function () {
  const dom = {
    typing: document.getElementById('typing'),
    caret: document.querySelector('.caret'),
    year: document.getElementById('year'),
    canvas: document.getElementById('bg-canvas')
  };

  // Footer year
  if (dom.year) dom.year.textContent = String(new Date().getFullYear());

  // Typewriter effect: loops "Coming soon" forever
  (function setupTypewriter() {
    if (!dom.typing) return;
    const phrase = 'Coming soon';
    const typeDelayMs = 120;
    const holdAfterTypeMs = 1000;
    const deleteDelayMs = 70;
    const holdAfterDeleteMs = 600;

    let index = 0;
    let direction = 1; // 1 typing, -1 deleting

    function tick() {
      if (!dom.typing) return;
      dom.typing.textContent = phrase.slice(0, index);

      if (direction === 1) {
        if (index < phrase.length) {
          index++;
          setTimeout(tick, typeDelayMs);
        } else {
          direction = -1;
          setTimeout(tick, holdAfterTypeMs);
        }
      } else {
        if (index > 0) {
          index--;
          setTimeout(tick, deleteDelayMs);
        } else {
          direction = 1;
          setTimeout(tick, holdAfterDeleteMs);
        }
      }
    }
    tick();
  })();

  // Interactive canvas background: floating tokens, wheel slices, sparkles
  const canvas = dom.canvas;
  const ctx = canvas.getContext('2d', { alpha: true });
  let width = 0, height = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  let paused = false;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  const glows = [];
  let wheelAngle1 = 0;
  let wheelAngle2 = 0;

  function createToken() {
    const size = rng(22, 44);
    const face = Math.random() < 0.65 ? 'gold' : 'ruby';
    return {
      x: rng(-60, width + 60),
      y: rng(-60, height + 60),
      r: size / 2,
      depth: rng(0.6, 1.4),
      vx: rng(-0.18, 0.18),
      vy: rng(-0.14, 0.14),
      rot: rng(0, TAU),
      vr: rng(-0.012, 0.012),
      face
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

  const tokenCount = reduceMotion ? 14 : 28;
  for (let i = 0; i < tokenCount; i++) tokens.push(createToken());
  const glowCount = reduceMotion ? 2 : 4;
  for (let i = 0; i < glowCount; i++) glows.push({ x: rng(0, 1), y: rng(0, 1), r: rng(120, 220), a: rng(0.05, 0.12) });

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

    // Depth-of-field via subtle blur and alpha
    const depthClamped = Math.max(0.6, Math.min(1.4, t.depth || 1));
    const depthAlpha = 0.9 - Math.abs(depthClamped - 1) * 0.35;
    const blurPx = (depthClamped > 1 ? (depthClamped - 1) * 3 : (1 - depthClamped) * 2);
    if ('filter' in ctx) ctx.filter = `blur(${blurPx.toFixed(2)}px)`;
    ctx.globalAlpha = depthAlpha;

    // 3D coin body with beveled edge
    const radius = t.r;
    const edgeWidth = Math.max(2, radius * 0.18);
    // Edge ring
    const edgeGrad = ctx.createLinearGradient(-radius, 0, radius, 0);
    if (t.face === 'gold') {
      edgeGrad.addColorStop(0, '#8a6b00');
      edgeGrad.addColorStop(0.5, '#ffd700');
      edgeGrad.addColorStop(1, '#6b5200');
    } else {
      edgeGrad.addColorStop(0, '#5c0a0a');
      edgeGrad.addColorStop(0.5, '#d42a2a');
      edgeGrad.addColorStop(1, '#3d0606');
    }
    ctx.fillStyle = edgeGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.arc(0, 0, radius - edgeWidth, 0, TAU, true);
    ctx.closePath();
    ctx.fill();

    // Face glossy radial
    const faceGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.2, 0, 0, radius - edgeWidth);
    if (t.face === 'gold') {
      faceGrad.addColorStop(0, '#fff2b3');
      faceGrad.addColorStop(0.5, '#ffd700');
      faceGrad.addColorStop(1, '#8a6b00');
    } else {
      faceGrad.addColorStop(0, '#ffc9c9');
      faceGrad.addColorStop(0.5, '#d42a2a');
      faceGrad.addColorStop(1, '#5c0a0a');
    }
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius - edgeWidth, 0, TAU);
    ctx.fill();

    // Engraved mark
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.floor(radius * 0.9)}px Cinzel, Playfair Display, serif`;
    ctx.fillText('SLT', 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    // Specular highlight
    ctx.beginPath();
    ctx.ellipse(-radius * 0.25, -radius * 0.35, radius * 0.6, radius * 0.25, -0.5, 0, TAU);
    const sheen = ctx.createRadialGradient(-radius * 0.25, -radius * 0.35, radius * 0.05, -radius * 0.25, -radius * 0.35, radius * 0.4);
    sheen.addColorStop(0, 'rgba(255,255,255,0.35)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fill();

    // Reset filters
    if ('filter' in ctx) ctx.filter = 'none';
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  function drawWheelGhost(x, y, r, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.globalAlpha = reduceMotion ? 0.05 : 0.08;
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

    // background soft glows
    for (const g of glows) {
      const gx = g.x * width;
      const gy = g.y * height;
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, g.r);
      grad.addColorStop(0, `rgba(255, 215, 0, ${g.a})`);
      grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(gx, gy, g.r, 0, TAU);
      ctx.fill();
    }

    // wheel ghosts
    const r = Math.min(width, height) * 0.4;
    wheelAngle1 += (reduceMotion ? 0.006 : 0.01) * dt; // clockwise
    wheelAngle2 -= (reduceMotion ? 0.005 : 0.008) * dt; // counter-clockwise
    drawWheelGhost(width * 0.25, height * 0.25, r * 0.6, wheelAngle1);
    drawWheelGhost(width * 0.75, height * 0.75, r * 0.5, wheelAngle2);

    // update & draw tokens
    for (const t of tokens) {
      const dx = t.x - mouseX;
      const dy = t.y - mouseY;
      const dist2 = dx * dx + dy * dy;
      const radius = 140;
      if (repel && dist2 < radius * radius) {
        const d = Math.sqrt(Math.max(1, dist2));
        t.vx += (dx / d) * 0.06;
        t.vy += (dy / d) * 0.06;
      }
      t.x += t.vx * dt * 1.15;
      t.y += t.vy * dt * 1.15;
      if (!reduceMotion) t.rot += t.vr * dt;
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

    requestAnimationFrame(loop);
  }
  function loop(ts) {
    if (!paused) frame(ts || 0);
  }
  requestAnimationFrame(loop);

  // Pause on tab hidden for performance
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
  });

  // Interactive X button tilt and sheen
  (function setupInteractiveButton() {
    const btn = document.querySelector('.x-btn');
    if (!btn) return;
    const update = (e) => {
      const rect = btn.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * 10; // rotateX
      const ry = (px - 0.5) * 10; // rotateY
      btn.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      btn.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      btn.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
    };
    btn.addEventListener('pointermove', update);
    btn.addEventListener('pointerleave', () => {
      btn.style.setProperty('--rx', '0deg');
      btn.style.setProperty('--ry', '0deg');
    });
    btn.addEventListener('pointerdown', () => btn.style.setProperty('--press', '0.98'));
    btn.addEventListener('pointerup', () => btn.style.setProperty('--press', '1'));
  })();
})();


