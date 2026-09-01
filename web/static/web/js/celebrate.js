// Lightweight confetti burst + haptic. No dependencies, no images.
export function haptic(pattern = 12) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch { /* ignore */ }
}

export function confetti(canvas, { duration = 1600 } = {}) {
  if (!canvas) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
  };
  resize();
  const W = () => canvas.width;
  const H = () => canvas.height;

  const colors = ['#f0521d', '#ff9012', '#5b3df5', '#16915b', '#ffd23f'];
  const count = reduce ? 24 : 90;
  const parts = Array.from({ length: count }, () => ({
    x: W() / 2 + (Math.random() - 0.5) * 80 * dpr,
    y: H() * 0.42,
    vx: (Math.random() - 0.5) * 9 * dpr,
    vy: (-Math.random() * 12 - 4) * dpr,
    g: 0.32 * dpr,
    size: (4 + Math.random() * 6) * dpr,
    color: colors[(Math.random() * colors.length) | 0],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    life: 1,
  }));

  const start = performance.now();
  function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, W(), H());
    for (const p of parts) {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life = Math.max(0, 1 - t / duration);
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (t < duration) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, W(), H());
  }
  requestAnimationFrame(frame);
}
