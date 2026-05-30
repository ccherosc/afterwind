# Afterwind — Phase 2: Weather System Design

**Date:** 2026-05-30
**Status:** Approved

---

## Overview

The player's flight path from each round is analyzed after the timer expires or integrity is lost. That analysis produces weather zones placed where the flying happened. The forecast screen shows those zones before the next round begins. Day by day, the sky the player created becomes the sky they have to survive.

---

## Game State Flow

```
SPLASH
  → PLAYING  (day 1 — no weather zones)
      ↓ timer expires  →  analyze path  →  generate zones
    FORECAST  (sky map of day N+1 zones + ghost path)
      ↓ any key
    PLAYING  (day N+1 — zones active)
      ↓ timer expires  →  repeat
      ↓ integrity = 0  →  round ends early  →  FORECAST (still generates next day)
```

Game never hard-ends mid-session. Every round — whether the timer ran out or integrity hit zero — flows through FORECAST into the next day. The session ends only when the player closes the tab or resets from the splash screen. High score saves to localStorage after every round.

---

## New Files

### `src/pathAnalyzer.js`

Exported function: `analyzePath(path, canvasW, canvasH) → Zone[]`

Splits `player.path` into 6 equal time windows. For each window computes three metrics:

| Metric | How |
|---|---|
| `angularChange` | Sum of `Math.abs(angleDelta)` across consecutive path points |
| `straightness` | Euclidean displacement ÷ total arc length (1.0 = perfectly straight) |
| `reversals` | Count of turning-direction sign flips (left→right or right→left) |

Classification (first match wins):

| Condition | Zone type |
|---|---|
| `straightness > 0.65` AND `angularChange < threshold` | Jetstream |
| `angularChange ≥ threshold` AND `reversals < 3` | Thermal |
| `angularChange ≥ threshold` AND `reversals ≥ 3` | Storm |
| `reversals > 4` AND `straightness < 0.4` | Turbulence |
| otherwise | none |

**Zone placement:** centroid of that window's path points.

**Zone radius:** scaled from the window's path bounding-box diagonal — `clamp(diagonal * 0.35, 60, 140)` px.

**Jetstream heading:** mean angle of all velocity vectors in that window.

Returns an array of zone objects (max 6, one per window):

```js
{
  type: 'thermal' | 'storm' | 'jetstream' | 'turbulence',
  x, y,           // center (canvas coords)
  r,              // radius px
  heading,        // radians — used by jetstream for push direction
  phase: 0        // animation phase, set to Math.random()*Math.PI*2 at creation
}
```

---

### `src/weather.js`

**`createWeatherSystem(zones)`** — wraps a zone array in runtime state.

**`updateWeather(sys, player, dt)`** — returns `{ scoreMult, integrityDrain, forceX, forceY, angleDrift }`:
- Iterates active zones, checks `Math.hypot(player.x - z.x, player.y - z.y) < z.r`
- Thermal inside: `scoreMult = 2`
- Storm inside: `integrityDrain += 30` (per second, applied by caller)
- Jetstream inside: `forceX += Math.sin(z.heading) * 60`, `forceY -= Math.cos(z.heading) * 60`
- Turbulence inside: `angleDrift += (Math.random() - 0.5) * 0.16`
- Also ticks `z.phase += dt * 1.8` for animation

**`drawWeather(ctx, sys, now)`** — layered bloom renderer:

Each zone type uses three radial gradient passes (outer haze → mid ring → inner core) plus zone-specific inner animation:

| Type | Color | Inner animation |
|---|---|---|
| Thermal | `240,80,20` (red/orange) | Rising particle bubbles |
| Storm | `150,30,220` (deep purple) | Rotating dashed rings + lightning flash |
| Jetstream | `70,130,255` (blue) | Horizontal shimmer sweep across band |
| Turbulence | `240,200,0` (yellow/amber) | Wobbly ring + random electric sparks |

Labels: bold 9px monospace on dark pill background, zone color text.

---

## Modified Files

### `src/game.js`

**New state:** `STATE.FORECAST`

**New fields on `Game`:**
```js
this.integrity       = 100;
this.day             = 1;
this.weather         = null;   // WeatherSystem active this round
this.forecastWeather = null;   // WeatherSystem shown on FORECAST screen
this.lastPath        = [];     // copy of path captured at round end for ghost drawing
```

