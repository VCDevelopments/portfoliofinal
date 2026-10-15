// Chapter 0 — snowy valley with a monument of the VCDevelopments logo, built from hand-cut snow
// bricks. Every few seconds a blueprint scan sweeps up it, briefly lighting its wireframe, grid and
// measurements.
// Hovering pushes nearby blocks outward on springs; clicking sends a ripple through the dome.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { fbm3, smoothstep, lerp, easeInOut, rng } from './noise.js';
import { getTextures } from './textures.js';

const BG = 0x9a9ea6;
const VARIANTS = 6;

function terrainHeight(x, z) {
  const d = Math.hypot(x, z);
  const back = 0.3 + 0.7 * smoothstep(-0.2, 0.7, -z / (d + 1e-3)); // mountains mostly behind the monument
  const m = fbm3(x * 0.016, 0, z * 0.016, 5) * 0.5 + 0.5;
  const ridge = 1 - Math.abs(fbm3(x * 0.03, 4.2, z * 0.03, 4));
  const mountains = (m * m * 55 + ridge * ridge * 18) * smoothstep(22, 95, d) * back;
  const rolling = fbm3(x * 0.07, 7.7, z * 0.07, 4) * 2.4 * smoothstep(5, 18, d);
  const mound = 1.2 * Math.exp(-(d * d) / 140);
  const detail = fbm3(x * 0.45, 1.3, z * 0.45, 3) * 0.22 * smoothstep(3.5, 7, d);
  return mountains + rolling + mound + detail;
}

const angDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

// Re-average normals of vertices that share a position, hiding the seams between box faces.
function smoothSeamNormals(g) {
  const p = g.attributes.position, n = g.attributes.normal;
  const acc = new Map();
  const key = (i) => `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`;
  for (let i = 0; i < p.count; i++) {
    const k = key(i);
    const a = acc.get(k) ?? acc.set(k, new THREE.Vector3()).get(k);
    a.x += n.getX(i); a.y += n.getY(i); a.z += n.getZ(i);
  }
  for (let i = 0; i < p.count; i++) {
    const a = acc.get(key(i)).clone().normalize();
    n.setXYZ(i, a.x, a.y, a.z);
  }
}

// A slightly irregular, chipped snow block (unit size; scaled per instance).
function blockGeometry(seed) {
  const g = new RoundedBoxGeometry(1, 1, 1, 8, 0.08);
  const p = g.attributes.position;
  const v = new THREE.Vector3(), dir = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    dir.copy(v).normalize();
    const lumps = fbm3(v.x * 2.6 + seed, v.y * 2.6, v.z * 2.6 - seed, 4) * 0.045;
    const chips = Math.min(0, fbm3(v.x * 1.7 - seed, v.y * 1.7 + seed, v.z * 1.7, 3) + 0.12) * 0.22;
    const marks = fbm3(v.x * 7 + seed, v.y * 7, v.z * 7, 3) * 0.012; // saw and tool marks
    v.addScaledVector(dir, lumps + chips + marks);
    // gentle taper so blocks look hand-cut rather than machined
    v.x *= 1 - v.y * 0.05;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  smoothSeamNormals(g);
  return g;
}

