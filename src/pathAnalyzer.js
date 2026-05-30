const SEGMENT_COUNT      = 6;
const ANGULAR_THRESHOLD  = 4.5;   // total radians of turning to qualify
const MIN_ZONE_RADIUS    = 60;
const MAX_ZONE_RADIUS    = 140;
const JETSTREAM_STRAIGHT = 0.65;
const STORM_REVERSALS    = 3;
const TURB_REVERSALS     = 4;
const TURB_MAX_STRAIGHT  = 0.4;

export function analyzePath(path, cw, ch) {
  if (path.length < 4) return [];

  const minT   = path[0].time;
  const maxT   = path[path.length - 1].time;
  const window = (maxT - minT) / SEGMENT_COUNT;
  const zones  = [];

  for (let seg = 0; seg < SEGMENT_COUNT; seg++) {
    const t0 = minT + seg * window;
    const t1 = t0 + window;
    const isLast = seg === SEGMENT_COUNT - 1;
    const pts = path.filter(p => p.time >= t0 && (isLast ? p.time <= t1 : p.time < t1));
    if (pts.length < 3) continue;

    const zone = classifySegment(pts);
    if (zone) zones.push(zone);
  }

  return zones;
}

function classifySegment(pts) {
  const n = pts.length;

  // --- metrics ---
  let arcLen = 0, angularChange = 0, reversals = 0;
  let prevSign = 0;
  let sumSinH = 0, sumCosH = 0;

  for (let i = 1; i < n; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    arcLen += Math.hypot(dx, dy);

    const da = angleDiff(pts[i].angle, pts[i - 1].angle);
    angularChange += Math.abs(da);

    const sign = Math.sign(da);
    if (sign !== 0 && sign !== prevSign) { if (prevSign !== 0) reversals++; prevSign = sign; }

    sumSinH += Math.sin(pts[i].angle);
    sumCosH += Math.cos(pts[i].angle);
  }

  const first = pts[0], last = pts[n - 1];
  const displacement = Math.hypot(last.x - first.x, last.y - first.y);
  const straightness  = arcLen > 0 ? Math.min(displacement / arcLen, 1) : 0;
  const meanHeading   = Math.atan2(sumSinH, sumCosH);

  // centroid
  const cx = pts.reduce((s, p) => s + p.x, 0) / n;
  const cy = pts.reduce((s, p) => s + p.y, 0) / n;

  // bounding box diagonal → radius
  const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
  const minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y));
  const diag = Math.hypot(maxX - minX, maxY - minY);
  const r    = Math.max(MIN_ZONE_RADIUS, Math.min(MAX_ZONE_RADIUS, diag * 0.35));

  // --- classification ---
  let type = null;

  // Turbulence must be checked before storm — its condition (reversals > 4) is a
  // strict subset of storm's (reversals >= 3), so checking storm first would shadow it.
  if (straightness > JETSTREAM_STRAIGHT && angularChange < ANGULAR_THRESHOLD) {
    type = 'jetstream';
  } else if (reversals > TURB_REVERSALS && straightness < TURB_MAX_STRAIGHT) {
    type = 'turbulence';
  } else if (angularChange >= ANGULAR_THRESHOLD && reversals >= STORM_REVERSALS) {
    type = 'storm';
  } else if (angularChange >= ANGULAR_THRESHOLD && reversals < STORM_REVERSALS) {
    type = 'thermal';
  }

  if (!type) return null;

  return {
    type,
    x: cx,
    y: cy,
    r,
    heading: meanHeading,
    phase: Math.random() * Math.PI * 2
  };
}

// Shortest signed angle difference
function angleDiff(a, b) {
  let d = a - b;
  while (d >  Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
