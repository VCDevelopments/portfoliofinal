// The site's device models, built in code: an iPhone 16 Pro and a current 14" MacBook, to scale and
// without logos. Each returns its screens (mesh, size in world units and in pixels) so a live page or a
// picture can be laid exactly over them. Used by tools/reel.html for the case-study videos.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// iPhone 16 Pro: a 393 × 852 point screen with 55 point corners, inside a 427 × 886 body
export const IOS = { w: 393, h: 852, r: 55, bodyW: 427, bodyH: 886 };
const LAPTOP_PX = { w: 1280, h: 832 }; // a MacBook's 1.54 : 1 display

// shared device parts
const aluminium = new THREE.MeshStandardMaterial({ color: 0xc4c8ce, metalness: 0.9, roughness: 0.3, envMapIntensity: 1.2 });
const titanium = new THREE.MeshStandardMaterial({ color: 0x8a8d91, metalness: 0.95, roughness: 0.34, envMapIntensity: 1.3 });
const glassBlack = new THREE.MeshStandardMaterial({ color: 0x050607, metalness: 0.3, roughness: 0.1 });
const keysMat = new THREE.MeshStandardMaterial({ color: 0x1b1d22, metalness: 0.2, roughness: 0.7 });
const padMat = new THREE.MeshStandardMaterial({ color: 0xb4b8be, metalness: 0.85, roughness: 0.42 });

export function roundedShape(w, h, r, rb = r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + rb, y);
  s.lineTo(x + w - rb, y);
  if (rb) s.quadraticCurveTo(x + w, y, x + w, y + rb);
  s.lineTo(x + w, y + h - r);
  if (r) s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  if (r) s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + rb);
  if (rb) s.quadraticCurveTo(x, y, x + rb, y);
  return s;
}
// a rounded rectangle with 0..1 UVs, for screens and glass with round corners (`rb`: bottom corners)
export function roundedRect(w, h, r, rb = r) {
  const g = new THREE.ShapeGeometry(roundedShape(w, h, r, rb), 12);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
  return g;
}

// the screen itself: unlit, so the app shows in its true colours; brightens on hover
const screenMat = (map) => new THREE.MeshBasicMaterial({ map, toneMapped: false, color: 0xd9d9d9 });