// Packed-snow material with powder settling on upward-facing surfaces.
function snowBlockMaterial(tex, scan) {
  const m = new THREE.MeshStandardMaterial({
    color: 0xbfc5ce,
    roughness: 0.85,
    roughnessMap: tex.snowRough,
    normalMap: tex.snowNormal,
    normalScale: new THREE.Vector2(0.8, 0.8),
    metalness: 0,
  });
  m.onBeforeCompile = (s) => {
    s.uniforms.uScan = scan.uScan;
    s.uniforms.uTime = scan.uTime;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vUpW;\nvarying vec3 vWPos;')
      .replace(
        '#include <defaultnormal_vertex>',
        `#include <defaultnormal_vertex>
        mat4 snowIM = mat4(1.0);
        #ifdef USE_INSTANCING
          snowIM = instanceMatrix;
        #endif
        vUpW = normalize((modelMatrix * snowIM * vec4(objectNormal, 0.0)).xyz).y;
        vWPos = (modelMatrix * snowIM * vec4(position, 1.0)).xyz;`,
      );
    s.fragmentShader = s.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying float vUpW;
        varying vec3 vWPos;
        float hh(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
        float vn(vec3 p){
          vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hh(i), hh(i + vec3(1,0,0)), f.x), mix(hh(i + vec3(0,1,0)), hh(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(hh(i + vec3(0,0,1)), hh(i + vec3(1,0,1)), f.x), mix(hh(i + vec3(0,1,1)), hh(i + vec3(1,1,1)), f.x), f.y), f.z);
        }
        float snowAmt;
        uniform float uScan, uTime;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float sn = vn(vWPos * 5.0) * 0.6 + vn(vWPos * 13.0) * 0.4;
        snowAmt = smoothstep(0.3, 0.75, vUpW + (sn - 0.5) * 0.55);
        // darker, denser snow in the crevices facing down
        diffuseColor.rgb *= mix(0.78, 1.0, smoothstep(-0.6, 0.2, vUpW));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.94, 0.96, 1.0), snowAmt * 0.9);
        // faint diagonal saw strokes on the cut faces
        diffuseColor.rgb *= 1.0 - 0.035 * (1.0 - snowAmt) * smoothstep(0.6, 1.0, sin(dot(vWPos, vec3(21.0, 9.0, 15.0))));`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 1.0, snowAmt);`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        // ice-crystal glints in the powder
        vec3 cell = floor(vWPos * 70.0);
        float glint = step(0.997, hh(cell)) * (0.5 + 0.5 * sin(uTime * 4.0 + hh(cell + 7.0) * 60.0));
        totalEmissiveRadiance += vec3(1.0) * glint * 0.9 * snowAmt;
        // blueprint scan band with fine contour lines inside it
        float band = exp(-pow((vWPos.y - uScan) * 5.0, 2.0));
        float contour = step(0.9, fract(vWPos.y * 14.0));
        totalEmissiveRadiance += vec3(0.3, 0.7, 1.4) * band * (0.7 + 0.8 * contour);`,
      );
  };
  return m;
}

// The VCDevelopments logo (a slanted V blade and an open C arc) as a monument of snow bricks:
// bricks are laid in staggered courses, two layers deep, wherever they fall inside the logo shape.
// Every brick is a slot: resting transform + an outward direction used for explode / hover.
const LS = 24; // logo px per world unit
const LX = (px) => (px - 108) / LS, LY = (py) => (165 - py) / LS;
const LOGO = {
  a: new THREE.Vector2(LX(36), LY(52)), b: new THREE.Vector2(LX(80), LY(150)), rb: 15 / LS,
  c: new THREE.Vector2(LX(130), LY(100)), ra: 40 / LS, rt: 13 / LS, a0: THREE.MathUtils.degToRad(35), sweep: THREE.MathUtils.degToRad(290),
};
const arcPoint = (t) => new THREE.Vector2(LOGO.c.x + Math.cos(LOGO.a0 + t * LOGO.sweep) * LOGO.ra, LOGO.c.y + Math.sin(LOGO.a0 + t * LOGO.sweep) * LOGO.ra);

function insideLogo(x, y) {
  const p = new THREE.Vector2(x, y), ab = LOGO.b.clone().sub(LOGO.a);
  const t = THREE.MathUtils.clamp(p.clone().sub(LOGO.a).dot(ab) / ab.lengthSq(), 0, 1);
  if (p.distanceTo(LOGO.a.clone().addScaledVector(ab, t)) < LOGO.rb) return true;
  let ang = Math.atan2(y - LOGO.c.y, x - LOGO.c.x) - LOGO.a0;
  ang = ((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (ang <= LOGO.sweep && Math.abs(p.distanceTo(LOGO.c) - LOGO.ra) < LOGO.rt) return true;
  return p.distanceTo(arcPoint(0)) < LOGO.rt || p.distanceTo(arcPoint(1)) < LOGO.rt;
}

function monumentSlots() {
  const bw = 0.46, bh = 0.3, depth = 0.48;
  const minX = LX(36) - LOGO.rb, maxX = LOGO.c.x + LOGO.ra + LOGO.rt;
  const H = LY(52) + LOGO.rb;
  const center = new THREE.Vector3((minX + maxX) / 2, H / 2, 0);
  const slots = [];
  let row = 0;
  for (let y = bh / 2; y < H; y += bh, row++) {
    for (let x = minX + (row % 2 ? bw / 2 : 0); x < maxX; x += bw) {
      if (!insideLogo(x, y)) continue;
      for (const z of [-depth / 2 - 0.01, depth / 2 + 0.01]) {
        const pos = new THREE.Vector3(x, y, z);
        const out = pos.clone().sub(center).multiply(new THREE.Vector3(1, 0.6, 3)).normalize();
        slots.push({ pos, basis: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)], size: [bw * 0.94, bh * 0.92, depth], out });
      }
    }
  }
  return { slots, minX, maxX, W: maxX - minX, H, center };
}

// Logo-shaped light slab between the two brick layers, so light leaks through the joints.
function logoGlowGeometries() {
  const ab = LOGO.b.clone().sub(LOGO.a);
  const blade = new THREE.CapsuleGeometry(LOGO.rb * 0.8, ab.length(), 6, 16);
  blade.rotateZ(Math.atan2(ab.y, ab.x) - Math.PI / 2);
  blade.translate((LOGO.a.x + LOGO.b.x) / 2, (LOGO.a.y + LOGO.b.y) / 2, 0);
  class Arc extends THREE.Curve {
    getPoint(t, out = new THREE.Vector3()) { const p = arcPoint(t); return out.set(p.x, p.y, 0); }
  }
  const arc = new THREE.TubeGeometry(new Arc(), 64, LOGO.rt * 0.8, 12, false);
  for (const g of [blade, arc]) g.scale(1, 1, 0.12);
  return [blade, arc];
}

// Wind-blown snow piled around the base.
function driftGeometry(R) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const r = lerp(R - 0.35, R + 1.9, t);
    pts.push(new THREE.Vector2(r, 0.42 * Math.pow(1 - t, 1.6) * Math.sin(Math.PI * Math.min(1, t * 1.2 + 0.25)) - 0.08));
  }
  const g = new THREE.LatheGeometry(pts, 160);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = fbm3(x * 0.9, 3.3, z * 0.9, 4);
    p.setY(i, Math.max(-0.1, y + n * 0.22 * (y + 0.1)));
  }
  g.computeVertexNormals();
  return g;
}

export function createHero(env) {
  const tex = getTextures();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.FogExp2(BG, 0.013);
  scene.environment = env;
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 500);

  scene.add(new THREE.HemisphereLight(0xdfe5ee, 0x40444b, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 1.9);
  sun.position.set(-18, 26, 14);
  scene.add(sun);

  // terrain
  const tGeo = new THREE.PlaneGeometry(320, 320, 240, 240);
  tGeo.rotateX(-Math.PI / 2);
  const tp = tGeo.attributes.position;
  for (let i = 0; i < tp.count; i++) tp.setY(i, terrainHeight(tp.getX(i), tp.getZ(i)));
  tGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(tGeo, new THREE.MeshStandardMaterial({ color: 0xaeb3ba, roughness: 0.96, normalMap: tex.terrainNormal, normalScale: new THREE.Vector2(0.18, 0.18) })));

  const base = terrainHeight(0, 0) - 0.12;
  const monument = new THREE.Group();
  monument.position.y = base;
  monument.rotation.y = -0.12;
  scene.add(monument);

  // inner light that leaks through the gaps between blocks
  const glowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.25, 2.4), fog: false, side: THREE.DoubleSide, transparent: true });
  for (const g of logoGlowGeometries()) monument.add(new THREE.Mesh(g, glowMat));
  const lamp = new THREE.PointLight(0xdfe8ff, 6, 9, 1.5);
  lamp.position.set(0, 2.6, 0);
  monument.add(lamp);

  const { slots, minX, maxX, W, H, center } = monumentSlots();
  const scanU = { uScan: { value: -100 }, uTime: { value: 0 } };
  const snowMat = snowBlockMaterial(tex, scanU);
  // soft contact shadow where the dome meets the snow
  {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 20, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.55)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(W + 3, 3.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(center.x, 0.04, 0);
    monument.add(shadow);
  }
  // snow piled against the feet of the V and the C
  for (const x of [LOGO.b.x, LOGO.c.x]) {
    const drift = new THREE.Mesh(driftGeometry(0.75), snowMat);
    drift.position.x = x;
    drift.scale.set(1, 1, 0.55);
    monument.add(drift);
  }

  // blocks are split across a few geometry variants so neighbours never look identical
  const rand = rng(7);
  slots.forEach((sl, i) => { sl.variant = i % VARIANTS; });
  const meshes = Array.from({ length: VARIANTS }, (_, v) => {
    const owned = slots.filter((s) => s.variant === v);
    const mesh = new THREE.InstancedMesh(blockGeometry(v * 3.1 + 0.7), snowMat, owned.length);
    owned.forEach((s, k) => { s.mesh = mesh; s.index = k; });
    monument.add(mesh);
    return mesh;
  });

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qr = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const tint = new THREE.Color();
  for (const sl of slots) {
    sl.q = new THREE.Quaternion().setFromRotationMatrix(m4.makeBasis(...sl.basis));
    sl.qRand = new THREE.Quaternion().setFromEuler(new THREE.Euler((rand() - 0.5) * 2, (rand() - 0.5) * 2, (rand() - 0.5) * 2));
    // tiny resting irregularity: no two blocks sit perfectly
    sl.qRest = new THREE.Quaternion().setFromEuler(new THREE.Euler((rand() - 0.5) * 0.06, (rand() - 0.5) * 0.06, (rand() - 0.5) * 0.08));
    sl.dist = 0.5 + rand() * 1.1;
    sl.lift = rand();
    sl.h = 0; // hover displacement (spring)
    sl.v = 0;
    const l = 0.9 + rand() * 0.16;
    sl.mesh.setColorAt(sl.index, tint.setRGB(l * 0.98, l, l * (1.02 + rand() * 0.04)));
  }
  meshes.forEach((m) => { m.instanceColor.needsUpdate = true; });

  // invisible proxy the pointer is tested against
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, H + 0.4, 1.6), new THREE.MeshBasicMaterial());
  proxy.position.copy(center);
  proxy.visible = false;
  monument.add(proxy);
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();
  let hovering = false, breath = 0, breathV = 0;
  const ripples = [];

  function layoutBlocks(e, time, dt) {
    breathV += ((hovering ? 1 : 0) - breath) * 60 * dt - breathV * 9 * dt;
    breath += breathV * dt;
    for (let i = 0; i < slots.length; i++) {
      const sl = slots[i];
      // hover target: gaussian falloff around the pointer hit, springs give a little overshoot
      const target = hovering ? Math.exp(-sl.pos.distanceToSquared(hit) / 1.5) : 0;
      sl.v += (target - sl.h) * 110 * dt - sl.v * 11 * dt;
      sl.h += sl.v * dt;

      let ripple = 0;
      for (const r of ripples) {
        const t = time - r.t0;
        const d = sl.pos.distanceTo(r.at);
        ripple += Math.exp(-((d - t * 6.5) ** 2) / 0.5) * Math.exp(-t * 1.6) * 1.1;
      }

      const push = sl.h * 0.75 + breath * 0.12 + ripple;
      const wob = Math.sin(time * 0.9 + i * 1.7) * 0.05 * Math.min(e, 1);
      p.copy(sl.pos).addScaledVector(sl.out, e * sl.dist + wob + push);
      p.y += e * e * sl.lift * 0.6 + ripple * 0.15;
      qr.identity().slerp(sl.qRand, Math.min(1, e * 0.18 + (sl.h + ripple) * 0.12));
      q.copy(sl.q).multiply(sl.qRest).premultiply(qr);
      s.set(...sl.size);
      sl.mesh.setMatrixAt(sl.index, m4.compose(p, q, s));
    }
    for (const m of meshes) m.instanceMatrix.needsUpdate = true;
    while (ripples.length && time - ripples[0].t0 > 3) ripples.shift();
  }

  // falling snow
  const SN = 1800;
  const snowPos = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) {
    snowPos[i * 3] = (rand() - 0.5) * 50;
    snowPos[i * 3 + 1] = rand() * 20;
    snowPos[i * 3 + 2] = (rand() - 0.5) * 50;
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  scene.add(new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0.8, depthWrite: false })));

  // numbered tags on a handful of blocks while the monument is exploded
  const tagged = [5, 19, 33, 46, 58, 70].map((i) => slots[i % slots.length]);
  const callouts = tagged.map((sl, k) => ({
    text: String(slots.indexOf(sl) + 1).padStart(2, '0'),
    cls: 'tag',
    anchor: new THREE.Vector3(),
    offset: [k % 2 ? 26 : -26, -22],
    visible: false,
    sl,
  }));

  // blueprint annotations: rotating polar grid under the monument, plus height and diameter dimensions
  const hud = new THREE.Group();
  monument.add(hud);
  const hudMat = new THREE.LineBasicMaterial({ color: new THREE.Color(0.6, 1.1, 1.9), transparent: true, opacity: 0, fog: false, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
  const tickMat = hudMat.clone();
  const grid = new THREE.Group();
  hud.add(grid);
  {
    const pts = [];
    for (const r of [1.5, 3, 4.5, 6]) for (let k = 0; k < 128; k++) {
      const a0 = (k / 128) * Math.PI * 2, a1 = ((k + 1) / 128) * Math.PI * 2;
      if (r === 6 && k % 4 === 3) continue; // dashed outer ring
      pts.push(Math.cos(a0) * r, 0, Math.sin(a0) * r, Math.cos(a1) * r, 0, Math.sin(a1) * r);
    }
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      pts.push(Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5, Math.cos(a) * 6.3, 0, Math.sin(a) * 6.3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const lines = new THREE.LineSegments(g, hudMat);
    lines.position.y = 0.04;
    lines.renderOrder = 3;
    grid.add(lines);
  }
  {
    // dimension lines with end ticks: diameter in front, height on the left
    const z = 2.2, xL = minX - 0.9, x0 = minX, x1 = maxX;
    const pts = [
      x0, 0.02, z, x1, 0.02, z, x0, -0.15, z, x0, 0.2, z, x1, -0.15, z, x1, 0.2, z,
      x0, 0.02, 0.4, x0, 0.02, z + 0.2, x1, 0.02, 0.4, x1, 0.02, z + 0.2,
      xL, 0, 0, xL, H, 0, xL - 0.18, 0, 0, xL + 0.18, 0, 0, xL - 0.18, H, 0, xL + 0.18, H, 0,
      xL + 0.2, H, 0, x0 + 0.3, H, 0,
    ];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const dims = new THREE.LineSegments(g, tickMat);
    dims.renderOrder = 3;
    hud.add(dims);
  }
  callouts.push(
    { text: `W ${W.toFixed(2)} M`, cls: 'tag', anchor: new THREE.Vector3(), local: new THREE.Vector3(center.x, 0.02, 2.2), offset: [20, 26], visible: false },
    { text: `H ${H.toFixed(2)} M`, cls: 'tag', anchor: new THREE.Vector3(), local: new THREE.Vector3(minX - 0.9, H * 0.5, 0), offset: [-24, -10], visible: false },
    { text: 'VCD // MONUMENT_01\nBRICKS ' + slots.length, anchor: new THREE.Vector3(), local: new THREE.Vector3(maxX - 0.4, H * 0.85, 0), offset: [90, -60], visible: false },
  );

  // intro: a glowing wireframe of every block draws in bottom-up, with faint construction lines,
  // then the scene emerges from the fog behind it
  const CORNERS = [];
  for (let k = 0; k < 8; k++) CORNERS.push(new THREE.Vector3(k & 1 ? 0.5 : -0.5, k & 2 ? 0.5 : -0.5, k & 4 ? 0.5 : -0.5));
  const EDGES = [];
  for (let a = 0; a < 8; a++) for (const bit of [1, 2, 4]) if (!(a & bit)) EDGES.push(a, a | bit);
  const wirePos = new Float32Array(slots.length * EDGES.length * 3);
  const wireGeo = new THREE.BufferGeometry();
  wireGeo.setAttribute('position', new THREE.BufferAttribute(wirePos, 3));
  // wire glows fully during the intro, and only inside the scan band afterwards
  const wireMat = new THREE.ShaderMaterial({
    uniforms: { uIntro: { value: 0 }, uScan: scanU.uScan },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: 'varying float vY; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'uniform float uIntro, uScan; varying float vY; void main(){ float band = exp(-pow((vY - uScan) * 2.2, 2.0)); float a = max(uIntro, band * 0.95); gl_FragColor = vec4(vec3(0.75, 1.3, 2.2) * a, a); }',
  });
  const wire = new THREE.LineSegments(wireGeo, wireMat);
  wire.frustumCulled = false;
  monument.add(wire);

  const guidePos = [];
  for (let k = 0; k < 46; k++) {
    const a = rand() * Math.PI * 2, r = 2 + rand() * 9, y = rand() * 7 - 1;
    const p0 = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    const dir = new THREE.Vector3(rand() - 0.5, (rand() - 0.5) * 0.6, rand() - 0.5).normalize();
    const len = 2 + rand() * 9;
    guidePos.push(p0.x, p0.y, p0.z, p0.x + dir.x * len, p0.y + dir.y * len, p0.z + dir.z * len);
  }
  const guideGeo = new THREE.BufferGeometry();
  guideGeo.setAttribute('position', new THREE.Float32BufferAttribute(guidePos, 3));
  const guideMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const guides = new THREE.LineSegments(guideGeo, guideMat);
  monument.add(guides);
  const wv = new THREE.Vector3();

  function updateWire(T) {
    const draw = smoothstep(0.1, 1.5, T);
    wireMat.uniforms.uIntro.value = smoothstep(0, 0.3, T) * (1 - smoothstep(1.9, 3.0, T));
    guideMat.opacity = smoothstep(0.2, 0.6, T) * (1 - smoothstep(1.4, 2.4, T)) * (0.22 + 0.13 * Math.sin(T * 40));
    wire.visible = wireMat.uniforms.uIntro.value > 0.001 || scanU.uScan.value > -50;
    guides.visible = guideMat.opacity > 0.001;
    if (!wire.visible) return;
    let w = 0;
    for (const sl of slots) {
      sl.mesh.getMatrixAt(sl.index, m4);
      for (const e of EDGES) {
        wv.copy(CORNERS[e]).applyMatrix4(m4);
        wirePos[w++] = wv.x; wirePos[w++] = wv.y; wirePos[w++] = wv.z;
      }
    }
    wireGeo.attributes.position.needsUpdate = true;
    wireGeo.setDrawRange(0, Math.floor(draw * slots.length) * EDGES.length);
  }

  function update(local, ctx) {
    const { time, dt, mouse, intro } = ctx;
    const t = easeInOut(local);
    const T = ctx.introT;
    const reveal = easeInOut(smoothstep(1.5, 3.2, T));

    // blueprint scan: every 7 s after the intro, a band sweeps from the base to above the cap,
    // and the grid, dimensions and labels show while it runs
    const sinceIntro = T - 3.5;
    const ph = sinceIntro > 0 ? sinceIntro % 7 : -1;
    scanU.uScan.value = ph >= 0 && ph < 2.6 ? base + lerp(-0.4, H + 0.8, ph / 2.6) : -100;
    const hudOn = ph >= 0 ? smoothstep(0, 0.4, ph) * (1 - smoothstep(2.4, 3.4, ph)) : 0;

    const explode = (1 - intro) * 0.6 + (1 - smoothstep(0, 0.45, local)) * 0.32;
    scene.fog.density = lerp(0.35, 0.013, reveal);

    // slow orbit that settles as the scene appears
    const orbit = (1 - reveal) * 0.55;
    const cx = lerp(0, 2.6, t) + mouse.x * 0.9, cz = lerp(30, 12.5, t);
    camera.position.set(cx * Math.cos(orbit) - cz * Math.sin(orbit), base + lerp(6.6, 4.0, t) + mouse.y * 0.45 + (1 - reveal) * 2, cx * Math.sin(orbit) + cz * Math.cos(orbit));
    camera.lookAt(0, base + lerp(3.0, 2.6, t), 0);
    camera.updateMatrixWorld();
    monument.updateMatrixWorld();

    // pointer interaction only once the intro has landed and while the monument is on screen
    hovering = false;
    if (ctx.pointer.inside && intro > 0.9 && local < 0.95) {
      raycaster.setFromCamera(ndc.set(ctx.pointer.x, ctx.pointer.y), camera);
      const h = raycaster.intersectObject(proxy, false)[0];
      if (h) {
        hovering = true;
        hit.copy(monument.worldToLocal(h.point));
        if (ctx.click) ripples.push({ at: hit.clone(), t0: time });
      }
    }
    ctx.cursor ||= hovering;

    layoutBlocks(explode, time, dt);
    updateWire(T);
    glowMat.color.setScalar(1.05 + explode * 0.6 + breath * 0.4);
    glowMat.opacity = reveal;
    scanU.uTime.value = time;
    hud.visible = hudOn > 0.01;
    hudMat.opacity = hudOn * 0.55;
    tickMat.opacity = hudOn * 0.8;
    grid.rotation.y = time * 0.05;
    lamp.intensity = (5 + breath * 6) * reveal;

    for (let i = 0; i < SN; i++) {
      let y = snowPos[i * 3 + 1] - dt * (0.6 + (i % 7) * 0.08);
      if (y < 0) y += 20;
      snowPos[i * 3 + 1] = y;
      snowPos[i * 3] += Math.sin(time * 0.6 + i) * dt * 0.15;
    }
    snowGeo.attributes.position.needsUpdate = true;

    for (const c of callouts) {
      if (c.local) {
        c.anchor.copy(c.local).applyMatrix4(monument.matrixWorld);
        c.visible = hudOn > 0.5 && local < 0.6;
        continue;
      }
      c.sl.mesh.getMatrixAt(c.sl.index, m4);
      c.anchor.setFromMatrixPosition(m4).applyMatrix4(monument.matrixWorld);
      c.visible = T > 0.5 && explode > 0.15;
    }
  }

  return { scene, camera, update, callouts };
}
