const MAX_ORBS     = 8;
const ORB_RADIUS   = 13;
const ORB_SCORE    = 10;
const SPAWN_MARGIN = 70;
const MIN_DIST     = 130;   // min spawn dist from player

export function createOrbSystem() {
  return { orbs: [] };
}

export function spawnOrb(sys, cw, ch, px, py) {
  if (sys.orbs.length >= MAX_ORBS) return;
  let x, y, tries = 0;
  do {
    x = SPAWN_MARGIN + Math.random() * (cw - SPAWN_MARGIN * 2);
    y = SPAWN_MARGIN + Math.random() * (ch - SPAWN_MARGIN * 2);
    tries++;
  } while (tries < 12 && Math.hypot(x - px, y - py) < MIN_DIST);

  sys.orbs.push({ x, y, r: ORB_RADIUS, phase: Math.random() * Math.PI * 2 });
}

export function updateOrbs(sys, dt) {
  for (const o of sys.orbs) o.phase += dt * 2.8;
}

export function collectOrbs(sys, px, py) {
  let pts = 0;
  sys.orbs = sys.orbs.filter(o => {
    if (Math.hypot(o.x - px, o.y - py) < o.r + 10) {
      pts += ORB_SCORE;
      return false;
    }
    return true;
  });
  return pts;
}

export function drawOrbs(ctx, sys) {
  for (const o of sys.orbs) {
    const pulse = 0.75 + 0.25 * Math.sin(o.phase);
    const r = o.r * pulse;

    // Outer glow
    const grd = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r * 2.4);
    grd.addColorStop(0,   `rgba(80, 210, 255, ${0.45 * pulse})`);
    grd.addColorStop(0.5, `rgba(80, 210, 255, ${0.15 * pulse})`);
    grd.addColorStop(1,   'rgba(80, 210, 255, 0)');
    ctx.beginPath();
    ctx.arc(o.x, o.y, r * 2.4, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(o.x, o.y, r * 0.75, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(190, 240, 255, ${0.92 * pulse})`;
    ctx.fill();

    // Bright center
    ctx.beginPath();
    ctx.arc(o.x, o.y, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
  }
}
