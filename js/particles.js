// Chapter 3 — loose snow on a lit pedestal bursts into the VCDevelopments logo, shown as one
// spinning blueprint: translucent shell, wireframe and particles all on the same shape.
// Switching social links in the carousel makes the logo burst and re-form; clicking it shatters it
// into particles that reassemble.
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { rng, smoothstep } from './noise.js';
import { blueprintMaterial, blueprintLineMaterial, blueprintLineColor } from './blueprint.js';
import { createShatter, solidVisibility } from './shatter.js';

const BG = 0x9ea3ab;
const N = 16000;

function sampleGeometry(geo, count, seed) {
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(geo)).setRandomGenerator(rng(seed)).build();
  const out = new Float32Array(count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(v);
    out.set([v.x, v.y, v.z], i * 3);
  }
  return out;
}

// Logo 28 in 3D: a capsule blade for the V and a thick open arc for the C (logo units -> world).
const LX = (px) => (px - 108) / 28, LY = (py) => -(py - 100) / 28;
class ArcCurve extends THREE.Curve {
  getPoint(t, out = new THREE.Vector3()) {
    const a = THREE.MathUtils.degToRad(35 + t * 290);
    return out.set(LX(130) + Math.cos(a) * (40 / 28), Math.sin(a) * (40 / 28), 0);
  }
}
function logoParts(tubular, radial) {
  const a = new THREE.Vector3(LX(36), LY(52), 0), b = new THREE.Vector3(LX(80), LY(150), 0);
  const blade = new THREE.CapsuleGeometry(15 / 28, a.distanceTo(b), 12, radial);
  blade.rotateZ(Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2);
  blade.translate((a.x + b.x) / 2, (a.y + b.y) / 2, 0);
  const arc = new THREE.TubeGeometry(new ArcCurve(), tubular, 13 / 28, radial, false);
  return { blade, arc };
}

function logoPoints() {
  const { blade, arc } = logoParts(120, 24);
  const nb = Math.floor(N * 0.42);
  const pos = new Float32Array(N * 3);
  pos.set(sampleGeometry(blade, nb, 6));
  pos.set(sampleGeometry(arc, N - nb, 7), nb * 3);
  return pos;
}

// loose snow drifting around the stage, before it bursts into the logo
function snowPoints() {
  const r = rng(9);
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) pos.set([(r() - 0.5) * 26, r() * 14 - 4, (r() - 0.5) * 16], i * 3);
  return pos;
}

