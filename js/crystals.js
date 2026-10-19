// Chapter 1 — portfolio: each project runs on a 3D iPhone (Relay also on a laptop). The screens are
// live: a working demo of the project sits on each one, warped onto the 3D screen's corners, so
// visitors can try it right there. Callouts name it; clicking the device opens the project's pop-up.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng } from './noise.js';
import { PROJECTS, slugOf } from './projects.js';
import { t, dateLabel, agoLabel } from './i18n.js';
import { activityOf } from './activity.js';

const BG = 0xb6b9bf;
const SPACING = 15;
// iPhone 16 Pro: a 393 × 852 point screen with 55 point corners, inside a 427 × 886 body
const IOS = { w: 393, h: 852, r: 55, bodyW: 427, bodyH: 886 };
const LAPTOP_PX = { w: 1280, h: 832 }; // a MacBook's 1.54 : 1 display

const ITEMS = PROJECTS.map((p, i) => ({ ...p, code: `PROJECT_${String(i + 1).padStart(2, '0')}`, side: i % 2 ? 1 : -1 })); // device sits on this side, the overview card on the other

// shared device parts
const aluminium = new THREE.MeshStandardMaterial({ color: 0xc4c8ce, metalness: 0.9, roughness: 0.3, envMapIntensity: 1.2 });
const titanium = new THREE.MeshStandardMaterial({ color: 0x8a8d91, metalness: 0.95, roughness: 0.34, envMapIntensity: 1.3 });
const glassBlack = new THREE.MeshStandardMaterial({ color: 0x050607, metalness: 0.3, roughness: 0.1 });
const keysMat = new THREE.MeshStandardMaterial({ color: 0x1b1d22, metalness: 0.2, roughness: 0.7 });
const padMat = new THREE.MeshStandardMaterial({ color: 0xb4b8be, metalness: 0.85, roughness: 0.42 });

