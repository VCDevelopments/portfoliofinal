// Chapter 3 — loose snow on a lit pedestal bursts into the VCDevelopments logo, shown as the same
// spinning neon sign as the landing page: light tubes, wireframe and particles all on one shape.
// Switching social links in the carousel makes the logo burst and re-form; clicking it shatters it
// into particles that reassemble.
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { rng, smoothstep } from './noise.js';
import { blueprintLineMaterial, blueprintLineColor } from './blueprint.js';
import { createShatter } from './shatter.js';
import { BOUNDS, neonGeometries, neonWireGeometry, neonMaterial } from './neonLogo.js';

const BG = 0x9ea3ab;
// grains in the logo; fewer on phones and tablets
const N = matchMedia('(pointer: coarse)').matches ? 9000 : 16000;

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

// grains spread evenly over the neon tubes
function logoPoints(geos) {
  const pos = new Float32Array(N * 3);
  const per = Math.ceil(N / geos.length);
  geos.forEach((g, k) => {
    const n = Math.min(per, N - k * per);
    pos.set(sampleGeometry(g, n, 6 + k), k * per * 3);
  });
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

  // the logo: neon tubes + their wireframe, spinning together
  const logo = new THREE.Group();
  logo.position.y = 0.4;
  logo.scale.setScalar(0.86); // the neon logo is built for the landing scene; fit it to this stage
  scene.add(logo);
  const neonGeos = neonGeometries();
  const neonMat = neonMaterial({ transparent: true, opacity: 0 });
  logo.add(...neonGeos.map((g) => new THREE.Mesh(g, neonMat)));
  const lineMat = blueprintLineMaterial(0);
  logo.add(new THREE.LineSegments(neonWireGeometry(), lineMat));
  // invisible box the pointer is tested against (the tubes alone are too thin to hit)
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(BOUNDS.W + 0.4, BOUNDS.H + 0.4, 1.2), new THREE.MeshBasicMaterial());
  proxy.visible = false;
  logo.add(proxy);

  // particles: start as snow, burst onto the neon outline
  const target = logoPoints(neonGeos);
  const geo = new THREE.BufferGeometry();
  const rnd = new Float32Array(N);
  const r = rng(31);
  for (let i = 0; i < N; i++) rnd[i] = r();
  geo.setAttribute('position', new THREE.BufferAttribute(target, 3));
  geo.setAttribute('aFrom', new THREE.BufferAttribute(snowPoints(), 3));
  geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uMorph: { value: 0 }, uTime: { value: 0 }, uSize: { value: 40 }, uPix: { value: 1 }, uBurst: { value: new THREE.Color(1, 1, 1) }, uTint: blueprintLineColor },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    clipping: true,
    vertexShader: /* glsl */ `
      attribute vec3 aFrom;
      attribute float aRnd;
      #include <clipping_planes_pars_vertex>
      uniform float uMorph, uTime, uSize, uPix;
      varying float vAlpha;
      varying float vSnow;
      void main() {
        float m = smoothstep(0.0, 1.0, clamp((uMorph - aRnd * 0.35) / 0.65, 0.0, 1.0));
        vec3 p = mix(aFrom, position, m);
        vec3 dir = normalize(position + vec3(0.001, 0.002, 0.003));
        p += dir * sin(3.14159 * m) * (0.8 + aRnd * 2.2);   // the pop: grains overshoot outward
        p += vec3(sin(uTime * 0.7 + aRnd * 40.0), cos(uTime * 0.6 + aRnd * 31.0), sin(uTime * 0.5 + aRnd * 23.0)) * 0.02;
        vSnow = 1.0 - m;
        vAlpha = mix(0.75, 0.55, m);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vec4 mvPosition = mv;
        #include <clipping_planes_vertex>
        gl_PointSize = uSize * uPix * (0.5 + aRnd * 0.8) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      #include <clipping_planes_pars_fragment>
      uniform vec3 uBurst, uTint;
      varying float vAlpha;
      varying float vSnow;
      void main() {
        #include <clipping_planes_fragment>
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 col = mix(uTint * 0.68, uBurst, vSnow);  // white snow turns blueprint cyan
        gl_FragColor = vec4(col, vAlpha * smoothstep(0.5, 0.2, d));
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  logo.add(points);

  // click: the whole logo shatters into particles that land back bottom-up; neon, wireframe and
  // grains grow back behind them
  const shatter = createShatter(neonGeos, { count: 8000, spread: 2.1, size: 90, color: blueprintLineColor.value.clone().multiplyScalar(0.68), blending: THREE.AdditiveBlending });
  logo.add(shatter.points);
  for (const m of [neonMat, lineMat, mat]) m.clippingPlanes = [shatter.plane];
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
      if (raycaster.intersectObject(proxy, false)[0]) {
        ctx.cursor = true;
        if (ctx.click) shatter.trigger(time);
      }
    }
    shatter.update(time, ctx);

    // neon and wireframe light up once the grains have landed
    const solid = smoothstep(0.55, 1, m);
    neonMat.opacity = solid;
    lineMat.opacity = solid * 0.4;
    logo.rotation.y = time * (ctx.reduced ? 0.12 : 0.5);

    const a = mouse.x * 0.35;
    let dist = 18 - local * 2.5;
    // phones (portrait): aim above the logo so it sits low in the frame, in the open space between
    // the contact text at the top and the link carousel at the bottom
    const portrait = camera.aspect < 0.8;
    const lift = portrait ? 3.4 : 0;
    if (portrait) dist *= 1.3; // a little further back, so it fits that space
    halo.visible = !portrait; // its ring would run through the contact text
    camera.position.set(Math.sin(a) * dist, 1.1 + lift + mouse.y * 0.8, Math.cos(a) * dist);
    camera.lookAt(0, 0.55 + lift, 0);
  }

  return { scene, camera, update, setShape, callouts: [] };
}
