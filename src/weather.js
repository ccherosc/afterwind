const STORM_DRAIN   = 30;   // integrity/s while inside storm
const JET_FORCE     = 60;   // px/s push from jetstream
const TURB_DRIFT    = 0.16; // max radians of angle noise per frame

export function createWeatherSystem(zones) {
  return { zones: zones.map(z => ({ ...z })) };
}

// Returns { scoreMult, integrityDrain, forceX, forceY, angleDrift }
export function updateWeather(sys, player, dt) {
  const result = { scoreMult: 1, integrityDrain: 0, forceX: 0, forceY: 0, angleDrift: 0 };
  if (!sys) return result;

  for (const z of sys.zones) {
    z.phase += dt * 1.8;
    const dist = Math.hypot(player.x - z.x, player.y - z.y);
    if (dist >= z.r) continue;

    switch (z.type) {
      case 'thermal':
        result.scoreMult = 2;
        break;
      case 'storm':
        result.integrityDrain += STORM_DRAIN;
        break;
      case 'jetstream':
        result.forceX += Math.sin(z.heading) * JET_FORCE;
        result.forceY -= Math.cos(z.heading) * JET_FORCE;
        break;
      case 'turbulence':
        result.angleDrift += (Math.random() - 0.5) * TURB_DRIFT;
        break;
    }
  }
  return result;
}

export function drawWeather(ctx, sys, now) {
  if (!sys) return;
  for (const z of sys.zones) drawZone(ctx, z, now);
}

