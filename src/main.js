import { Game } from './game.js';
import { loadAssets } from './assets.js';
import { initInput, initTouchControls } from './input.js';

const LOGICAL_W = 480;
const LOGICAL_H = 780;

const canvas = document.getElementById('gameCanvas');
const wrap   = document.getElementById('canvasWrap');

function resize() {
  const scaleX = window.innerWidth  / LOGICAL_W;
  const scaleY = window.innerHeight / LOGICAL_H;
  const scale  = Math.min(scaleX, scaleY);

  // Keep canvas buffer at the logical resolution so all game coords are stable.
  // Use CSS dimensions to scale the display without altering canvas.width/height.
  canvas.width  = LOGICAL_W;
  canvas.height = LOGICAL_H;

  const displayW = Math.round(LOGICAL_W * scale);
  const displayH = Math.round(LOGICAL_H * scale);
  canvas.style.width  = displayW + 'px';
  canvas.style.height = displayH + 'px';
  wrap.style.width    = displayW + 'px';
  wrap.style.height   = displayH + 'px';
}

resize();
window.addEventListener('resize', resize);

initInput();
initTouchControls();

loadAssets().then(assets => {
  const game = new Game(canvas, assets);
  game.start();
});
