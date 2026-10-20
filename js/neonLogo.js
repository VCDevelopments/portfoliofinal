// The VCDevelopments logo (logo 28: a slanted V blade and an open C arc) as a neon sign, shared by the
// landing scene (with the wordmark, see loadFullLogo) and the finale. Geometry is in world units, centred on the logo's bounding box.
import * as THREE from 'three';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';

// Logo 28 in world units, standing on y = 0.
const LS = 24; // logo px per world unit
const LX = (px) => (px - 108) / LS, LY = (py) => (165 - py) / LS;
export const LOGO = {
  a: new THREE.Vector2(LX(36), LY(52)), b: new THREE.Vector2(LX(80), LY(150)), rb: 15 / LS,
  c: new THREE.Vector2(LX(130), LY(100)), ra: 40 / LS, rt: 13 / LS, a0: THREE.MathUtils.degToRad(35), sweep: THREE.MathUtils.degToRad(290),
};
const arcPoint = (t) => new THREE.Vector2(LOGO.c.x + Math.cos(LOGO.a0 + t * LOGO.sweep) * LOGO.ra, LOGO.c.y + Math.sin(LOGO.a0 + t * LOGO.sweep) * LOGO.ra);
export const BOUNDS = { minX: LX(36) - LOGO.rb, maxX: LOGO.c.x + LOGO.ra + LOGO.rt, H: LY(52) + LOGO.rb };
BOUNDS.W = BOUNDS.maxX - BOUNDS.minX;
BOUNDS.center = new THREE.Vector3((BOUNDS.minX + BOUNDS.maxX) / 2, BOUNDS.H / 2, 0);

// The logo as flat 2D outlines (a stadium for the V, a round-capped open ring for the C).
function logoShapes() {
  const ab = LOGO.b.clone().sub(LOGO.a), ang = Math.atan2(ab.y, ab.x);
  const blade = new THREE.Shape();
  blade.absarc(LOGO.a.x, LOGO.a.y, LOGO.rb, ang + Math.PI / 2, ang + Math.PI * 1.5, false);
  blade.absarc(LOGO.b.x, LOGO.b.y, LOGO.rb, ang - Math.PI / 2, ang + Math.PI / 2, false);
  blade.closePath(); // the second long side of the V
  const a0 = LOGO.a0, a1 = LOGO.a0 + LOGO.sweep, ro = LOGO.ra + LOGO.rt, ri = LOGO.ra - LOGO.rt;
  const e0 = arcPoint(0), e1 = arcPoint(1);
  const arc = new THREE.Shape();
  arc.absarc(LOGO.c.x, LOGO.c.y, ro, a0, a1, false);
  arc.absarc(e1.x, e1.y, LOGO.rt, a1, a1 + Math.PI, false);
  arc.absarc(LOGO.c.x, LOGO.c.y, ri, a1, a0, true);
  arc.absarc(e0.x, e0.y, LOGO.rt, a0 + Math.PI, a0 + Math.PI * 2, false);
  return [blade, arc];
}

const NEON_Z = 0.38, NEON_R = 0.05;

// Points evenly spaced along a closed outline, straight sides included, without repeating the first one.
function outlinePoints(shape, n) {
  const pts = shape.getSpacedPoints(n);
  if (pts.length > 1 && pts[0].distanceTo(pts[pts.length - 1]) < 1e-6) pts.pop();
  return pts;
}
const centred = (g) => g.translate(-BOUNDS.center.x, -BOUNDS.center.y, 0);

// Thin light tubes tracing each part's outline, on the logo's front and back faces.
export function neonGeometries() {
  return logoShapes().flatMap((shape) => {
    const pts = outlinePoints(shape, 240);
    return [-NEON_Z, NEON_Z].map((z) => centred(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p.x, p.y, z)), true), 600, NEON_R, 10, true)));
  });
}

// Wireframe of the neon logo: the front and back outlines joined by depth lines.
export function neonWireGeometry() {
  const pos = [];
  for (const shape of logoShapes()) {
    const pts = outlinePoints(shape, 96);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      for (const z of [-NEON_Z, NEON_Z]) pos.push(a.x, a.y, z, b.x, b.y, z);
      if (i % 3 === 0) pos.push(a.x, a.y, -NEON_Z, a.x, a.y, NEON_Z);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return centred(g);
}

// The tubes' glow: brighter than white, so it stays luminous through tone mapping and post.
export const neonMaterial = (o = {}) => new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 2.4, 4), toneMapped: false, ...o });

// ---- the full logo, for the landing scene on wide screens: the mark reads as the "vc", followed by
// "developments" in Outfit ExtraLight (the header's wordmark), every letter traced in neon like the mark.
// Built from the font file once it has loaded; portrait screens and the finale keep the mark alone.

const TEXT_Z = 0.16; // the letters are thinner signs than the mark
// the mark alone, in the same shape as FULL, for the scenes that show just the mark
export const MARK = { wide: false, bounds: BOUNDS, feet: [LOGO.b.x, LOGO.c.x], geometries: neonGeometries, wire: neonWireGeometry };
export let FULL = null;

export async function loadFullLogo(base = '') {
  const ttf = new TTFLoader();
  const light = new Font(await ttf.loadAsync(`${base}brand/fonts/Outfit-200.ttf`));
  // the header's proportions: the mark is 1.45 em tall and sits centred on the line
  const markH = BOUNDS.H, em = markH / 1.45;
  const baseline = markH / 2 - em * 0.36;
  const x = BOUNDS.maxX + em * 0.22;
  const textShapes = light.generateShapes('developments', em).map((shape) => ({ shape, dx: x }));
  // every outline as a closed loop of points: the mark's two parts, then each letter's outline and holes
  const loops = logoShapes().map((s) => ({ pts: outlinePoints(s, 240), z: NEON_Z }));
  for (const { shape, dx } of textShapes) {
    for (const path of [shape, ...shape.holes]) {
      const n = Math.max(24, Math.min(220, Math.round(path.getLength() * 26)));
      loops.push({ pts: outlinePoints(path, n).map((p) => new THREE.Vector2(p.x + dx, p.y + baseline)), z: TEXT_Z });
    }
  }
  let minX = Infinity, maxX = -Infinity, maxY = 0;
  for (const l of loops) for (const p of l.pts) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
  const bounds = { minX, maxX, W: maxX - minX, H: maxY, center: new THREE.Vector3((minX + maxX) / 2, maxY / 2, 0) };
  const shift = (g) => g.translate(-bounds.center.x, -bounds.center.y, 0);
  FULL = {
    wide: true,
    bounds,
    // where snow drifts against the sign: the feet of the V and the C
    feet: [LOGO.b.x, LOGO.c.x],
    geometries: () => loops.flatMap(({ pts, z }) => [-z, z].map((zz) => shift(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p.x, p.y, zz)), true), Math.max(60, pts.length * 2), NEON_R, 8, true)))),
    wire: () => {
      const pos = [];
      for (const { pts, z } of loops) {
        const step = Math.max(1, Math.round(pts.length / 60));
        for (let i = 0; i < pts.length; i += step) {
          const a = pts[i], b = pts[(i + step) % pts.length];
          for (const zz of [-z, z]) pos.push(a.x, a.y, zz, b.x, b.y, zz);
          if ((i / step) % 3 === 0) pos.push(a.x, a.y, -z, a.x, a.y, z);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      return shift(g);
    },
  };
  return FULL;
}