function drawZone(ctx, z, now) {
  switch (z.type) {
    case 'thermal':    drawThermal(ctx, z);    break;
    case 'storm':      drawStorm(ctx, z);      break;
    case 'jetstream':  drawJetstream(ctx, z);  break;
    case 'turbulence': drawTurbulence(ctx, z); break;
  }
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function bloom(ctx, x, y, r, col, alpha, layers = 3) {
  for (let i = layers; i >= 1; i--) {
    const lr = r * (1 + i * 0.35);
    const la = alpha * (1 / i) * 0.6;
    const g  = ctx.createRadialGradient(x, y, 0, x, y, lr);
    g.addColorStop(0,   `rgba(${col},${la})`);
    g.addColorStop(0.4, `rgba(${col},${la * 0.4})`);
    g.addColorStop(1,   `rgba(${col},0)`);
    ctx.beginPath();
    ctx.arc(x, y, lr, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }
}

function zoneLabel(ctx, text, x, y, col) {
  ctx.save();
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  const tw = ctx.measureText(text).width;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  rrect(ctx, x - tw / 2 - 5, y - 10, tw + 10, 14, 3);
  ctx.fill();
  ctx.fillStyle = `rgb(${col})`;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Thermal — red/orange layered bloom + rising bubbles ───────────────────────
function drawThermal(ctx, z) {
  const p = 0.65 + 0.25 * Math.sin(z.phase);
  bloom(ctx, z.x, z.y, z.r, '240,80,20', p);

  // inner hot core
  const core = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.r * 0.45);
  core.addColorStop(0, `rgba(255,140,40,${p * 0.55})`);
  core.addColorStop(1, 'rgba(255,80,0,0)');
  ctx.beginPath(); ctx.arc(z.x, z.y, z.r * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = core; ctx.fill();

  // rising bubbles
  const count = 7;
  for (let i = 0; i < count; i++) {
    const t    = z.phase;
    const bx   = z.x + Math.sin(t * 1.3 + i * 0.9) * z.r * 0.45;
    const frac = ((t * 0.55 + i / count) % 1);
    const by   = (z.y + z.r * 0.5) - frac * z.r * 1.2;
    const ba   = Math.max(0, 1 - frac) * 0.7;
    ctx.beginPath();
    ctx.arc(bx, by, 2 + Math.sin(t + i) * 1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,190,70,${ba})`;
    ctx.fill();
  }

  zoneLabel(ctx, 'THERMAL  ×2', z.x, z.y + z.r + 14, '255,130,50');
}

// ── Storm — deep purple vortex + lightning ────────────────────────────────────
function drawStorm(ctx, z) {
  const p = 0.72 + 0.2 * Math.sin(z.phase * 1.4);
  bloom(ctx, z.x, z.y, z.r, '150,30,220', p);

  // rotating dashed rings
  for (let ring = 1; ring <= 3; ring++) {
    ctx.save();
    ctx.translate(z.x, z.y);
    ctx.rotate(z.phase * ring * 0.6);
    ctx.strokeStyle = `rgba(200,90,255,${0.38 * p / ring})`;
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = z.phase * 10 * ring;
    ctx.beginPath(); ctx.arc(0, 0, z.r * 0.3 * ring, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // lightning flash
  const fl = Math.max(0, Math.sin(z.phase * 2.4) - 0.28) * 1.6;
  if (fl > 0) bloom(ctx, z.x, z.y, z.r * 0.3, '255,220,80', fl, 1);

  zoneLabel(ctx, 'STORM  ⚡', z.x, z.y + z.r + 14, '200,90,255');
}

// ── Jetstream — blue shimmer band ─────────────────────────────────────────────
function drawJetstream(ctx, z) {
  const p   = 0.6 + 0.2 * Math.sin(z.phase);
  const cos = Math.cos(z.heading);
  const sin = Math.sin(z.heading);
  const hw  = z.r;        // half-width of band
  const hl  = z.r * 1.6;  // half-length

  ctx.save();
  ctx.translate(z.x, z.y);
  ctx.rotate(z.heading);

  // three-layer band glow
  for (let layer = 0; layer < 3; layer++) {
    const bw = hw * (0.4 + layer * 0.35);
    const ba = (0.3 - 0.08 * layer) * p;
    const jg = ctx.createLinearGradient(0, -bw, 0, bw);
    jg.addColorStop(0,   'rgba(70,130,255,0)');
    jg.addColorStop(0.5, `rgba(70,130,255,${ba})`);
    jg.addColorStop(1,   'rgba(70,130,255,0)');
    ctx.fillStyle = jg;
    ctx.fillRect(-hl, -bw, hl * 2, bw * 2);
  }

  // shimmer sweep
  const shimX = ((z.phase * 35) % (hl * 2)) - hl;
  const shg   = ctx.createLinearGradient(shimX - 30, 0, shimX, 0);
  shg.addColorStop(0,   'rgba(180,210,255,0)');
  shg.addColorStop(0.5, `rgba(180,210,255,${0.45 * p})`);
  shg.addColorStop(1,   'rgba(180,210,255,0)');
  ctx.fillStyle = shg;
  ctx.fillRect(-hl, -hw * 0.5, hl * 2, hw);

  ctx.restore();
  zoneLabel(ctx, 'JETSTREAM', z.x, z.y + z.r * 0.55 + 14, '80,160,255');
}

// ── Turbulence — yellow/amber wobbly ring + sparks ────────────────────────────
function drawTurbulence(ctx, z) {
  const p = 0.6 + 0.25 * Math.sin(z.phase * 1.1);
  bloom(ctx, z.x, z.y, z.r, '240,200,0', p);

  // inner amber core
  const core = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.r * 0.4);
  core.addColorStop(0, `rgba(255,230,60,${p * 0.5})`);
  core.addColorStop(1, 'rgba(255,180,0,0)');
  ctx.beginPath(); ctx.arc(z.x, z.y, z.r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = core; ctx.fill();

  // wobbly ring
  ctx.save();
  ctx.beginPath();
  const segs = 64;
  for (let i = 0; i <= segs; i++) {
    const a     = (i / segs) * Math.PI * 2;
    const wobble = z.r * 0.85
      + Math.sin(a * 4 + z.phase * 3.2) * z.r * 0.1
      + Math.cos(a * 3 - z.phase * 2.4) * z.r * 0.08;
    const px = z.x + Math.cos(a) * wobble;
    const py = z.y + Math.sin(a) * wobble;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = `rgba(255,220,40,${0.7 * p})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // electric sparks
  if (Math.sin(z.phase * 3.8) > 0.55) {
    const sx = z.x + (Math.random() - 0.5) * z.r * 0.7;
    const sy = z.y + (Math.random() - 0.5) * z.r * 0.7;
    ctx.strokeStyle = 'rgba(255,255,160,0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 14, sy + (Math.random() - 0.5) * 14);
    ctx.stroke();
  }

  zoneLabel(ctx, 'TURBULENCE', z.x, z.y + z.r + 14, '240,210,40');
}