**`_endRound(lostIntegrity)`** — called when timer hits 0 OR integrity hits 0:
- Saves score / high score; sets `this.lostIntegrity = lostIntegrity`
- Runs `analyzePath(player.path, cw, ch)` → zones array
- Sets `this.forecastWeather = createWeatherSystem(zones)`
- Sets `this.lastPath = player.path.slice()` (captured before player is recreated)
- Sets state to `FORECAST`

**`_startRound()`** — updated:
- `this.integrity = 100`
- `this.day++`
- `this.weather = this.forecastWeather`  (promote forecast → active)
- `this.forecastWeather = null`

**`_update()` PLAYING additions:**
```js
const wx = updateWeather(this.weather, this.player, dt);
this.currentScoreMult = wx.scoreMult;   // used in collectOrbs
this.integrity -= wx.integrityDrain * dt;
// pass wx.forceX/Y and wx.angleDrift to updatePlayer
if (this.integrity <= 0) { this.integrity = 0; this._endRound(true); }
```

Orb score: `earned * this.currentScoreMult` (default 1, 2 inside thermal).

**`_draw()` FORECAST state:**
- Sky gradient background
- `drawWeather(ctx, this.forecastWeather, ts)` — zones for next day
- Ghost path drawn from `this.lastPath` (dashed white, 30% opacity)
- `drawForecast(ctx, this.score, this.day, this.lostIntegrity, ts)` for overlay panel

### `src/player.js`

**`updatePlayer(player, input, dt, cw, ch, wx)`** — add optional `wx` param:
```js
if (wx) {
  player.x += wx.forceX * dt;
  player.y += wx.forceY * dt;
  player.angle += wx.angleDrift;
}
```

Wrapping logic unchanged.

### `src/ui.js`

**`drawHUD(ctx, score, highScore, timeLeft, boostCooldown, integrity, day)`**

Integrity bar: below the timer, 120px wide centered, height 6px.
- Color: `hsl(lerp(0°, 120°, integrity/100), 80%, 55%)` — red at 0, green at 100
- Flashes when `integrity < 25` (alpha pulse)

Day counter: top-right corner, small monospace, replaces nothing (highScore moves slightly).

**`drawForecast(ctx, score, day, lostIntegrity, now)`** — new function (overlay only):
- Semi-transparent top panel: "DAY {day+1} INCOMING" or "INTEGRITY LOST → DAY {day+1}"
- Previous round score
- Blinking "PRESS ANY KEY TO FLY"
- Ghost path and zone drawing are done by the caller (`game.js _draw()`) before this call

---

## Integrity Bar Details

- 100 at round start, no regeneration
- Storm zones drain 30/s while player is inside
- At 0: `_endRound(true)` — game-over panel shows "INTEGRITY LOST" header in red instead of "DAY COMPLETE"
- Visual: thin 6px bar, smooth color transition, pulse animation below 25

---

## Path Analysis Constants

```js
const SEGMENT_COUNT       = 6;
const ANGULAR_THRESHOLD   = 4.5;   // radians total turning to qualify
const MIN_ZONE_RADIUS     = 60;
const MAX_ZONE_RADIUS     = 140;
const JETSTREAM_STRAIGHT  = 0.65;
const STORM_REVERSALS     = 3;
const TURB_REVERSALS      = 4;
const TURB_MAX_STRAIGHT   = 0.4;
```

---

## Out of Scope for Phase 2

- Weather zone collisions with orbs (orbs don't move or spawn inside storms)
- Zone decay / movement during a round (zones are static)
- Multiple thermals stacking multipliers
- Zone overlap resolution beyond first-match-wins
- Leaderboard or seeded weather
- Sound effects

---

## Definition of Done

1. Day 1 plays with no weather zones
2. After day 1 ends, `analyzePath` produces 0–6 zones based on the actual path
3. FORECAST screen shows sky map with zones + ghost path before day 2
4. In day 2+, entering a zone produces its effect (verified visually and via score/integrity)
5. Integrity bar visible, drains correctly in storms, triggers early end
6. Game over panel shows correct header ("DAY COMPLETE" vs "INTEGRITY LOST")
7. High score persists across rounds via localStorage
8. Zero console errors
9. Layered bloom visual style matches approved design