export function createParticles(env) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 14, 46);
  scene.environment = env;
  scene.environmentIntensity = 0.5;

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x5a5f68, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(0, 10, 4);
  scene.add(key);

  // floor, pedestal and glowing rings
  const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 96), new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.6, metalness: 0.2 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4.2;
  scene.add(floor);

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.7, 128), new THREE.MeshStandardMaterial({ color: 0x7e848c, roughness: 0.5, metalness: 0.2 }));
  pedestal.position.y = -3.85;
  scene.add(pedestal);

  const lit = (k) => new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k * 1.04), fog: true, side: THREE.DoubleSide });
  const flat = (rIn, rOut, y, k) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(rIn, rOut, 160), lit(k));
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    scene.add(m);
    return m;
  };
  flat(3.1, 3.16, -3.49, 1.6);
  flat(3.62, 3.7, -3.49, 1.4);
  [5.2, 7.4, 10.5, 14].forEach((r, i) => flat(r, r + 0.06 + i * 0.02, -4.19, 1.6 - i * 0.25));
  const halo = new THREE.Mesh(new THREE.TorusGeometry(7, 0.08, 12, 200), lit(2.4));
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 7.5;
  scene.add(halo);

  // the logo: blueprint shell + wireframe on the exact same geometry, spinning together
  const logo = new THREE.Group();
  logo.position.y = 0.4;
  scene.add(logo);
  const shellMat = blueprintMaterial();
  const lineMat = blueprintLineMaterial(0);
  const { blade, arc } = logoParts(120, 24);
  const shells = [blade, arc].map((g) => new THREE.Mesh(g, shellMat));
  logo.add(...shells);
  const wireParts = logoParts(40, 10);
  for (const g of [wireParts.blade, wireParts.arc]) logo.add(new THREE.LineSegments(new THREE.WireframeGeometry(g), lineMat));

  // particles: start as snow, burst onto the logo's surface
  const target = logoPoints();
  const geo = new THREE.BufferGeometry();
  const rnd = new Float32Array(N);
  const r = rng(31);
  for (let i = 0; i < N; i++) rnd[i] = r();
  geo.setAttribute('position', new THREE.BufferAttribute(target, 3));
  geo.setAttribute('aFrom', new THREE.BufferAttribute(snowPoints(), 3));
  geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uMorph: { value: 0 }, uFade: { value: 1 }, uTime: { value: 0 }, uSize: { value: 40 }, uPix: { value: 1 }, uBurst: { value: new THREE.Color(1, 1, 1) }, uTint: blueprintLineColor },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aFrom;
      attribute float aRnd;
      uniform float uMorph, uFade, uTime, uSize, uPix;
      varying float vAlpha;
      varying float vSnow;
      void main() {
        float m = smoothstep(0.0, 1.0, clamp((uMorph - aRnd * 0.35) / 0.65, 0.0, 1.0));
        vec3 p = mix(aFrom, position, m);
        vec3 dir = normalize(position + vec3(0.001, 0.002, 0.003));
        p += dir * sin(3.14159 * m) * (0.8 + aRnd * 2.2);   // the pop: grains overshoot outward
        p += vec3(sin(uTime * 0.7 + aRnd * 40.0), cos(uTime * 0.6 + aRnd * 31.0), sin(uTime * 0.5 + aRnd * 23.0)) * 0.02;
        vSnow = 1.0 - m;
        vAlpha = mix(0.75, 0.55, m) * uFade;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * uPix * (0.5 + aRnd * 0.8) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBurst, uTint;
      varying float vAlpha;
      varying float vSnow;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 col = mix(uTint * 0.68, uBurst, vSnow);  // white snow turns blueprint cyan
        gl_FragColor = vec4(col, vAlpha * smoothstep(0.5, 0.2, d));
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  logo.add(points);

  // click: the whole logo shatters into particles that reassemble
  const shatter = createShatter([blade, arc], { count: 8000, spread: 2.1, size: 90, color: blueprintLineColor.value.clone().multiplyScalar(0.68), blending: THREE.AdditiveBlending });
  logo.add(shatter.points);
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  let morphStart = Infinity;
  let entered = false;

  // first call bursts the snow into the logo; later calls (carousel) re-pop it in place
  function setShape(_i, time) {
    if (!entered) return;
    if (mat.uniforms.uMorph.value >= 1) {
      geo.attributes.aFrom.array.set(target);
      geo.attributes.aFrom.needsUpdate = true;
    }
    morphStart = time;
  }

  function update(local, ctx) {
    const { time, mouse } = ctx;
    if (!entered) {
      entered = true;
      morphStart = time + 0.3;
    }
    mat.uniforms.uTime.value = time;
    mat.uniforms.uPix.value = ctx.pixelRatio * (ctx.height / 900);
    const m = Math.min(1, Math.max(0, (time - morphStart) / 1.8));
    mat.uniforms.uMorph.value = m;

    // pointer: clicking the logo (once it has formed) shatters it
    if (m >= 1 && ctx.pointer.inside) {
      raycaster.setFromCamera(ndc.set(ctx.pointer.x, ctx.pointer.y), camera);
      if (raycaster.intersectObjects(shells, false)[0]) {
        ctx.cursor = true;
        if (ctx.click) shatter.trigger(time);
      }
    }
    const whole = solidVisibility(shatter.update(time, ctx));
    mat.uniforms.uFade.value = whole;

    // shell and wireframe resolve once the grains have landed, and hide while it is in pieces
    const solid = smoothstep(0.55, 1, m) * whole;
    shellMat.uniforms.uReveal.value = solid;
    shellMat.uniforms.uTime.value = time;
    shellMat.uniforms.uScan.value = ((time * 0.4) % 1.6) * 5 - 3;
    lineMat.opacity = solid * 0.55;
    logo.rotation.y = time * 0.5;

    const a = mouse.x * 0.35;
    const dist = 18 - local * 2.5;
    camera.position.set(Math.sin(a) * dist, 1.1 + mouse.y * 0.8, Math.cos(a) * dist);
    camera.lookAt(0, 0.55, 0);
  }

  return { scene, camera, update, setShape, callouts: [] };
}