function roundedShape(w, h, r, rb = r) {
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
function roundedRect(w, h, r, rb = r) {
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

// what each project runs on: an iPhone, or (Relay) a laptop with the phone beside it
function device(item, load) {
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
  if (lap) {
    add(laptop(load(lap.poster)), lap, -0.55, 0, 0, 0, 1.05);
    add(phone(load(ph.poster)), ph, 1.6, -0.4, 1.1, -0.25, 1);
  } else add(phone(load(ph.poster)), ph, 0, 0, 0, 0, 2.3);
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

// time spent so far as hh:mm:ss, e.g. "432:15:07"
const startOf = (it) => new Date(`${it.started}T00:00:00`).getTime();
const elapsed = (ms) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}`;
};
// "STARTED / 13 OCT 2026", plus the latest commit when the project's repo activity is known
function startedText(it) {
  let s = `${t('started')}\n${dateLabel(it.started).toUpperCase()}`;
  const a = activityOf(slugOf(it));
  if (a) s += `\n${t('lastCommit')}\n${agoLabel(Date.now() - a.last)}\n${a.commits30} ${t('commits30')}`;
  return s;
}

export function createCrystals(env) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 10, 34);
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x6d727b, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(5, 8, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xcfe0ff, 2);
  rim.position.set(-6, -3, -5);
  scene.add(rim);

  const rand = rng(11);
  const loader = new THREE.TextureLoader();
  const pictures = []; // resolve once each screen picture has loaded
  const maps = [];
  const load = (src) => {
    let loaded;
    pictures.push(new Promise((res) => { loaded = res; }));
    const map = loader.load(src, loaded, undefined, loaded);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    maps.push(map);
    return map;
  };
  const crystals = ITEMS.map((item, i) => {
    const { group, screens, size, proxy } = device(item, load);
    group.position.set(0, -i * SPACING, 0);
    scene.add(group);
    return { item, group, screens, size, proxy, h: 0, hv: 0, near: 0 };
  });

  // live demos on the screens: an iframe per screen, warped so its four corners land exactly on the
  // 3D screen's corners (a projective CSS matrix3d). Each loads the first time its project comes
  // into view, and is hidden (and paused) when it leaves.
  // The pointer over a live screen is inside the demo's own page, so the scene can't see it move. The
  // screen says when it is entered; only a move over the site itself (outside every screen) counts as
  // leaving, since boundary events also fire while a screen slides or grows under a resting pointer.
  let overScreen = null;
  addEventListener('pointermove', (e) => { if (!e.target.closest?.('.live-screen')) overScreen = null; }, true);
  const layer = document.createElement('div');
  layer.className = 'live-screens';
  for (const c of crystals) for (const sc of c.screens) {
    const el = document.createElement('div');
    el.className = 'live-screen';
    el.style.cssText = `width:${sc.px.w}px;height:${sc.px.h}px;border-radius:${sc.radius};visibility:hidden`;
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-label', `${c.item.name}: try the app`); // a label, not a title: no tooltip over the app
    frame.allow = 'camera';
    frame.addEventListener('load', () => el.classList.toggle('loaded', frame.src !== ''));
    el.append(frame);
    el.addEventListener('pointerenter', () => { overScreen = c; });
    if (sc.notch) el.append(Object.assign(document.createElement('div'), { className: 'notch' }));
    layer.append(el);
    const w = sc.width / 2, h = sc.height / 2;
    // top-left, top-right, bottom-right, bottom-left of the screen, in the screen mesh's own space
    Object.assign(sc, { el, frame, shown: false, corners: [[-w, h], [w, h], [w, -h], [-w, -h]].map(([x, y]) => new THREE.Vector3(x, y, 0.0005)) });
  }
  const pt = new THREE.Vector3(), toEye = new THREE.Vector3(), normal = new THREE.Vector3();
  // the CSS matrix that maps a w × h element onto four points on screen (top-left, top-right, bottom-right, bottom-left)
  function warp([[x0, y0], [x1, y1], [x2, y2], [x3, y3]], w, h) {
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1;
    const g = (dx3 * dy2 - dx2 * dy3) / den, k = (dx1 * dy3 - dx3 * dy1) / den;
    const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
    return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${k / h},0,0,1,0,${x0},${y0},0,1)`;
  }
  // `on`: the projects chapter is on screen by itself (not mid-transition) on a device that can afford it
  function renderLive(on) {
    layer.style.display = on ? '' : 'none';
    const W = innerWidth, H = innerHeight;
    for (const c of crystals) for (const sc of c.screens) {
      let show = on && c.near > 0;
      let quad;
      if (show) {
        sc.mesh.updateWorldMatrix(true, false);
        // only while the screen faces the viewer and sits fully in front of the camera
        normal.set(0, 0, 1).transformDirection(sc.mesh.matrixWorld);
        toEye.copy(camera.position).sub(pt.setFromMatrixPosition(sc.mesh.matrixWorld));
        quad = sc.corners.map((p) => {
          pt.copy(p).applyMatrix4(sc.mesh.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
          if (pt.z > -camera.near) show = false;
          pt.applyMatrix4(camera.projectionMatrix);
          return [(pt.x * 0.5 + 0.5) * W, (0.5 - pt.y * 0.5) * H];
        });
        if (normal.dot(toEye) <= 0) show = false;
      }
      if (show && !sc.frame.getAttribute('src')) sc.frame.src = sc.demo;
      if (show !== sc.shown) {
        sc.shown = show;
        sc.el.style.visibility = show ? 'visible' : 'hidden';
        if (!show) sc.frame.contentWindow?.postMessage('vcd:pause', location.origin);
      }
      if (show) {
        sc.el.style.opacity = String(c.near);
        sc.el.style.transform = warp(quad, sc.px.w, sc.px.h);
      }
    }
  }

  // drifting ice dust along the whole column
  const DN = 900;
  const dust = new Float32Array(DN * 3);
  for (let i = 0; i < DN; i++) {
    dust[i * 3] = (rand() - 0.5) * 24;
    dust[i * 3 + 1] = 8 - rand() * (SPACING * ITEMS.length + 10);
    dust[i * 3 + 2] = (rand() - 0.5) * 14;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  const dustPts = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.045, transparent: true, opacity: 0.7, depthWrite: false }));
  scene.add(dustPts);

  // soft out-of-focus orbs of light between the camera and the blocks, in the current project's glow
  // colour: they slide past faster than the blocks, which gives the column depth
  const ON = 70;
  const orbPos = new Float32Array(ON * 3), orbSize = new Float32Array(ON), orbSeed = new Float32Array(ON);
  for (let i = 0; i < ON; i++) {
    orbPos.set([(rand() - 0.5) * 16, 6 - rand() * (SPACING * ITEMS.length + 8), 3 + rand() * 4.5], i * 3);
    orbSize[i] = 0.4 + rand() * 1.1;
    orbSeed[i] = rand() * 100;
  }
  const orbGeo = new THREE.BufferGeometry();
  orbGeo.setAttribute('position', new THREE.BufferAttribute(orbPos, 3));
  orbGeo.setAttribute('aSize', new THREE.BufferAttribute(orbSize, 1));
  orbGeo.setAttribute('aSeed', new THREE.BufferAttribute(orbSeed, 1));
  const orbMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color() }, uTime: { value: 0 }, uPix: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aSize, aSeed; uniform float uTime, uPix; varying float vA;
      void main(){
        vec3 p = position + vec3(sin(uTime * 0.2 + aSeed) * 0.4, cos(uTime * 0.17 + aSeed) * 0.3, 0.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aSize * uPix * 260.0 / -mv.z;
        vA = 0.5 + 0.5 * sin(uTime * 0.6 + aSeed * 3.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform vec3 uColor; varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float a = exp(-d * d * 3.5) * (0.06 + 0.08 * vA);
        float ring = smoothstep(0.75, 0.9, d) * (1.0 - smoothstep(0.9, 1.0, d)) * 0.05; // bokeh rim
        gl_FragColor = vec4(uColor * 1.4, a + ring);
      }`,
  });
  const orbs = new THREE.Points(orbGeo, orbMat);
  orbs.frustumCulled = false;
  scene.add(orbs);

  // full-screen backdrop in each project's own colours: slowly flowing, domain-warped "silk" with a glow
  // behind the block. Moving to the next project, its colours bloom out from that block with a soft,
  // noisy edge. It is opaque, so the ice refracts it too.
  const palettes = ITEMS.map((it) => it.colors.map((c) => new THREE.Color(c)));
  const pal = () => [new THREE.Color(), new THREE.Color(), new THREE.Color()];
  const bgMat = new THREE.ShaderMaterial({
    uniforms: {
      uA: { value: pal() }, uB: { value: pal() }, // [top, bottom, glow] of the project being left / arrived at
      uMix: { value: 0 }, uTime: { value: 0 }, uAspect: { value: 1 },
      uFocusA: { value: new THREE.Vector2(0.5, 0.5) }, uFocusB: { value: new THREE.Vector2(0.5, 0.5) },
    },
    depthTest: false,
    depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform vec3 uA[3], uB[3];
      uniform float uMix, uTime, uAspect;
      uniform vec2 uFocusA, uFocusB;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float s = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
        return s;
      }
      // silk: two rounds of domain warping give long, folding ribbons of light
      vec3 silk(vec3 top, vec3 bot, vec3 glow, vec2 focus) {
        vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0) * 1.7;
        float t = uTime * 0.05;
        vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
        vec2 r = vec2(fbm(p + 3.2 * q + vec2(1.7, 9.2) + t * 1.4), fbm(p + 3.2 * q + vec2(8.3, 2.8) - t * 1.2));
        float f = fbm(p + 2.6 * r);
        vec3 col = mix(bot, top, smoothstep(0.05, 0.95, vUv.y * 0.75 + f * 0.55));
        col = mix(col, glow, smoothstep(0.58, 0.92, f) * 0.42 * (0.6 + 0.4 * r.x)); // the ribbons catch the light
        float d = length((vUv - focus) * vec2(uAspect, 1.0));
        col += glow * exp(-d * d * 5.0) * 0.32; // light from behind the block
        return col;
      }
      void main() {
        vec3 col = silk(uA[0], uA[1], uA[2], uFocusA);
        if (uMix > 0.001) {
          // the next project's colours bloom outward from its block, with an inky, noisy edge
          vec3 next = silk(uB[0], uB[1], uB[2], uFocusB);
          float d = length((vUv - uFocusB) * vec2(uAspect, 1.0));
          float edge = (fbm(vUv * 4.0 + uTime * 0.08) - 0.5) * 0.35;
          float radius = uMix * (1.4 + uAspect * 0.6);
          col = mix(col, next, 1.0 - smoothstep(radius - 0.22, radius + 0.04, d + edge));
        }
        vec2 v = vUv - 0.5;
        col *= 1.0 - dot(v, v) * 0.5; // soft vignette
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  bg.frustumCulled = false;
  bg.renderOrder = -1000;
  scene.add(bg);
  const fogCol = new THREE.Color(), fogTop = new THREE.Color(), fogBot = new THREE.Color();
  const toScreen = (v) => new THREE.Vector2(v.x * 0.5 + 0.5, v.y * 0.5 + 0.5);
  const blockAt = new THREE.Vector3();
  function blendBackground(camY, offset, time) {
    const f = THREE.MathUtils.clamp((SPACING * 0.5 - camY) / SPACING - 0.5, 0, ITEMS.length - 1);
    const i0 = Math.floor(f), i1 = Math.min(i0 + 1, ITEMS.length - 1);
    const t = THREE.MathUtils.smoothstep(f - i0, 0.15, 0.85);
    const u = bgMat.uniforms;
    for (let k = 0; k < 3; k++) {
      u.uA.value[k].copy(palettes[i0][k]);
      u.uB.value[k].copy(palettes[i1][k]);
    }
    u.uMix.value = i1 === i0 ? 0 : t;
    u.uTime.value = time;
    u.uAspect.value = camera.aspect;
    u.uFocusA.value.copy(toScreen(blockAt.set(ITEMS[i0].side * offset, -i0 * SPACING, 0).project(camera)));
    u.uFocusB.value.copy(toScreen(blockAt.set(ITEMS[i1].side * offset, -i1 * SPACING, 0).project(camera)));
    // fog fades distant blocks into the same colours instead of grey
    fogTop.lerpColors(palettes[i0][0], palettes[i1][0], t);
    fogBot.lerpColors(palettes[i0][1], palettes[i1][1], t);
    fogCol.lerpColors(fogTop, fogBot, 0.55);
    scene.fog.color.copy(fogCol);
    scene.background.copy(fogCol);
    orbMat.uniforms.uColor.value.lerpColors(palettes[i0][2], palettes[i1][2], t);
  }

  // three callouts per device; anchors are local points around it
  const callouts = [];
  crystals.forEach((c, i) => {
    c.callouts = [
      { text: `${c.item.code}\n${c.item.name}`, local: new THREE.Vector3(-0.6, c.size.y * 0.5, 0.3), offset: [-90, -70] },
      { text: '', live: true, started: c.item, local: new THREE.Vector3(c.size.x * 0.5, -c.size.y * 0.5, 0.3), offset: [70, 30] },
      // live timer under the device: time spent on the project so far
      // (above it on narrow screens, where the project card covers the bottom)
      { text: '', cls: 'timer', center: true, live: true, since: startOf(c.item), local: new THREE.Vector3(0, -c.size.y * 0.5 - 0.45, 0), above: c.size.y * 0.5 + 0.35, offset: [0, 0] },
    ].map((o) => ({ ...o, anchor: new THREE.Vector3(), visible: false }));
    callouts.push(...c.callouts);
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const state = { active: -1 };
  const focus = { c: null, last: null, hover: null, on: 0, off: 0, k: 0, held: false };
  state.focused = -1;
  const look = new THREE.Vector3(), toFocus = new THREE.Vector3();

  function update(local, ctx) {
    const { time, mouse } = ctx;
    // crystal i sits centred in the frame at local = (i + 0.5) / ITEMS.length
    const camY = SPACING * 0.5 - local * SPACING * ITEMS.length;
    orbMat.uniforms.uPix.value = ctx.pixelRatio * (ctx.height / 900);
    orbMat.uniforms.uTime.value = time;
    // camera path: between blocks it swings round in an arc (alternating sides) and pulls back; as a
    // block reaches the centre it settles in front of it and pushes in a little
    const s = local * ITEMS.length - 0.5; // block index under the camera, fractional
    const near = Math.round(THREE.MathUtils.clamp(s, 0, ITEMS.length - 1));
    const phase = THREE.MathUtils.clamp(s - near, -0.5, 0.5); // 0 = centred on a block
    const calm = ctx.reduced ? 0.3 : 1;
    const swing = Math.sin(phase * Math.PI) * 0.42 * (near % 2 ? -1 : 1) * calm;
    const dist = 10.5 + Math.pow(Math.abs(phase) * 2, 2) * 1.6 * calm - 0.6;
    camera.position.set(Math.sin(swing) * dist + mouse.x * 0.8, camY + mouse.y * 0.5, Math.cos(swing) * dist);
    // on wide screens the crystal moves aside to make room for the overview card
    const offset = camera.aspect > 1.1 ? 2.3 : 0;
    look.set(Math.sin(swing) * dist * 0.25, camY, 0);
    // focus: the camera comes right up to a device the visitor is using, so its app fills the screen
    const f = THREE.MathUtils.smootherstep(focus.k, 0, 1);
    if (focus.last && f > 0) {
      const c = focus.last, tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const d = Math.max((c.size.y * 1.08) / 0.9 / (2 * tanH), (c.size.x * 1.08) / 0.94 / (2 * tanH * camera.aspect)) + c.size.z * 0.6;
      camera.position.lerp(toFocus.set(c.group.position.x, c.group.position.y, d), f);
      look.lerp(c.group.position, f);
    }
    camera.lookAt(look);

    camera.updateMatrixWorld();
    blendBackground(camY, offset, time);

    // pointer: hovering a device lights it up, clicking opens the project's pop-up
    // a pointer on a live screen is inside the app's own page, so the screen reports it itself
    let hovered = overScreen;
    if (!hovered && ctx.pointer.inside) {
      raycaster.setFromCamera(ndc.set(ctx.pointer.x, ctx.pointer.y), camera);
      const hit = raycaster.intersectObjects(crystals.map((c) => c.proxy), false)[0];
      hovered = hit && crystals.find((c) => c.proxy === hit.object);
      if (hovered && Math.abs(hovered.group.position.y - camY) > 4.2) hovered = null;
    }
    if (hovered) {
      ctx.cursor = true;
      if (ctx.click) ctx.openProject(crystals.indexOf(hovered));
    }
    // resting on a device for a moment focuses it; moving off it (or scrolling on) lets go
    const usable = ctx.live && hovered && Math.abs(hovered.group.position.y - camY) < 1.2 ? hovered : null;
    focus.on = usable && usable === focus.hover ? focus.on + ctx.dt : 0;
    focus.off = usable ? 0 : focus.off + ctx.dt;
    focus.hover = usable;
    if (focus.on > 0.3) focus.c = focus.last = usable;
    // a running tour keeps its device focused until the visitor scrolls on
    const drifted = focus.c && Math.abs(focus.c.group.position.y - camY) > 1.2;
    if (drifted) focus.held = false;
    if ((focus.off > 0.35 && !focus.held) || drifted) focus.c = null;
    state.focused = focus.c && focus.k > 0.6 ? crystals.indexOf(focus.c) : -1;
    focus.k += ((focus.c ? 1 : 0) - focus.k) * (1 - Math.exp(-ctx.dt * (ctx.reduced ? 12 : 4.5)));

    state.active = -1;
    crystals.forEach((c, i) => {
      // devices well out of frame skip rendering entirely
      c.group.visible = Math.abs(c.group.position.y - camY) < SPACING * 0.85;
      c.group.position.x = c.item.side * offset;
      // hover springs in: the device turns to face the viewer, grows a little and its screen lights up
      c.hv += ((hovered === c ? 1 : 0) - c.h) * 90 * ctx.dt - c.hv * 10 * ctx.dt;
      c.h += c.hv * ctx.dt;
      const h = THREE.MathUtils.clamp(c.h, 0, 1.2);
      const loose = (ctx.reduced ? 0 : 1) * (1 - Math.min(1, h)); // reduced motion: devices hold still; hovered ones too, so they can be used
      const pass = THREE.MathUtils.clamp((c.group.position.y - camY) / SPACING, -1, 1); // -1 above … 1 below
      c.group.rotation.y = (Math.sin(time * 0.2 + i * 2) * 0.22 + mouse.x * 0.25 + pass * 0.7) * loose; // turns as it passes
      c.group.rotation.x = (Math.sin(time * 0.3 + i) * 0.06 + mouse.y * 0.1) * loose;
      c.group.rotation.z = Math.sin(time * 0.25 + i * 2) * 0.03 * loose;
      c.group.position.y = -i * SPACING + Math.sin(time * 0.5 + i) * 0.08 * loose; // floats gently
      c.group.scale.setScalar(1 + h * 0.08);
      for (const sc of c.screens) sc.material.color.setScalar(0.85 + Math.min(1, h) * 0.15);

      // the live demo fades in as the device settles in front of the camera
      c.near = THREE.MathUtils.clamp((2.6 - Math.abs(c.group.position.y - camY)) / 1, 0, 1);

      const active = Math.abs(c.group.position.y - camY) < 4.2;
      if (Math.abs(c.group.position.y - camY) < SPACING * 0.3 && focus.k < 0.3) state.active = i; // the card steps aside while focused
      for (const o of c.callouts) {
        // anchors follow the crystal's position, not its spin, so labels stay readable
        o.anchor.copy(o.local).add(c.group.position);
        if (o.above && camera.aspect < 0.8) o.anchor.y = c.group.position.y + o.above;
        if (o.since) o.text = `${t('timeInvested')}\n${elapsed(Date.now() - o.since)}`;
        if (o.started) o.text = startedText(o.started);
        o.visible = active && focus.k < 0.3;
      }
    });
  }

  // `pictures`: loaded textures, so they can be uploaded to the GPU before the first scroll reaches them
  const ready = Promise.all(pictures).then(() => maps);
  return { scene, camera, update, callouts, state, ready, live: {
    el: layer,
    render: renderLive,
    // play the focused device's guided tour on its phone screen, and keep it focused meanwhile
    tour() {
      const c = focus.c;
      const sc = c && (c.screens.find((s) => s.px.w === IOS.w) || c.screens[0]);
      if (!sc?.frame.contentWindow) return false;
      focus.held = true;
      sc.frame.contentWindow.postMessage('vcd:tour', location.origin);
      return true;
    },
    hold() { if (focus.c) focus.held = true; },
    release() { focus.held = false; },
  } };
}
