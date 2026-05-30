// ships.png: 131x197, 4 cols x 6 rows (verified by pixel scan)
// First aircraft: opaque content x=0..31, y=4..27 inside a 32x32 cell
// Using a 32x32 source crop so transparent padding is included (harmless)
export const SHIP_SPRITE = { x: 0, y: 0, w: 32, h: 32 };

export function loadAssets() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ ships: img });
    img.onerror = () => {
      console.warn('Could not load ships.png, will use fallback sprite');
      resolve({ ships: null });
    };
    img.src = 'Assets/Tilemap/ships.png';
  });
}
