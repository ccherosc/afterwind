const TURN_SPEED       = 2.2;   // rad/s
const THROTTLE_RATE    = 120;   // px/s per second
const MIN_SPEED        = 55;
const MAX_SPEED        = 210;
const BOOST_SPEED      = 340;
const BOOST_DURATION   = 1.5;   // seconds
const BOOST_COOLDOWN   = 4.0;   // seconds
const MAX_TRAIL        = 90;    // positions kept for visual trail
const PATH_SAMPLE_MS   = 100;   // record path every 100ms
const MAX_PATH_POINTS  = 800;

export function createPlayer(cw, ch) {
  return {
    x: cw / 2,
    y: ch / 2,
    angle: 0,           // radians, 0 = north, clockwise
    speed: 90,
    throttle: 90,
    boosting: false,
    boostTimer: 0,
    boostCooldown: 0,
    trail: [],          // { x, y } visual trail
    path: [],           // { x, y, angle, speed, time } recorded path
    lastPathMs: 0
  };
}

export function updatePlayer(player, input, dt, cw, ch, wx) {
  if (input.isLeft())         player.angle -= TURN_SPEED * dt;
  if (input.isRight())        player.angle += TURN_SPEED * dt;
  if (input.isThrottleUp())   player.throttle = Math.min(player.throttle + THROTTLE_RATE * dt, MAX_SPEED);
  if (input.isThrottleDown()) player.throttle = Math.max(player.throttle - THROTTLE_RATE * dt, MIN_SPEED);

  // Boost activation
  if (input.isBoost() && !player.boosting && player.boostCooldown <= 0) {
    player.boosting    = true;
    player.boostTimer  = BOOST_DURATION;
    player.boostCooldown = BOOST_COOLDOWN;
  }
  if (player.boosting) {
    player.boostTimer -= dt;
    if (player.boostTimer <= 0) player.boosting = false;
  }
  if (player.boostCooldown > 0) player.boostCooldown -= dt;

  // Smoothly approach target speed
  const target = player.boosting ? BOOST_SPEED : player.throttle;
  player.speed += (target - player.speed) * Math.min(dt * 6, 1);

  // Move
  player.x += Math.sin(player.angle) * player.speed * dt;
  player.y -= Math.cos(player.angle) * player.speed * dt;

  // Weather forces (jetstream push + turbulence drift)
  if (wx) {
    player.x     += wx.forceX * dt;
    player.y     += wx.forceY * dt;
    player.angle += wx.angleDrift;
  }

  // Wrap at canvas edges
  if (player.x < 0)   player.x += cw;
  if (player.x > cw)  player.x -= cw;
  if (player.y < 0)   player.y += ch;
  if (player.y > ch)  player.y -= ch;

  // Trail
  player.trail.push({ x: player.x, y: player.y });
  if (player.trail.length > MAX_TRAIL) player.trail.shift();
}

export function recordPath(player, nowMs) {
  if (nowMs - player.lastPathMs < PATH_SAMPLE_MS) return;
  player.lastPathMs = nowMs;
  player.path.push({
    x: player.x,
    y: player.y,
    angle: player.angle,
    speed: player.speed,
    time: nowMs
  });
  if (player.path.length > MAX_PATH_POINTS) player.path.shift();
}

export function drawPlayer(ctx, player, shipsImg) {
  const { x, y, angle, boosting } = player;

  // Boost flame behind plane
  if (boosting) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = `rgba(255, 180, 40, ${0.6 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(-6, 18);
    ctx.lineTo(6, 18);
    ctx.lineTo(0, 30 + Math.random() * 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  if (shipsImg) {
    // First aircraft: 32x32 cell (content x=0..31, y=4..27; transparent padding is fine)
    const sw = 32, sh = 32, dw = 48, dh = 48;
    ctx.drawImage(shipsImg, 0, 0, sw, sh, -dw / 2, -dh / 2, dw, dh);
  } else {
    // Fallback: simple triangle plane
    ctx.fillStyle = '#64c8ff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(-9,  10);
    ctx.lineTo( 0,   6);
    ctx.lineTo( 9,  10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export function drawTrail(ctx, player) {
  const pts = player.trail;
  if (pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.stroke();
  ctx.restore();
}
