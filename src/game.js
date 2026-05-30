import { createPlayer, updatePlayer, recordPath, drawPlayer, drawTrail } from './player.js';
import { createOrbSystem, spawnOrb, updateOrbs, collectOrbs, drawOrbs } from './orbs.js';
import { drawHUD, drawSplash, drawGameOver, drawForecast, drawGhostPath } from './ui.js';
import { createWeatherSystem, updateWeather, drawWeather } from './weather.js';
import { analyzePath } from './pathAnalyzer.js';
import * as Input from './input.js';

const STATE = {
  SPLASH:   'splash',
  PLAYING:  'playing',
  FORECAST: 'forecast',
  GAME_OVER: 'gameOver'
};

const DAY_SECONDS     = 60;
const ORB_SPAWN_SECS  = 3.5;
const INITIAL_ORBS    = 4;
const INPUT_LOCK_SECS    = 0.4;
const FORECAST_LOCK_SECS = 1.5;  // longer lock so held keys don't skip forecast
const LS_HIGH_SCORE   = 'afterwind_hs';

export class Game {
  constructor(canvas, assets) {
    this.canvas          = canvas;
    this.ctx             = canvas.getContext('2d');
    this.assets          = assets;
    this.state           = STATE.SPLASH;
    this.score           = 0;
    this.highScore       = parseInt(localStorage.getItem(LS_HIGH_SCORE) || '0', 10);
    this.isNewHigh       = false;
    this.lostIntegrity   = false;
    this.timeLeft        = DAY_SECONDS;
    this.orbTimer        = 0;
    this.inputLock       = INPUT_LOCK_SECS;
    this.forecastNeedsRelease = false; // wait for keys to be released before advancing
    this.day             = 1;
    this.integrity       = 100;
    this.weather         = null;   // active this round
    this.forecastWeather = null;   // shown on FORECAST screen, becomes active next round
    this.lastPath        = [];     // copy of path at round end for ghost drawing
    this.player          = null;
    this.orbs            = null;
    this.lastTs          = 0;
    this._skyGrad        = null;
  }

  start() {
    requestAnimationFrame(ts => this._loop(ts));
  }

  _loop(ts) {
    const dt = this.lastTs ? Math.min((ts - this.lastTs) / 1000, 0.05) : 0;
    this.lastTs = ts;
    this._update(dt, ts);
    this._draw(ts);
    requestAnimationFrame(ts2 => this._loop(ts2));
  }

  _startRound() {
    const { width: cw, height: ch } = this.canvas;
    this.score         = 0;
    this.timeLeft      = DAY_SECONDS;
    this.orbTimer      = 0;
    this.integrity     = 100;
    this.lostIntegrity = false;
    this.isNewHigh     = false;
    this.player        = createPlayer(cw, ch);
    this.orbs          = createOrbSystem();
    // Promote forecast weather to active; first round has no weather
    this.weather       = this.forecastWeather;
    this.forecastWeather = null;
    for (let i = 0; i < INITIAL_ORBS; i++) {
      spawnOrb(this.orbs, cw, ch, this.player.x, this.player.y);
    }
    this.inputLock = INPUT_LOCK_SECS;
  }

  _endRound(lostIntegrity = false) {
    const { width: cw, height: ch } = this.canvas;
    this.lostIntegrity = lostIntegrity;

    // Save high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.isNewHigh = true;
      try { localStorage.setItem(LS_HIGH_SCORE, this.highScore); } catch (_) {}
    }

    // Analyze path → generate next day's weather
    const zones = analyzePath(this.player.path, cw, ch);
    this.forecastWeather = createWeatherSystem(zones);

    // Save ghost path before player is recreated
    this.lastPath = this.player.path.slice();

    this.state                = STATE.FORECAST;
    this.inputLock            = FORECAST_LOCK_SECS;
    this.forecastNeedsRelease = Input.isAnyKey(); // require release if key held at round end
  }

  _update(dt, ts) {
    const { width: cw, height: ch } = this.canvas;
    if (this.inputLock > 0) this.inputLock -= dt;
    const locked = this.inputLock > 0;

    if (this.state === STATE.SPLASH) {
      if (!locked && Input.isAnyKey()) {
        this.state = STATE.PLAYING;
        this._startRound();
      }
      return;
    }

    if (this.state === STATE.FORECAST) {
      // If player was holding a key when the round ended, wait until they release first
      if (this.forecastNeedsRelease && !Input.isAnyKey()) {
        this.forecastNeedsRelease = false;
      }
      if (!locked && !this.forecastNeedsRelease && Input.isAnyKey()) {
        this.day++;
        this.state = STATE.PLAYING;
        this._startRound();
      }
      return;
    }

    if (this.state === STATE.PLAYING) {
      // Weather effects this frame
      const wx = updateWeather(this.weather, this.player, dt);

      const input = {
        isLeft:         Input.isLeft,
        isRight:        Input.isRight,
        isThrottleUp:   Input.isThrottleUp,
        isThrottleDown: Input.isThrottleDown,
        isBoost:        Input.isBoost
      };

      updatePlayer(this.player, input, dt, cw, ch, wx);
      recordPath(this.player, ts);
      updateOrbs(this.orbs, dt);

      // Score with thermal multiplier
      const earned = collectOrbs(this.orbs, this.player.x, this.player.y);
      this.score  += earned * wx.scoreMult;

      // Orb spawning
      this.orbTimer -= dt;
      if (this.orbTimer <= 0) {
        spawnOrb(this.orbs, cw, ch, this.player.x, this.player.y);
        this.orbTimer = ORB_SPAWN_SECS;
      }

      // Integrity drain from storms
      this.integrity -= wx.integrityDrain * dt;
      if (this.integrity <= 0) {
        this.integrity = 0;
        this._endRound(true);
        return;
      }

      // Timer
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this._endRound(false);
      }
    }
  }

  _draw(ts) {
    const ctx = this.ctx;
    const { width: w, height: h } = this.canvas;

    if (this.state === STATE.SPLASH) {
      drawSplash(ctx, ts);
      return;
    }

    // Sky background (cached gradient)
    if (!this._skyGrad) {
      this._skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      this._skyGrad.addColorStop(0, '#2e6ab8');
      this._skyGrad.addColorStop(1, '#5aa8ec');
    }
    ctx.fillStyle = this._skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, h * i / 6);
      ctx.lineTo(w, h * i / 6);
      ctx.stroke();
    }

    if (this.state === STATE.FORECAST) {
      // Draw ghost path + forecast weather zones, then overlay panel
      drawGhostPath(ctx, this.lastPath);
      drawWeather(ctx, this.forecastWeather, ts);
      drawForecast(ctx, this.score, this.day, this.lostIntegrity, ts);
      return;
    }

    if (this.state === STATE.PLAYING && this.player) {
      drawWeather(ctx, this.weather, ts);
      drawTrail(ctx, this.player);
      drawOrbs(ctx, this.orbs);
      drawPlayer(ctx, this.player, this.assets.ships);
      // Show integrity bar only from day 2 (day 1 has no weather)
      const showIntegrity = this.day > 1 ? this.integrity : null;
      drawHUD(ctx, this.score, this.highScore, this.timeLeft,
              this.player.boostCooldown, showIntegrity, this.day, ts);
    }
  }
}
