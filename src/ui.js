// Star positions as 0-1 fractions — computed once at module load, not per frame
const STARS = (() => {
  const rng = mulberry32(42);
  return Array.from({ length: 40 }, () => ({
    fx: rng(),
    fy: rng() * 0.6,
    r:  0.5 + rng() * 1.5
  }));
})();

export function drawHUD(ctx, score, highScore, timeLeft, boostCooldown, integrity, day, now) {
  const w = ctx.canvas.width;
  ctx.save();

  // Score — top left
  ctx.font = 'bold 17px monospace';
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillText(`SCORE: ${score}`, 15, 29);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`SCORE: ${score}`, 14, 28);

  // Best + Day — top right
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillText(`BEST: ${highScore}`, w - 13, 29);
  ctx.fillStyle = '#cccccc';
  ctx.fillText(`BEST: ${highScore}`, w - 14, 28);
  if (day > 1) {
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(180,220,255,0.8)';
    ctx.fillText(`DAY ${day}`, w - 14, 44);
  }

  // Timer — top center
  const urgent = timeLeft < 10;
  ctx.textAlign = 'center';
  ctx.font = 'bold 21px monospace';
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillText(Math.ceil(timeLeft) + 's', w / 2 + 1, 31);
  ctx.fillStyle = urgent ? '#ff6666' : '#ffffff';
  ctx.fillText(Math.ceil(timeLeft) + 's', w / 2, 30);

  // Boost — below timer
  ctx.font = '12px monospace';
  if (boostCooldown > 0) {
    ctx.fillStyle = 'rgba(180,180,180,0.8)';
    ctx.fillText(`BOOST ${boostCooldown.toFixed(1)}s`, w / 2, 48);
  } else {
    ctx.fillStyle = '#ffc832';
    ctx.fillText('BOOST READY', w / 2, 48);
  }

  // Integrity bar (only shown from day 2 when weather is active)
  if (integrity !== undefined && integrity !== null) {
    const barW  = 120, barH = 6;
    const barX  = w / 2 - barW / 2, barY = 58;
    const pct   = Math.max(0, Math.min(1, integrity / 100));
    const low   = integrity < 25;
    const pulse = low ? 0.5 + 0.5 * Math.sin((now || 0) * 0.012) : 1;

    // Track
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(barX, barY, barW, barH);

    // Fill — hsl from red (0°) to green (120°) based on integrity
    const hue = Math.round(pct * 120);
    ctx.fillStyle = `hsla(${hue},80%,55%,${pulse})`;
    ctx.fillRect(barX, barY, barW * pct, barH);

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Label
    ctx.font = '9px monospace';
    ctx.fillStyle = `rgba(255,255,255,${0.6 * pulse})`;
    ctx.fillText('INTEGRITY', barX, barY - 2);
  }

  ctx.restore();
}

