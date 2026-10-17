// Chapter 1 — portfolio: each project is an object frozen inside a drifting ice block.
// Callouts name it; clicking the block opens the project's pop-up.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { fbm3, rng } from './noise.js';
import { getTextures, crackTexture } from './textures.js';
import { PROJECTS } from './projects.js';

const BG = 0xb6b9bf;
const SPACING = 15;
const BLOCK_SCALE = 1;
// the project picture frozen in each block, and the clear ice around it on every side
const PIC_W = 1.56, PIC_H = 1.04, MARGIN = 0.34;

const ITEMS = PROJECTS.map((p, i) => ({ ...p, code: `PROJECT_${String(i + 1).padStart(2, '0')}`, side: i % 2 ? 1 : -1 })); // crystal sits on this side, the overview card on the other

// A chunk of clear ice around the project picture, a different shape for every project: an irregular
// 5–9 sided outline (like a broken-off piece) that always contains the picture with a margin, cut to
// a slab with bevelled edges, then given uneven, melting surfaces. `melt` (0..1, older projects more)
// rounds the corners and edges and slumps the top.
function iceOutline(r, melt) {
  const need = [];
  const mx = PIC_W / 2 + MARGIN * 0.55, my = PIC_H / 2 + MARGIN * 0.55;
  for (const sx of [-1, 0, 1]) for (const sy of [-1, 0, 1]) if (sx || sy) need.push(new THREE.Vector2(sx * mx, sy * my));
  const sides = 5 + Math.floor(r() * 5);
  const ax = (PIC_W / 2 + MARGIN) * (0.95 + r() * 0.3), ay = (PIC_H / 2 + MARGIN) * (0.95 + r() * 0.5);
  const spin = r() * Math.PI * 2;
  // irregular spacing and reach around an ellipse, so no two chunks share a silhouette
  const pts = Array.from({ length: sides }, (_, k) => {
    const a = spin + ((k + (r() - 0.5) * 0.7) / sides) * Math.PI * 2;
    const reach = 0.88 + r() * 0.32;
    return new THREE.Vector2(Math.cos(a) * ax * reach, Math.sin(a) * ay * reach);
  }).sort((p, q) => Math.atan2(p.y, p.x) - Math.atan2(q.y, q.x));
  // grow it until the picture (plus margin) fits inside
  const inside = (q) => {
    let hit = false;
    for (let k = 0, l = pts.length - 1; k < pts.length; l = k++) {
      const a = pts[k], b = pts[l];
      if (a.y > q.y !== b.y > q.y && q.x < ((b.x - a.x) * (q.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
    }
    return hit;
  };
  for (let tries = 0; tries < 40 && !need.every(inside); tries++) pts.forEach((p) => p.multiplyScalar(1.03));
  // soften each corner with a curve; more melted ice has rounder corners
  const t = 0.14 + melt * 0.16;
  const shape = new THREE.Shape();
  const corner = (k) => {
    const p = pts[k], prev = pts[(k + pts.length - 1) % pts.length], next = pts[(k + 1) % pts.length];
    return { a: p.clone().lerp(prev, t), p, b: p.clone().lerp(next, t) };
  };
  const first = corner(0);
  shape.moveTo(first.a.x, first.a.y);
  for (let k = 0; k < pts.length; k++) {
    const c = corner(k);
    if (k) shape.lineTo(c.a.x, c.a.y);
    shape.quadraticCurveTo(c.p.x, c.p.y, c.b.x, c.b.y);
  }
  shape.closePath();
  return shape;
}

function iceBlockGeometry(seed, melt) {
  const r = rng(seed * 97 + 5);
  const depth = 0.6 + r() * 0.35;
  const bevel = 0.1 + melt * 0.1;
  let g = new THREE.ExtrudeGeometry(iceOutline(r, melt), { depth, steps: 3, bevelEnabled: true, bevelThickness: bevel * 1.2, bevelSize: bevel, bevelSegments: 7, curveSegments: 14 });
  g.translate(0, 0, -depth / 2);
  g.computeBoundingBox();
  const box = g.boundingBox;
  const size = box.getSize(new THREE.Vector3());
  const half = size.clone().multiplyScalar(0.5);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    // uneven, melting surfaces: broad waviness plus fine ripples, pushed out from the slab's core
    const out = new THREE.Vector3(v.x, v.y, v.z * 2.5).normalize();
    const wobble = fbm3(v.x * 0.5 + seed, v.y * 0.5, v.z * 0.5 - seed, 3) * (0.05 + melt * 0.06);
    const ripple = fbm3(v.x * 1.8 - seed, v.y * 1.8, v.z * 1.8, 2) * 0.015;
    v.addScaledVector(out, wobble + ripple);
    if (v.y > 0) v.y -= melt * 0.22 * Math.pow(v.y / half.y, 2) * (0.7 + 0.3 * fbm3(v.x * 0.8, seed, v.z * 0.8, 2));
    const taper = 1 - (v.y / half.y) * (0.02 + melt * 0.03);
    v.x *= taper;
    v.z *= taper;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  // smooth normals across the cap/bevel/side seams: compute them on a welded copy, then copy back
  const welded = mergeVertices(new THREE.BufferGeometry().setAttribute('position', p.clone()), 1e-4);
  welded.computeVertexNormals();
  const key = (x, y, z) => `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`;
  const normalAt = new Map();
  const wp = welded.attributes.position, wn = welded.attributes.normal;
  for (let i = 0; i < wp.count; i++) normalAt.set(key(wp.getX(i), wp.getY(i), wp.getZ(i)), i);
  const nrm = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const k = normalAt.get(key(p.getX(i), p.getY(i), p.getZ(i)));
    nrm.setXYZ(i, wn.getX(k), wn.getY(k), wn.getZ(k));
  }
  // the extrusion's UVs are in world units; scale them down so the frost and ripple maps aren't tiny
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.35, uv.getY(i) * 0.35);
  g.computeBoundingBox();
  g.computeBoundingSphere();
  g.boundingBox.getSize(size);
  // surface lookups for the drips: the front surface's depth near a point, and the underside's height
  const frontZ = (x, y) => {
    let z = 0;
    for (let i = 0; i < p.count; i++) if ((p.getX(i) - x) ** 2 + (p.getY(i) - y) ** 2 < 0.01) z = Math.max(z, p.getZ(i));
    return z || depth / 2;
  };
  const bottomY = (x) => {
    let y = Infinity;
    for (let i = 0; i < p.count; i++) if (Math.abs(p.getX(i) - x) < 0.07 && Math.abs(p.getZ(i)) < depth * 0.4) y = Math.min(y, p.getY(i));
    return y === Infinity ? -size.y / 2 : y;
  };
  return { geo: g, size, frontZ, bottomY };
}

// The cloudy white core of block ice (air frozen out as the water froze from the outside in).
// Per-vertex density gives it feathery, uneven edges.
function coreMesh(seed, size) {
  const g = new THREE.IcosahedronGeometry(1, 24);
  const p = g.attributes.position;
  const dens = new Float32Array(p.count);
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const f = fbm3(v.x * 2.2 + seed, v.y * 2.2, v.z * 2.2, 4);
    v.multiplyScalar(1 + f * 0.35);
    p.setXYZ(i, v.x, v.y, v.z);
    dens[i] = THREE.MathUtils.clamp(0.55 + f * 1.6, 0, 1);
  }
  g.setAttribute('aDens', new THREE.BufferAttribute(dens, 1));
  g.computeVertexNormals();
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: `attribute float aDens; varying float vD; varying vec3 vN, vV;
      void main(){ vD = aDens; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vD; varying vec3 vN, vV;
      void main(){ float facing = abs(dot(normalize(vN), normalize(vV))); gl_FragColor = vec4(vec3(0.94, 0.96, 1.0), pow(facing, 1.6) * vD * 0.07); }`,
  });
  const m = new THREE.Mesh(g, mat);
  m.scale.set(PIC_W * 0.34, PIC_H * 0.42, size.z * 0.2); // tucked behind the picture, so only its fringe shows
  return m;
}

