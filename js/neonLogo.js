// The VCDevelopments logo (logo 28: a slanted V blade and an open C arc) as a neon sign, shared by the
// landing scene and the finale. Geometry is in world units, centred on the logo's bounding box.
import * as THREE from 'three';

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
