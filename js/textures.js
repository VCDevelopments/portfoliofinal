// Procedural, tileable textures (no image assets): noise height fields -> normal / roughness / alpha maps,
// plus a branching crack sprite for ice inclusions.
import * as THREE from 'three';
import { rng } from './noise.js';

const fade = (t) => t * t * (3 - 2 * t);

// Tileable fBm value noise in [0, 1]; `period` is the cell count of the first octave.
export function tileNoise(size, period, octaves, seed) {
  const r = rng(seed);
  const out = new Float32Array(size * size);
  let amp = 1, total = 0;
  for (let o = 0; o < octaves; o++) {
    const p = period << o;
    const grid = Float32Array.from({ length: p * p }, r);
    for (let y = 0; y < size; y++) {
      const fy = (y / size) * p, iy = Math.floor(fy), ty = fade(fy - iy);
      const y0 = (iy % p) * p, y1 = ((iy + 1) % p) * p;
      for (let x = 0; x < size; x++) {
        const fx = (x / size) * p, ix = Math.floor(fx), tx = fade(fx - ix);
        const x0 = ix % p, x1 = (ix + 1) % p;
        const a = grid[y0 + x0] + (grid[y0 + x1] - grid[y0 + x0]) * tx;
        const b = grid[y1 + x0] + (grid[y1 + x1] - grid[y1 + x0]) * tx;
        out[y * size + x] += (a + (b - a) * ty) * amp;
      }
    }
    total += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

function dataTexture(data, size, repeat) {
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 4;
  t.repeat.set(repeat, repeat);
  t.needsUpdate = true;
  return t;
}

export function normalFromHeight(h, size, strength = 2, repeat = 1) {
  const d = new Uint8Array(size * size * 4);
  const at = (x, y) => h[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength * size * 0.05;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength * size * 0.05;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      d[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      d[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      d[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      d[i + 3] = 255;
    }
  }
  return dataTexture(d, size, repeat);
}

// Grey map (R=G=B) from a height field passed through `fn`.
export function grayFromHeight(h, size, fn = (v) => v, repeat = 1) {
  const d = new Uint8Array(size * size * 4);
  for (let i = 0; i < h.length; i++) {
    const v = Math.max(0, Math.min(1, fn(h[i]))) * 255;
    d.set([v, v, v, 255], i * 4);
  }
  return dataTexture(d, size, repeat);
}

// Branching white fractures on transparent background.
export function crackTexture(seed, size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const r = rng(seed);
  g.lineCap = 'round';
  const branch = (x, y, ang, len, w, depth) => {
    if (depth > 5 || len < 6) return;
    g.lineWidth = w;
    g.strokeStyle = `rgba(255,255,255,${0.25 + r() * 0.55})`;
    g.beginPath();
    g.moveTo(x, y);
    const steps = 6;
    for (let s = 0; s < steps; s++) {
      ang += (r() - 0.5) * 0.6;
      x += (Math.cos(ang) * len) / steps;
      y += (Math.sin(ang) * len) / steps;
      g.lineTo(x, y);
      if (r() < 0.22) branch(x, y, ang + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.8), len * 0.55, w * 0.65, depth + 1);
    }
    g.stroke();
  };
  for (let k = 0; k < 4; k++) branch(size / 2, size / 2, r() * Math.PI * 2, size * (0.25 + r() * 0.2), 2.4, 0);
  // fade toward the edges so the plane never shows a border
  const grad = g.createRadialGradient(size / 2, size / 2, size * 0.15, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalCompositeOperation = 'destination-in';
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Shared texture set, built once.
let cache;
export function getTextures() {
  if (cache) return cache;
  const S = 512;
  const grain = tileNoise(S, 8, 6, 3); // packed-snow grain
  const coarse = tileNoise(S, 3, 6, 9); // frost patches
  const iceH = coarse.map((v, i) => v * 0.75 + grain[i] * 0.25); // broad ripples with fine pitting
  cache = {
    snowNormal: normalFromHeight(grain, S, 2.2),
    snowRough: grayFromHeight(grain, S, (v) => 0.65 + v * 0.45),
    terrainNormal: normalFromHeight(grain, S, 1.5, 70),
    iceNormal: normalFromHeight(iceH, S, 1.6),
    // mostly clear ice with frosted (rough) patches
    iceRough: grayFromHeight(coarse, S, (v) => 0.12 + 0.88 * Math.min(1, Math.max(0, (v - 0.5) / 0.18))),
    frostAlpha: grayFromHeight(coarse, S, (v) => Math.min(1, Math.max(0, (v - 0.62) / 0.16)) * 0.85),
  };
  return cache;
}
