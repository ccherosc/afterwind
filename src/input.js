const keys = {};

export function initInput() {
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    // Prevent spacebar scroll and arrow key scroll
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
  });
  // Clear keys when window loses focus
  window.addEventListener('blur', () => {
    for (const k in keys) keys[k] = false;
  });
}

export function initTouchControls() {
  const map = {
    btnLeft: 'ArrowLeft',
    btnRight: 'ArrowRight',
    btnThrottleUp: 'ArrowUp',
    btnThrottleDown: 'ArrowDown',
    btnBoost: 'Space'
  };

  for (const [id, code] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('touchstart', e => { e.preventDefault(); keys[code] = true; }, { passive: false });
    el.addEventListener('touchend',   e => { e.preventDefault(); keys[code] = false; }, { passive: false });
    el.addEventListener('touchcancel',e => { e.preventDefault(); keys[code] = false; }, { passive: false });
    el.addEventListener('mousedown', () => keys[code] = true);
    el.addEventListener('mouseup',   () => keys[code] = false);
  }
}

export const isLeft         = () => !!(keys['ArrowLeft']  || keys['KeyA']);
export const isRight        = () => !!(keys['ArrowRight'] || keys['KeyD']);
export const isThrottleUp   = () => !!(keys['ArrowUp']    || keys['KeyW']);
export const isThrottleDown = () => !!(keys['ArrowDown']  || keys['KeyS']);
export const isBoost        = () => !!keys['Space'];
export const isAnyKey       = () => Object.values(keys).some(Boolean);
