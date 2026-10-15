// Chapter 2 — segmented rings snap together into the emblem as a blueprint hologram,
// then the camera flies through the centre.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { smoothstep, lerp, easeInOut, rng } from './noise.js';
import { blueprintMaterial, blueprintLineMaterial } from './blueprint.js';

const BG = 0xb0b4bb;

const RINGS = [
  { r: 4.4, tube: 0.44, n: 7, speed: 0.07 },
  { r: 2.9, tube: 0.34, n: 5, speed: -0.11 },
  { r: 1.7, tube: 0.24, n: 4, speed: 0.19 },
];

// one ring segment: a smooth, high-resolution torus arc (open ends read cleanly on the translucent shell)
function segmentGeometry(r, tube, arc) {
  return new THREE.TorusGeometry(r, tube, 48, Math.ceil(arc * r * 24), arc);
}

export function createRings(env) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 6, 40);
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 200);

  const shellMat = blueprintMaterial();
  shellMat.uniforms.uReveal.value = 1;
  const lineMat = blueprintLineMaterial(0.5);

  const rand = rng(23);
  const pieces = [];
  const groups = RINGS.map((def, ri) => {
    const g = new THREE.Group();
    const gap = 0.32 / def.r;
    const arc = (Math.PI * 2) / def.n - gap;
    const geo = segmentGeometry(def.r, def.tube, arc);
    const wireGeo = new THREE.WireframeGeometry(new THREE.TorusGeometry(def.r, def.tube * 1.01, 8, Math.ceil(arc * def.r * 5), arc));
    for (let k = 0; k < def.n; k++) {
      const m = new THREE.Mesh(geo, shellMat);
      m.add(new THREE.LineSegments(wireGeo, lineMat));
      const a0 = (k / def.n) * Math.PI * 2;
      m.rotation.z = a0;
      const mid = a0 + arc / 2;
      pieces.push({ m, a0, dir: new THREE.Vector3(Math.cos(mid), Math.sin(mid), 0), dist: 3 + rand() * 5, z: (rand() - 0.5) * 10, spin: (rand() - 0.5) * 2 });
      g.add(m);
    }
    g.userData = { ...def, tilt: ri * 1.3 };
    scene.add(g);
    return g;
  });

  // small orbiting blocks at the centre
  const cubeGeo = new RoundedBoxGeometry(0.42, 0.42, 0.42, 3, 0.08);
  const cubeEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.44, 0.44, 0.44));
  const cubes = Array.from({ length: 5 }, (_, i) => {
    const m = new THREE.Mesh(cubeGeo, shellMat);
    m.add(new THREE.LineSegments(cubeEdges, lineMat));
    m.userData.phase = (i / 5) * Math.PI * 2;
    scene.add(m);
    return m;
  });

  // measuring ring: fine ticks every 5°, long ticks every 30°, plus a crosshair
  const gauge = new THREE.Group();
  scene.add(gauge);
  {
    const pts = [];
    const R = 5.6;
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * Math.PI * 2, len = k % 6 ? 0.18 : 0.45;
      pts.push(Math.cos(a) * R, Math.sin(a) * R, 0, Math.cos(a) * (R + len), Math.sin(a) * (R + len), 0);
      const b = ((k + 1) / 72) * Math.PI * 2;
      pts.push(Math.cos(a) * R, Math.sin(a) * R, 0, Math.cos(b) * R, Math.sin(b) * R, 0);
    }
    pts.push(-6.6, 0, 0, -5.9, 0, 0, 5.9, 0, 0, 6.6, 0, 0, 0, -6.6, 0, 0, -5.9, 0, 0, 5.9, 0, 0, 6.6, 0);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    gauge.add(new THREE.LineSegments(g, blueprintLineMaterial(0.45)));
  }

  // bright core: a soft cyan glow
  const glowMat = new THREE.ShaderMaterial({
    uniforms: { uI: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uI; varying vec2 vUv; void main(){ float d = length(vUv - 0.5) * 2.0; float g = pow(max(0.0, 1.0 - d), 3.0); gl_FragColor = vec4(vec3(0.7, 1.1, 1.7) * g * uI, g * uI); }',
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), glowMat);
  glow.position.z = -0.5;
  scene.add(glow);

  // radius labels, anchored up-right of each ring
  const callouts = RINGS.map((d, i) => ({
    text: `R ${d.r.toFixed(2)}  ·  SEG ${String(d.n).padStart(2, '0')}`,
    cls: 'tag',
    anchor: new THREE.Vector3(Math.cos(0.7) * d.r, Math.sin(0.7) * d.r, 0),
    offset: [60 + i * 10, -30 - i * 18],
    visible: false,
  }));

  function update(local, ctx) {
    const { time, mouse } = ctx;
    const assemble = easeInOut(smoothstep(0.02, 0.5, local));
    const fly = easeInOut(smoothstep(0.45, 1, local));

    for (const p of pieces) {
      const k = 1 - assemble;
      p.m.position.copy(p.dir).multiplyScalar(k * p.dist);
      p.m.position.z = k * p.z;
      p.m.rotation.x = k * p.spin;
      p.m.rotation.y = k * p.spin * 0.6;
    }
    groups.forEach((g) => {
      const d = g.userData;
      g.rotation.z = time * d.speed + local * d.speed * 25;
      g.rotation.x = Math.sin(time * 0.35 + d.tilt) * 0.22 * (1 - fly);
      g.rotation.y = Math.cos(time * 0.3 + d.tilt) * 0.18 * (1 - fly);
    });
    cubes.forEach((c, i) => {
      const a = c.userData.phase + time * 0.6;
      const r = lerp(3.5, 0.85, assemble);
      c.position.set(Math.cos(a) * r, Math.sin(a) * r, Math.sin(time + i) * 0.2);
      c.rotation.set(time * 0.7 + i, time * 0.5, i);
    });
    gauge.rotation.z = -time * 0.03;
    gauge.scale.setScalar(lerp(1.3, 1, assemble));

    shellMat.uniforms.uTime.value = time;
    shellMat.uniforms.uScan.value = ((time * 0.35) % 1.6) * 8 - 5;
    glowMat.uniforms.uI.value = 0.3 + fly * fly * 1.1;
    for (const c of callouts) c.visible = assemble > 0.85 && fly < 0.25;

    camera.position.set(mouse.x * 1.2 * (1 - fly), mouse.y * 0.8 * (1 - fly), lerp(19, 0.4, fly));
    camera.lookAt(0, 0, -1);
    camera.rotation.z = fly * 0.6;
  }

  function setSeason(S) {
    scene.background.setHex(S.rings);
    scene.fog.color.setHex(S.rings);
  }

  return { scene, camera, update, callouts, setSeason };
}