// Trapped air: vertical streams of tiny bubbles (as they form in freezing water) plus loose ones.
// Drawn as small refractive rings: a bright rim around a clear centre.
const bubbleMat = new THREE.ShaderMaterial({
  uniforms: { uPix: { value: 1 } },
  transparent: true,
  depthWrite: false,
  vertexShader: `attribute float aSize; uniform float uPix;
    void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uPix * 90.0 / -mv.z; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `void main(){
      vec2 q = gl_PointCoord - 0.5; float d = length(q) * 2.0;
      if (d > 1.0) discard;
      float rim = smoothstep(0.55, 0.9, d) * (1.0 - smoothstep(0.9, 1.0, d));
      float glint = smoothstep(0.25, 0.0, length(q - vec2(-0.16, -0.16)));
      gl_FragColor = vec4(vec3(1.0), rim * 0.75 + glint * 0.9);
    }`,
});
function bubbles(seed, size) {
  const r = rng(seed);
  const pos = [], sz = [];
  for (let s = 0; s < 34; s++) {
    const x = (r() - 0.5) * size.x * 0.7, z = (r() - 0.5) * size.z * 0.7;
    const y0 = (r() - 0.5) * size.y * 0.5, len = 0.15 + r() * 0.45, n = 6 + Math.floor(r() * 14);
    for (let k = 0; k < n; k++) {
      const t = k / n;
      pos.push(x + Math.sin(t * 6 + s) * 0.03, y0 + t * len, z + Math.cos(t * 5 + s) * 0.03);
      sz.push(0.012 + r() * 0.02 + t * 0.012);
    }
  }
  for (let k = 0; k < 260; k++) {
    pos.push((r() - 0.5) * size.x * 0.8, (r() - 0.5) * size.y * 0.8, (r() - 0.5) * size.z * 0.8);
    sz.push(0.008 + Math.pow(r(), 3) * 0.05);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aSize', new THREE.Float32BufferAttribute(sz, 1));
  const pts = new THREE.Points(g, bubbleMat);
  pts.renderOrder = 0.5;
  return pts;
}

// Frost settles on the base and along the edges; the flat faces stay clear.
function frostMaterial(tex) {
  const m = new THREE.MeshStandardMaterial({ color: 0xf6f9fc, roughness: 0.95, alphaMap: tex.frostAlpha, transparent: true, depthWrite: false });
  m.userData.uniforms = { uHalfY: { value: 1.6 }, uAmount: { value: 1 } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLP;\nvarying vec3 vLN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLP = position; vLN = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLP;\nvarying vec3 vLN;\nuniform float uHalfY, uAmount;')
      .replace(
        '#include <alphamap_fragment>',
        `#include <alphamap_fragment>
        vec3 an = abs(normalize(vLN));
        float edge = smoothstep(0.08, 0.3, 1.0 - max(an.x, max(an.y, an.z)));
        float base = smoothstep(0.2, -0.85, vLP.y / uHalfY);
        diffuseColor.a *= clamp(edge * 0.8 + base, 0.0, 1.0) * uAmount;`,
      );
  };
  return m;
}

// Melt water: drops run down the front face from just below the picture, gather on icicles hanging
// from the underside and fall off. Older projects (higher `melt`) get more, longer icicles and drip faster.
const dropGeo = new THREE.SphereGeometry(0.032, 16, 12);
function icicleGeometry(len, r0) {
  const pts = [];
  for (let k = 0; k <= 24; k++) {
    const t = k / 24;
    // a cone tapering to a point, with a small bead of water forming at the tip
    const bead = Math.sin(Math.PI * THREE.MathUtils.clamp((t - 0.82) / 0.18, 0, 1)) * r0 * 0.55;
    pts.push(new THREE.Vector2(Math.max(r0 * Math.pow(1 - t, 1.5), bead, 0.0005), -t * len));
  }
  return new THREE.LatheGeometry(pts, 20);
}
function meltDrips(block, melt, seed, iceMat) {
  const r = rng(seed * 31 + 7);
  const group = new THREE.Group();
  // irregularly spaced drip lines under the picture, at least a little apart
  const xs = [];
  for (let tries = 0; xs.length < 1 + Math.round(melt * 4) && tries < 60; tries++) {
    const x = (r() - 0.5) * PIC_W * 0.95;
    if (xs.every((o) => Math.abs(o - x) > 0.16)) xs.push(x);
  }
  const channels = xs.map((x) => {
    const base = block.bottomY(x);
    const len = (0.12 + melt * 0.55) * (0.3 + r() * 0.7);
    const icicle = new THREE.Mesh(icicleGeometry(len, (0.05 + melt * 0.04) * (0.7 + r() * 0.6)), iceMat);
    icicle.position.set(x, base + 0.05, 0);
    const dropMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, metalness: 0, clearcoat: 1, transparent: true, opacity: 0, envMapIntensity: 2.5 });
    const run = new THREE.Mesh(dropGeo, dropMat);
    run.scale.set(0.8, 1.5, 0.45);
    const fall = new THREE.Mesh(dropGeo, dropMat.clone());
    fall.scale.set(1, 1.25, 1);
    group.add(icicle, run, fall);
    // the running drop's path: from under the picture down the front face to the icicle
    const y0 = -PIC_H / 2 - 0.05, y1 = base + 0.1;
    const path = Array.from({ length: 12 }, (_, s) => {
      const y = y0 + ((y1 - y0) * s) / 11;
      return new THREE.Vector3(x, y, block.frontZ(x, y) + 0.012);
    });
    return { run, fall, path, tip: base + 0.05 - len, period: THREE.MathUtils.lerp(5, 1.8, melt) * (0.8 + r() * 0.4), offset: r() * 10 };
  });
  return {
    group,
    update(time) {
      for (const ch of channels) {
        const u = ((time + ch.offset) % ch.period) / ch.period;
        // 0..0.6 runs down the face, speeding up; 0.72..1 falls from the icicle and fades
        const run = u < 0.6 ? Math.pow(u / 0.6, 1.6) : -1;
        ch.run.visible = run >= 0;
        if (run >= 0) {
          const f = run * (ch.path.length - 1), k = Math.min(ch.path.length - 2, Math.floor(f));
          ch.run.position.lerpVectors(ch.path[k], ch.path[k + 1], f - k);
          ch.run.material.opacity = 0.75 * Math.min(1, run * 6);
        }
        const fall = u > 0.72 ? (u - 0.72) / 0.28 : -1;
        ch.fall.visible = fall >= 0;
        if (fall >= 0) {
          ch.fall.position.set(ch.path[0].x, ch.tip - 3 * fall * fall, 0);
          ch.fall.material.opacity = 0.8 * (1 - fall);
        }
      }
    },
  };
}

// melt amount per project: how long it has been worked on, relative to the oldest (every block drips a little)
const DAY = 86400000;
const daysIn = (it) => Math.max(1, Math.round((Date.now() - new Date(`${it.started}T00:00:00`).getTime()) / DAY));
const maxDays = Math.max(...ITEMS.map(daysIn));
const meltOf = (it) => 0.15 + 0.85 * (daysIn(it) / maxDays);
const startOf = (it) => new Date(`${it.started}T00:00:00`).getTime();
// time spent so far as "432h 15m 07s"
const elapsed = (ms) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  const pad = (n) => String(n).padStart(2, '0');
  return `${Math.floor(t / 3600)}h ${pad(Math.floor(t / 60) % 60)}m ${pad(t % 60)}s`;
};
const startedLabel = (it) => new Date(`${it.started}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();

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

  const tex = getTextures();
  const rand = rng(11);
  const loader = new THREE.TextureLoader();
  const picGeo = new THREE.PlaneGeometry(PIC_W, PIC_H);
  // clear, wet block ice: low roughness with a few duller patches, a glossy melt-water coat,
  // faint blue only through thick sections
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xf7fbff,
    roughness: 0.06,
    roughnessMap: tex.iceRough,
    normalMap: tex.iceNormal,
    normalScale: new THREE.Vector2(0.12, 0.12),
    transmission: 1,
    thickness: 2.2,
    ior: 1.31,
    dispersion: 0.25,
    attenuationColor: new THREE.Color(0xc8e4f7),
    attenuationDistance: 7,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    specularIntensity: 1,
    envMapIntensity: 1.35,
  });
  const crackGeo = new THREE.PlaneGeometry(1.1, 1.1);
  const crackMats = [3, 8, 21].map((seed) => new THREE.MeshBasicMaterial({ map: crackTexture(seed), transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  const pictures = []; // resolve once each project picture has loaded
  const crystals = ITEMS.map((item, i) => {
    const group = new THREE.Group();
    group.position.set(0, -i * SPACING, 0);
    const melt = meltOf(item);
    const block = iceBlockGeometry(i * 3.7 + 1, melt);
    const { geo, size } = block;
    const drips = meltDrips(block, melt, i, iceMat);
    const ice = new THREE.Mesh(geo, iceMat);
    // frost on the base and edges
    const frostMat = frostMaterial(tex);
    frostMat.userData.uniforms.uHalfY.value = size.y / 2;
    const frost = new THREE.Mesh(geo, frostMat);
    frost.scale.setScalar(1.004);
    frost.renderOrder = 2;
    // inside: cloudy core, a few fracture planes, trapped bubbles
    const core = coreMesh(i * 5 + 2, size);
    const cracks = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const c = new THREE.Mesh(crackGeo, crackMats[(i + k) % crackMats.length].clone());
      c.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
      c.position.set((rand() - 0.5) * 1.2, (rand() - 0.5) * 0.7, (rand() - 0.5) * 0.3);
      c.scale.setScalar(0.8 + rand() * 0.6);
      cracks.add(c);
    }
    // the project's picture frozen in the ice, always turned toward the viewer
    let loaded;
    pictures.push(new Promise((res) => { loaded = res; }));
    const map = loader.load(item.image, loaded, undefined, loaded);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    // drawn after the refraction pass so it stays sharp; the frost layer still renders over it
    const inner = new THREE.Group();
    const frame = new THREE.Mesh(picGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false }));
    frame.scale.set(1.035, 1.05, 1);
    frame.renderOrder = 1;
    const pic = new THREE.Mesh(picGeo, new THREE.MeshBasicMaterial({ map, toneMapped: false, side: THREE.DoubleSide, transparent: true, opacity: 0.94, depthTest: false }));
    pic.renderOrder = 1.1;
    inner.add(frame, pic);
    group.add(ice, core, inner, frost, cracks, bubbles(40 + i, size), drips.group);
    scene.add(group);
    return { item, group, ice, inner, frame, pic, frost, cracks, map, drips, size, h: 0, hv: 0 };
  });

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

  // full-screen gradient behind the blocks in each project's own colours, blending as you scroll;
  // it is opaque, so the ice refracts it too
  const palettes = ITEMS.map((it) => it.colors.map((c) => new THREE.Color(c)));
  const bgMat = new THREE.ShaderMaterial({
    uniforms: { uTop: { value: new THREE.Color() }, uBot: { value: new THREE.Color() }, uGlow: { value: new THREE.Color() } },
    depthTest: false,
    depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }',
    fragmentShader: `uniform vec3 uTop, uBot, uGlow; varying vec2 vUv;
      void main(){
        vec3 col = mix(uBot, uTop, smoothstep(0.0, 1.0, vUv.y));
        float glow = exp(-dot(vUv - vec2(0.5, 0.45), vUv - vec2(0.5, 0.45)) * 7.0);
        col = mix(col, uGlow, glow * 0.28);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  bg.frustumCulled = false;
  bg.renderOrder = -1000;
  scene.add(bg);
  const fogCol = new THREE.Color();
  function blendBackground(camY) {
    const f = THREE.MathUtils.clamp((SPACING * 0.5 - camY) / SPACING - 0.5, 0, ITEMS.length - 1);
    const i0 = Math.floor(f), i1 = Math.min(i0 + 1, ITEMS.length - 1);
    const t = THREE.MathUtils.smoothstep(f - i0, 0.25, 0.75);
    const [a, b] = [palettes[i0], palettes[i1]];
    bgMat.uniforms.uTop.value.lerpColors(a[0], b[0], t);
    bgMat.uniforms.uBot.value.lerpColors(a[1], b[1], t);
    bgMat.uniforms.uGlow.value.lerpColors(a[2], b[2], t);
    // fog fades distant blocks into the same colours instead of grey
    fogCol.lerpColors(bgMat.uniforms.uTop.value, bgMat.uniforms.uBot.value, 0.55);
    scene.fog.color.copy(fogCol);
    scene.background.copy(fogCol);
  }

  // three callouts per crystal; anchors are local points on the crystal
  const callouts = [];
  crystals.forEach((c, i) => {
    c.callouts = [
      { text: `${c.item.code}\n${c.item.name}`, local: new THREE.Vector3(-0.6, c.size.y * 0.5, 0.3), offset: [-90, -70] },
      { text: `STARTED\n${startedLabel(c.item)}`, local: new THREE.Vector3(c.size.x * 0.4, -c.size.y * 0.5, 0.3), offset: [70, 30] },
      // live timer under the block (below its icicles): time spent on the project so far
      // (above the block on narrow screens, where the project card covers the bottom)
      { text: '', cls: 'timer', center: true, live: true, since: startOf(c.item), local: new THREE.Vector3(0, -c.size.y * 0.5 * BLOCK_SCALE - 0.95, 0), above: c.size.y * 0.5 * BLOCK_SCALE + 0.35, offset: [0, 0] },
    ].map((o) => ({ ...o, anchor: new THREE.Vector3(), visible: false }));
    callouts.push(...c.callouts);
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const qFace = new THREE.Quaternion();
  const toCam = new THREE.Vector3();
  const state = { active: -1 };

  function update(local, ctx) {
    const { time, mouse } = ctx;
    // crystal i sits centred in the frame at local = (i + 0.5) / ITEMS.length
    const camY = SPACING * 0.5 - local * SPACING * ITEMS.length;
    blendBackground(camY);
    bubbleMat.uniforms.uPix.value = ctx.pixelRatio * (ctx.height / 900);
    const sway = Math.sin(local * Math.PI * ITEMS.length) * 0.7;
    camera.position.set(sway + mouse.x * 0.8, camY + mouse.y * 0.5, 10.5);
    // on wide screens the crystal moves aside to make room for the overview card
    const offset = camera.aspect > 1.1 ? 2.3 : 0;
    camera.lookAt(sway * 0.3, camY, 0);

    camera.updateMatrixWorld();

    // pointer: hovering a block brightens it, clicking opens the project's pop-up
    let hovered = null;
    if (ctx.pointer.inside) {
      raycaster.setFromCamera(ndc.set(ctx.pointer.x, ctx.pointer.y), camera);
      const hit = raycaster.intersectObjects(crystals.flatMap((c) => [c.ice, c.pic]), false)[0];
      hovered = hit && crystals.find((c) => c.ice === hit.object || c.pic === hit.object);
      if (hovered && Math.abs(hovered.group.position.y - camY) > 4.2) hovered = null;
    }
    if (hovered) {
      ctx.cursor = true;
      if (ctx.click) ctx.openProject(crystals.indexOf(hovered));
    }

    state.active = -1;
    crystals.forEach((c, i) => {
      // blocks well out of frame skip rendering entirely (their refraction pass is the costly part)
      c.group.visible = Math.abs(c.group.position.y - camY) < SPACING * 0.85;
      c.group.position.x = c.item.side * offset;
      // mostly facing the viewer, so the margin around the picture reads cleanly; a gentle sway
      const sway = ctx.reduced ? 0 : 1; // reduced motion: blocks hold still
      c.group.rotation.y = (Math.sin(time * 0.2 + i * 2) * 0.22 + mouse.x * 0.25) * sway;
      c.group.rotation.x = (Math.sin(time * 0.3 + i) * 0.06 + mouse.y * 0.1) * sway;
      c.group.rotation.z = Math.sin(time * 0.25 + i * 2) * 0.03 * sway;
      // the picture sits square inside the block, turning to face the viewer as it slides out on hover
      qFace.copy(c.group.quaternion).invert().multiply(camera.quaternion);
      c.inner.quaternion.identity().slerp(qFace, Math.min(1, Math.max(0, c.h)));
      // hover: the block swells slightly on a spring
      c.hv += ((hovered === c ? 1 : 0) - c.h) * 90 * ctx.dt - c.hv * 10 * ctx.dt;
      c.h += c.hv * ctx.dt;
      // hover: the block swells, frost and cracks clear, and the picture slides out toward the viewer
      const h = Math.max(0, c.h);
      c.group.scale.setScalar(BLOCK_SCALE * (1 + h * 0.16));
      if (c.group.visible) c.drips.update(time);
      c.group.updateMatrixWorld();
      c.frost.material.userData.uniforms.uAmount.value = 1 - Math.min(1, h);
      c.cracks.children.forEach((m) => { m.material.opacity = 0.32 * (1 - Math.min(1, h)); });
      toCam.copy(camera.position).sub(c.group.position).normalize().multiplyScalar(h * 2.4).add(c.group.position);
      c.inner.position.copy(c.group.worldToLocal(toCam));
      c.inner.scale.setScalar(1 + h * 0.55);
      c.pic.material.opacity = 0.94 + Math.min(1, h) * 0.06;
      c.frame.material.opacity = Math.min(1, h) * 0.9;

      const active = Math.abs(c.group.position.y - camY) < 4.2;
      if (Math.abs(c.group.position.y - camY) < SPACING * 0.3) state.active = i;
      for (const o of c.callouts) {
        // anchors follow the crystal's position, not its spin, so labels stay readable
        o.anchor.copy(o.local).add(c.group.position);
        if (o.above && camera.aspect < 0.8) o.anchor.y = c.group.position.y + o.above;
        if (o.since) o.text = `TIME INVESTED\n${elapsed(Date.now() - o.since)}`;
        o.visible = active;
      }
    });
  }

  // `pictures`: loaded textures, so they can be uploaded to the GPU before the first scroll reaches them
  const ready = Promise.all(pictures).then(() => crystals.map((c) => c.map));
  return { scene, camera, update, callouts, state, ready };
}
