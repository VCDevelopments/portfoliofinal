// The four season versions of the site. Every chapter reads its look from here via setSeason(),
// so adding or tuning a season is a data change only.

export const SEASONS = {
  winter: {
    label: 'Winter',
    sky: 0x9a9ea6, // opening scene background + fog
    css: '#9a9ea6', // loader and page background
    ground: 0xaeb3ba,
    stone: 0xbfc5ce, // the logo sculpture's base colour
    cap: [0.94, 0.96, 1.0], // what settles on upward faces (snow)
    cover: 0, // how far the cap creeps down the sides (0 = tops only)
    glint: 1, // ice-crystal sparkle in the cap
    sun: 0xffffff,
    sunIntensity: 1.9,
    // falling particles: colours to pick from, sprite shape, size, fall speed (negative rises), sideways sway
    air: { colors: [[1, 1, 1]], shape: 'dot', size: 0.07, fall: 0.6, sway: 0.15 },
    rings: 0xb0b4bb,
    finale: 0x9ea3ab,
    floor: 0x9aa0a8,
    burst: [1.0, 1.0, 1.0], // colour of the particles before they form the logo
  },
  spring: {
    label: 'Spring',
    sky: 0x94c2ae,
    css: '#8fb8a5',
    ground: 0x7da466,
    stone: 0xc9c9b8,
    cap: [0.36, 0.6, 0.26], // fresh moss
    cover: 0.32,
    glint: 0,
    sun: 0xfff4e2,
    sunIntensity: 2.1,
    air: { colors: [[1, 0.78, 0.84], [1, 0.88, 0.92], [0.98, 0.7, 0.78]], shape: 'petal', size: 0.26, fall: 0.32, sway: 0.55 },
    rings: 0x9cc3b1,
    finale: 0x96bba8,
    floor: 0x86a891,
    burst: [1.0, 0.8, 0.86],
  },
  summer: {
    label: 'Summer',
    sky: 0xd9b26e,
    css: '#c9a467',
    ground: 0xd8b071,
    stone: 0xe0c69a,
    cap: [0.98, 0.86, 0.6], // sun-bleached sand
    cover: 0.2,
    glint: 0.5,
    sun: 0xffe0a8,
    sunIntensity: 2.5,
    air: { colors: [[1, 0.9, 0.55], [1, 0.82, 0.45], [1, 0.95, 0.75]], shape: 'glow', size: 0.2, fall: -0.18, sway: 0.35 },
    rings: 0xd6b274,
    finale: 0xcfa96c,
    floor: 0xbf9c66,
    burst: [1.0, 0.86, 0.52],
  },
  autumn: {
    label: 'Autumn',
    sky: 0xc08868,
    css: '#a97659',
    ground: 0x9c6a48,
    stone: 0xc2ad99,
    cap: [0.78, 0.36, 0.12], // fallen leaves
    cover: 0.38,
    glint: 0,
    sun: 0xffc896,
    sunIntensity: 2.2,
    air: { colors: [[0.86, 0.42, 0.14], [0.93, 0.62, 0.2], [0.7, 0.24, 0.12], [0.95, 0.75, 0.3]], shape: 'leaf', size: 0.32, fall: 0.8, sway: 0.9 },
    rings: 0xc08f72,
    finale: 0xb8866a,
    floor: 0xa3735a,
    burst: [1.0, 0.6, 0.28],
  },
};

export const SEASON_ORDER = ['winter', 'spring', 'summer', 'autumn'];

// ?season=… wins, then the visitor's last choice, then the season of today's date (northern hemisphere)
export function initialSeason() {
  const fromUrl = new URLSearchParams(location.search).get('season');
  if (fromUrl && SEASONS[fromUrl]) return fromUrl;
  try {
    const saved = localStorage.getItem('vcd-season');
    if (saved && SEASONS[saved]) return saved;
  } catch {}
  const m = new Date().getMonth();
  return m === 11 || m < 2 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn';
}

export function rememberSeason(name) {
  try { localStorage.setItem('vcd-season', name); } catch {}
}

// Small sprite for the airborne particles of each season.
const spriteCache = {};
export function particleSprite(shape, THREE) {
  if (spriteCache[shape]) return spriteCache[shape];
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.translate(32, 32);
  if (shape === 'petal') {
    g.rotate(0.6);
    g.fillStyle = '#fff';
    g.beginPath();
    g.ellipse(0, 0, 26, 14, 0, 0, Math.PI * 2);
    g.fill();
  } else if (shape === 'leaf') {
    g.rotate(-0.7);
    g.fillStyle = '#fff';
    g.beginPath();
    g.moveTo(-28, 0);
    g.quadraticCurveTo(0, -22, 28, 0);
    g.quadraticCurveTo(0, 22, -28, 0);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-24, 0);
    g.lineTo(26, 0);
    g.stroke();
  } else {
    const soft = shape === 'glow' ? 0 : 0.35;
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, 30);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(soft || 0.15, shape === 'glow' ? 'rgba(255,255,255,0.9)' : '#fff');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(-32, -32, 64, 64);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return (spriteCache[shape] = t);
}
