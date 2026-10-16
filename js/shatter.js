// Click effect shared by the opening and finale logos: the logo bursts into small particles that
// fly outward, hang for a moment, then stream back and reassemble it.
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { rng } from './noise.js';
import { blueprintLineColor } from './blueprint.js';

// Seconds from the click until every particle is back on the surface.
export const SHATTER_DURATION = 2.1;

// `geometries`: the logo's surface in the local space the points will live in, centred on the origin.
// `spread`: how far (world units) particles fly out. `color`: the particles' resting colour.
export function createShatter(geometries, { count = 7000, spread = 3, size = 26, color = new THREE.Color(1, 1, 1), blending = THREE.NormalBlending, seed = 3 } = {}) {
  const r = rng(seed);
  const pos = new Float32Array(count * 3), dir = new Float32Array(count * 3), rnd = new Float32Array(count);
  const samplers = geometries.map((g) => new MeshSurfaceSampler(new THREE.Mesh(g)).setRandomGenerator(r).build());
  const v = new THREE.Vector3(), d = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    samplers[i % samplers.length].sample(v);
    // outward from the centre, scattered so it reads as debris rather than an inflating shape
    const jitter = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(1.1);
    d.copy(v).normalize().multiplyScalar(0.75).add(jitter);
    d.z *= 0.45; // mostly sideways and up/down, so debris doesn't fly into the camera
    pos.set([v.x, v.y, v.z], i * 3);
    dir.set([d.x, d.y, d.z], i * 3);
    rnd[i] = r();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: -1 }, uSpread: { value: spread }, uSize: { value: size }, uPix: { value: 1 }, uColor: { value: color }, uTint: blueprintLineColor },
    transparent: true,
    depthWrite: false,
    blending,
    vertexShader: /* glsl */ `
      attribute vec3 aDir;
      attribute float aRnd;
      uniform float uT, uSpread, uSize, uPix;
      varying float vK;
      void main() {
        // per particle: burst out (ease-out), drift, then stream back (ease-in-out), staggered
        float t = uT - aRnd * 0.12;
        float out_ = 1.0 - pow(1.0 - clamp(t / 0.5, 0.0, 1.0), 3.0);
        float back = smoothstep(0.0, 1.0, clamp((t - 0.75 - aRnd * 0.45) / 0.8, 0.0, 1.0));
        float k = out_ * (1.0 - back);
        vec3 p = position + aDir * uSpread * (0.6 + aRnd * 0.9) * k;
        // swirl around the vertical axis while scattered, plus a little turbulence
        float a = k * (aRnd - 0.5) * 1.6;
        p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
        p += vec3(sin(uT * 3.0 + aRnd * 40.0), cos(uT * 2.6 + aRnd * 31.0), sin(uT * 2.2 + aRnd * 23.0)) * 0.12 * k;
        vK = k;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = min(uSize * uPix * (0.45 + aRnd * 0.8) / -mv.z, 7.0 * uPix);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor, uTint;
      varying float vK;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 col = mix(uColor, uTint, smoothstep(0.2, 1.0, vK) * 0.7); // glow blueprint cyan in flight
        gl_FragColor = vec4(col, smoothstep(0.5, 0.15, d) * 0.9);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.visible = false;

  let start = -Infinity;
  return {
    points,
    // start a burst unless one is already running; returns whether it started
    trigger(time) {
      if (time - start < SHATTER_DURATION) return false;
      start = time;
      return true;
    },
    // returns how far the burst has got: 0 idle, otherwise seconds since the click (< SHATTER_DURATION)
    update(time, ctx) {
      const t = time - start;
      const active = t >= 0 && t < SHATTER_DURATION;
      points.visible = active;
      mat.uniforms.uT.value = t;
      mat.uniforms.uPix.value = ctx.pixelRatio * (ctx.height / 900);
      return active ? t : 0;
    },
  };
}

// How visible the solid logo should be at burst time `t` (from update): gone while the particles
// are out, fading back as the last ones land.
export function solidVisibility(t) {
  if (t <= 0) return 1;
  return THREE.MathUtils.smoothstep(t, SHATTER_DURATION - 0.55, SHATTER_DURATION - 0.05);
}
