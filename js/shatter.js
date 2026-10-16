// Click effect shared by the opening and finale logos: the logo bursts into small particles that
// fly outward and hang for a moment, then stream back from the bottom up. The solid logo rebuilds
// behind them: `plane` rises with the landing front, so materials clipped by it grow back upward.
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { rng } from './noise.js';
import { blueprintLineColor } from './blueprint.js';

// Timeline (seconds after the click): particles fly out over 0.5 s, the lowest start back at
// RETURN, each takes LAND to land, and the landing front climbs the logo over CLIMB.
const RETURN = 0.75, LAND = 0.55, CLIMB = 0.9;
const BUILD_START = RETURN + LAND + 0.1; // when the lowest grains have landed and the solid starts to grow
export const SHATTER_DURATION = BUILD_START + CLIMB * 1.15;

// `geometries`: the logo's surface in the local space the points will live in, centred on the origin.
// `spread`: how far (world units) particles fly out. `color`: the particles' resting colour.
export function createShatter(geometries, { count = 7000, spread = 3, size = 26, color = new THREE.Color(1, 1, 1), blending = THREE.NormalBlending, seed = 3 } = {}) {
  const r = rng(seed);
  const pos = new Float32Array(count * 3), dir = new Float32Array(count * 3), rnd = new Float32Array(count), order = new Float32Array(count);
  const samplers = geometries.map((g) => new MeshSurfaceSampler(new THREE.Mesh(g)).setRandomGenerator(r).build());
  const v = new THREE.Vector3(), d = new THREE.Vector3();
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < count; i++) {
    samplers[i % samplers.length].sample(v);
    // outward from the centre, scattered so it reads as debris rather than an inflating shape
    const jitter = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(1.1);
    d.copy(v).normalize().multiplyScalar(0.75).add(jitter);
    d.z *= 0.45; // mostly sideways and up/down, so debris doesn't fly into the camera
    pos.set([v.x, v.y, v.z], i * 3);
    dir.set([d.x, d.y, d.z], i * 3);
    rnd[i] = r();
    minY = Math.min(minY, v.y);
    maxY = Math.max(maxY, v.y);
  }
  // 0 at the bottom of the logo, 1 at the top: the order particles land in
  for (let i = 0; i < count; i++) order[i] = (pos[i * 3 + 1] - minY) / (maxY - minY);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
  geo.setAttribute('aOrder', new THREE.BufferAttribute(order, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: -1 }, uFront: { value: -1 }, uSpread: { value: spread }, uSize: { value: size }, uPix: { value: 1 }, uColor: { value: color }, uTint: blueprintLineColor },
    transparent: true,
    depthWrite: false,
    blending,
    vertexShader: /* glsl */ `
      attribute vec3 aDir;
      attribute float aRnd, aOrder;
      uniform float uT, uFront, uSpread, uSize, uPix;
      varying float vK, vEdge;
      void main() {
        // burst out (ease-out) and drift; then, lowest first, stream back (ease-in-out)
        float t = uT - aRnd * 0.12;
        float out_ = 1.0 - pow(1.0 - clamp(t / 0.5, 0.0, 1.0), 3.0);
        float back = smoothstep(0.0, 1.0, clamp((uT - ${RETURN.toFixed(2)} - aOrder * ${CLIMB.toFixed(2)} - aRnd * 0.1) / ${LAND.toFixed(2)}, 0.0, 1.0));
        float k = out_ * (1.0 - back);
        vec3 p = position + aDir * uSpread * (0.6 + aRnd * 0.9) * k;
        // swirl around the vertical axis while scattered, plus a little turbulence
        float a = k * (aRnd - 0.5) * 1.6;
        p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
        p += vec3(sin(uT * 3.0 + aRnd * 40.0), cos(uT * 2.6 + aRnd * 31.0), sin(uT * 2.2 + aRnd * 23.0)) * 0.12 * k;
        vK = k;
        vEdge = 1.0 - smoothstep(0.0, 0.08, abs(aOrder - uFront)); // landed grains glow along the growing edge
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        // once the solid has grown past a grain, the grain is gone
        float size = min(uSize * uPix * (0.45 + aRnd * 0.8) / -mv.z, 7.0 * uPix);
        gl_PointSize = size * step(uFront - 0.04, aOrder);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor, uTint;
      varying float vK, vEdge;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 col = mix(uColor, uTint, max(smoothstep(0.2, 1.0, vK) * 0.7, vEdge)); // blueprint cyan in flight and on the edge
        gl_FragColor = vec4(col * (1.0 + vEdge * 0.6), smoothstep(0.5, 0.15, d) * 0.9);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.visible = false;

  // clips away everything above the landing front (world space); far above the logo when idle
  const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6);
  const tmp = new THREE.Vector3();

  let start = -Infinity;
  return {
    points,
    plane,
    // start a burst unless one is already running; returns whether it started
    trigger(time) {
      if (time - start < SHATTER_DURATION) return false;
      start = time;
      return true;
    },
    // call after the points' parents are positioned for this frame. Returns how much of the logo
    // stands: 0 while it is in pieces, rising to 1 as it rebuilds (1 when idle).
    update(time, ctx) {
      const t = time - start;
      const active = t >= 0 && t < SHATTER_DURATION;
      const front = active ? (t - BUILD_START) / CLIMB : 2;
      points.visible = active;
      mat.uniforms.uT.value = t;
      mat.uniforms.uFront.value = front;
      mat.uniforms.uPix.value = ctx.pixelRatio * (ctx.height / 900);
      if (active) {
        points.updateWorldMatrix(true, false);
        plane.constant = points.localToWorld(tmp.set(0, minY + front * (maxY - minY), 0)).y;
      } else plane.constant = 1e6;
      return THREE.MathUtils.clamp(front, 0, 1);
    },
  };
}
