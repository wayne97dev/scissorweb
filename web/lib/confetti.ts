const COLORS = ['#2dd4bf', '#5eead4', '#8b5cf6', '#34d399', '#f5c451', '#ffffff'];

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
  shape: number;
}

/** Lightweight dependency-free confetti burst from the upper-center. */
export function confettiBurst(count = 150): void {
  if (typeof window === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const cx = W / 2;
  const cy = H * 0.32;
  const parts: P[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const speed = 5 + Math.random() * 9;
    parts.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed * (0.6 + Math.random()),
      vy: Math.sin(angle) * speed - 4,
      size: 5 + Math.random() * 7,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      shape: (Math.random() * 2) | 0,
    });
  }

  const start = performance.now();
  const DURATION = 2600;

  function frame(t: number) {
    const elapsed = t - start;
    ctx!.clearRect(0, 0, W, H);
    const fade = Math.max(0, 1 - elapsed / DURATION);
    for (const p of parts) {
      p.vy += 0.22; // gravity
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.globalAlpha = fade;
      ctx!.fillStyle = p.color;
      if (p.shape === 0) ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      else {
        ctx!.beginPath();
        ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }
    if (elapsed < DURATION) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