// A current-generation 14" MacBook (no logo), to scale (1 unit = 10 cm): flat aluminium slab with
// rounded corners, black keys in a darker well, speaker grilles either side, a large trackpad, and a
// thin-bezel display with rounded top corners and a camera notch. Opened a little past upright and
// tipped toward the viewer so the keyboard shows.
const slab = (w, d, t, r, bevel) => {
  const geo = new THREE.ExtrudeGeometry(roundedShape(w - bevel * 2, d - bevel * 2, r - bevel), { depth: t - bevel * 2, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 16 });
  geo.translate(0, 0, -(t - bevel * 2) / 2);
  return geo;
};
const wellMat = new THREE.MeshStandardMaterial({ color: 0x8e9297, metalness: 0.85, roughness: 0.45, envMapIntensity: 1.1 });
const hingeMat = new THREE.MeshStandardMaterial({ color: 0x2a2c30, metalness: 0.7, roughness: 0.4 });
const notchMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
// speaker grille: rows of fine holes
let grilleMat;
function grille() {
  if (grilleMat) return grilleMat;
  const c = document.createElement('canvas');
  c.width = 64; c.height = 384;
  const g = c.getContext('2d');
  g.fillStyle = '#c4c8ce';
  g.fillRect(0, 0, 64, 384);
  g.fillStyle = '#2b2d31';
  for (let y = 4; y < 384; y += 7) for (let x = 4 + ((y / 7) % 2) * 3.5; x < 62; x += 7) { g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); }
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return (grilleMat = new THREE.MeshStandardMaterial({ map, metalness: 0.85, roughness: 0.4, envMapIntensity: 1.1 }));
}
// keyboard rows: [row height, key widths], in key units; every row is 14.5 keys wide
const KEY_ROWS = [
  [0.55, [1.5, ...Array(12).fill(1), 1]],
  [1, [...Array(13).fill(1), 1.5]],
  [1, [1.5, ...Array(13).fill(1)]],
  [1, [1.8, ...Array(11).fill(1), 1.7]],
  [1, [2.3, ...Array(10).fill(1), 2.2]],
  [1, [1, 1, 1, 1.25, 5, 1.25, 1, 'left', 'updown', 'right']],
];
function laptop(map) {
  const W = 3.126, D = 2.212, T = 0.1, LT = 0.05, R = 0.11;
  const g = new THREE.Group();
  const flat = (mesh, y, z) => { mesh.rotation.x = -Math.PI / 2; mesh.position.set(0, y, z); return mesh; };
  const top = T / 2;
  g.add(flat(new THREE.Mesh(slab(W, D, T, R, 0.02), aluminium), 0, 0));
  // keyboard
  const U = 0.18, GAP = 0.03, kbW = 14.5 * U, z0 = -D / 2 + 0.25;
  const kbD = KEY_ROWS.reduce((s, [h]) => s + h * U, 0);
  g.add(flat(new THREE.Mesh(roundedRect(kbW + 0.05, kbD + 0.05, 0.03), wellMat), top + 0.001, z0 + kbD / 2));
  const keys = [];
  let z = z0;
  for (const [rh, widths] of KEY_ROWS) {
    const d = rh * U;
    let x = -kbW / 2;
    for (const w of widths) {
      const kw = typeof w === 'number' ? w : 1;
      const cx = x + (kw * U) / 2;
      if (w === 'updown') keys.push([cx, z + d * 0.25, kw * U, d / 2], [cx, z + d * 0.75, kw * U, d / 2]);
      else if (w === 'left' || w === 'right') keys.push([cx, z + d * 0.75, kw * U, d / 2]);
      else keys.push([cx, z + d / 2, kw * U, d]);
      x += kw * U;
    }
    z += d;
  }
  const keyMesh = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 2, 0.2), keysMat, keys.length);
  const m = new THREE.Matrix4();
  keys.forEach(([x, kz, w, d], i) => keyMesh.setMatrixAt(i, m.makeScale(w - GAP, 0.014, d - GAP).setPosition(x, top + 0.006, kz)));
  g.add(keyMesh);
  // speakers either side of the keyboard, the trackpad below it, the hinge along the back
  for (const side of [-1, 1]) {
    const speaker = flat(new THREE.Mesh(new THREE.PlaneGeometry(0.15, kbD), grille()), top + 0.001, z0 + kbD / 2);
    speaker.position.x = side * (kbW / 2 + 0.17);
    g.add(speaker);
  }
  g.add(flat(new THREE.Mesh(roundedRect(1.62, 0.76, 0.05), padMat), top + 0.001, z0 + kbD + 0.12 + 0.38));
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, W * 0.8, 20), hingeMat);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, top, -D / 2 + 0.035);
  g.add(hinge);
  // the lid swings on the hinge
  const sw = 3.02, sh = (sw * LAPTOP_PX.h) / LAPTOP_PX.w, LH = 0.07 + sh + 0.12;
  const pivot = new THREE.Group();
  pivot.position.set(0, top, -D / 2 + 0.035);
  pivot.rotation.x = -0.3;
  const lid = new THREE.Mesh(slab(W, LH, LT, R, 0.012), aluminium);
  lid.position.set(0, LH / 2 + 0.02, 0);
  const glass = new THREE.Mesh(roundedRect(W - 0.03, LH - 0.03, R - 0.015), glassBlack);
  glass.position.z = LT / 2 + 0.001;
  const screen = new THREE.Mesh(roundedRect(sw, sh, 0.08, 0), screenMat(map));
  const sy = LH / 2 - 0.07 - sh / 2;
  screen.position.set(0, sy, LT / 2 + 0.002);
  const notch = new THREE.Mesh(roundedRect(0.42, 0.075, 0, 0.03), notchMat);
  notch.position.set(0, sy + sh / 2 - 0.0375, LT / 2 + 0.003);
  lid.add(glass, screen, notch);
  pivot.add(lid);
  g.add(pivot);
  g.rotation.x = 0.38; // tipped toward the viewer
  // the live screen: rounded top corners and the notch, in screen pixels (0.08 → 34 px, notch 178 × 32)
  return { group: g, screens: [{ mesh: screen, width: sw, height: sh, px: LAPTOP_PX, radius: '34px 34px 0 0', notch: true }] };
}