export function drawSplash(ctx, now) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.save();

  // Sky background
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0c1a30');
  grad.addColorStop(1, '#1a3a60');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Faint stars — positions pre-computed at module load
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (const s of STARS) {
    ctx.beginPath();
    ctx.arc(s.fx * w, s.fy * h, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Title
  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.floor(w * 0.1)}px monospace`;
  ctx.fillStyle = '#1a88cc';
  ctx.fillText('AFTERWIND', w / 2 + 2, h * 0.38 + 2);
  ctx.fillStyle = '#64c8ff';
  ctx.fillText('AFTERWIND', w / 2, h * 0.38);

  // Tagline
  ctx.font = `${Math.floor(w * 0.038)}px monospace`;
  ctx.fillStyle = 'rgba(180,220,255,0.8)';
  ctx.fillText("Fly today.  Change tomorrow's sky.", w / 2, h * 0.38 + h * 0.08);

  // Controls
  ctx.font = `${Math.floor(w * 0.034)}px monospace`;
  ctx.fillStyle = 'rgba(200,200,200,0.7)';
  ctx.fillText('WASD / Arrows — fly & throttle', w / 2, h * 0.55);
  ctx.fillText('SPACE — boost', w / 2, h * 0.55 + h * 0.055);

  // Blink prompt
  if (Math.floor(now / 500) % 2 === 0) {
    ctx.font = `bold ${Math.floor(w * 0.036)}px monospace`;
    ctx.fillStyle = '#ffc832';
    ctx.fillText('PRESS ANY KEY TO START', w / 2, h * 0.72);
  }

  ctx.restore();
}

export function drawGameOver(ctx, score, highScore, isNewHigh, now) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.save();

  // Dark overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, 0, w, h);

  // Panel
  const pw = Math.min(w * 0.8, 320);
  const ph = 220;
  const px = (w - pw) / 2;
  const py = h / 2 - ph / 2 - 20;
  ctx.fillStyle = 'rgba(10, 20, 40, 0.9)';
  ctx.strokeStyle = 'rgba(100, 180, 255, 0.4)';
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';

  // Header
  ctx.font = `bold ${Math.floor(w * 0.075)}px monospace`;
  ctx.fillStyle = '#ff6666';
  ctx.fillText('DAY COMPLETE', w / 2, py + 56);

  // Score
  ctx.font = `bold ${Math.floor(w * 0.055)}px monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`SCORE: ${score}`, w / 2, py + 110);

  // High score line
  ctx.font = `${Math.floor(w * 0.038)}px monospace`;
  if (isNewHigh) {
    ctx.fillStyle = '#ffc832';
    ctx.fillText('NEW HIGH SCORE!', w / 2, py + 148);
  } else {
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(`BEST: ${highScore}`, w / 2, py + 148);
  }

  // Blink restart
  if (Math.floor(now / 600) % 2 === 0) {
    ctx.font = `bold ${Math.floor(w * 0.034)}px monospace`;
    ctx.fillStyle = '#ffc832';
    ctx.fillText('PRESS ANY KEY TO PLAY AGAIN', w / 2, py + ph + 44);
  }

  ctx.restore();
}

// Ghost path — dashed white line of previous flight
export function drawGhostPath(ctx, path) {
  if (!path || path.length < 2) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([5, 6]);
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// Forecast overlay — panel + prompt (weather + ghost drawn by caller before this)
export function drawForecast(ctx, score, day, lostIntegrity, now) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.save();

  // Subtle dark vignette over the sky
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, w, h);

  // Top banner
  const header   = lostIntegrity ? 'INTEGRITY LOST' : 'DAY COMPLETE';
  const subhead  = `DAY ${day + 1} INCOMING`;
  const hColor   = lostIntegrity ? '#ff6666' : '#64c8ff';

  ctx.textAlign = 'center';
  ctx.font      = `bold ${Math.floor(w * 0.07)}px monospace`;
  ctx.fillStyle = hColor;
  ctx.fillText(header, w / 2, h * 0.12);

  ctx.font      = `bold ${Math.floor(w * 0.055)}px monospace`;
  ctx.fillStyle = '#ffc832';
  ctx.fillText(subhead, w / 2, h * 0.12 + Math.floor(w * 0.07) + 6);

  ctx.font      = `${Math.floor(w * 0.038)}px monospace`;
  ctx.fillStyle = 'rgba(200,200,200,0.8)';
  ctx.fillText(`SCORE: ${score}`, w / 2, h * 0.12 + Math.floor(w * 0.07) + 34);

  // Blink prompt at bottom
  if (Math.floor(now / 550) % 2 === 0) {
    ctx.font      = `bold ${Math.floor(w * 0.036)}px monospace`;
    ctx.fillStyle = '#ffc832';
    ctx.fillText('PRESS ANY KEY TO FLY', w / 2, h * 0.88);
  }

  ctx.restore();
}

// Seeded RNG for deterministic star placement
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