// An iPhone, 1:1 in proportion: titanium frame with rounded corners, black glass, the screen, and the
// buttons on its sides (action button and volume on the left, side button and camera control on the right)
function phone(map) {
  const W = 0.9, k = W / IOS.bodyW, H = IOS.bodyH * k, T = 0.075;
  const g = new THREE.Group();
  const bevel = 0.012;
  const bodyGeo = new THREE.ExtrudeGeometry(roundedShape(W - bevel * 2, H - bevel * 2, (IOS.r + 17) * k - bevel), { depth: T - bevel * 2, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 4, curveSegments: 20 });
  bodyGeo.translate(0, 0, -(T - bevel * 2) / 2);
  const body = new THREE.Mesh(bodyGeo, titanium);
  const glass = new THREE.Mesh(roundedRect(W - 0.012, H - 0.012, (IOS.r + 15) * k), glassBlack);
  glass.position.z = T / 2 + 0.001;
  const sw = IOS.w * k, sh = IOS.h * k;
  const screen = new THREE.Mesh(roundedRect(sw, sh, IOS.r * k), screenMat(map));
  screen.position.z = T / 2 + 0.002;
  body.add(glass, screen);
  const button = (side, y, len) => {
    const b = new THREE.Mesh(new RoundedBoxGeometry(0.012, len * k, T * 0.45, 2, 0.005), titanium);
    b.position.set(side * (W / 2 + 0.003), H / 2 - y * k - (len * k) / 2, 0);
    body.add(b);
  };
  button(-1, 150, 32); // action button
  button(-1, 205, 62); // volume up
  button(-1, 280, 62); // volume down
  button(1, 240, 100); // side button
  button(1, 520, 70); // camera control
  g.add(body);
  return { group: g, screens: [{ mesh: screen, width: sw, height: sh, px: { w: IOS.w, h: IOS.h }, radius: `${IOS.r}px` }] };
}

// what each project runs on: an iPhone, a MacBook, or both side by side
export function device(item, load) {
  const g = new THREE.Group();
  const screens = [];
  const add = ({ group, screens: s }, def, x, y, z, ry, scale = 1) => {
    group.position.set(x, y, z);
    group.rotation.y = ry;
    group.scale.multiplyScalar(scale);
    g.add(group);
    for (const sc of s) screens.push({ ...sc, demo: def.demo, material: sc.mesh.material });
  };
  const { laptop: lap, phone: ph } = item.device;
  if (lap && ph) {
    add(laptop(load(lap.poster)), lap, -0.55, 0, 0, 0, 1.05);
    add(phone(load(ph.poster)), ph, 1.6, -0.4, 1.1, -0.25, 1);
  } else if (lap) add(laptop(load(lap.poster)), lap, 0, 0, 0, 0, 1.2);
  else add(phone(load(ph.poster)), ph, 0, 0, 0, 0, 2.3);
  // centre the whole thing on the group's origin
  const box = new THREE.Box3().setFromObject(g);
  const centre = box.getCenter(new THREE.Vector3());
  g.children.forEach((c) => c.position.sub(centre));
  const size = box.getSize(new THREE.Vector3());
  // an invisible box over the device for pointer hits
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, Math.max(size.z, 0.6)), new THREE.MeshBasicMaterial({ visible: false }));
  g.add(proxy);
  return { group: g, screens, size, proxy };
}

