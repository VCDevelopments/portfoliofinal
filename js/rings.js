// Chapter 2 — a 3D gyroscope drawn as a blueprint: three machined rings on different axes, each built
// from bevelled, toothed segments with bolts at the joints, around a core of nested polyhedra.
// The segments fly in and lock together, then the camera flies through the centre.
import * as THREE from 'three';
import { smoothstep, lerp, easeInOut, rng } from './noise.js';
import { blueprintMaterial, blueprintLineMaterial } from './blueprint.js';

const BG = 0xb0b4bb;

// r: centre radius, w: radial width, d: depth, n: segments, tilt: orientation of the ring's axis
const RINGS = [
  { r: 4.6, w: 0.62, d: 0.36, n: 8, speed: 0.08, tilt: [0, 0, 0] },
  { r: 3.45, w: 0.48, d: 0.3, n: 6, speed: -0.15, tilt: [1.15, 0.2, 0.35] },
  { r: 2.4, w: 0.36, d: 0.24, n: 5, speed: 0.24, tilt: [0.35, 1.25, 0] },
];
const TOOTH = 0.32; // gear tooth pitch along the outer edge

// One machined ring segment: an annulus sector with gear teeth on the outer edge, extruded and bevelled.
function segmentGeometry(r, w, d, arc) {
  const rIn = r - w / 2, rOut = r + w / 2, rTooth = rOut + 0.07;
  const shape = new THREE.Shape();
  shape.moveTo(rIn, 0);
  shape.lineTo(rOut, 0);
  const teeth = Math.max(4, Math.round((arc * rOut) / TOOTH));
  for (let k = 0; k < teeth; k++) {
    // up onto the tooth, along it, back down, then along the root to the next tooth
    const a0 = (k / teeth) * arc, a1 = ((k + 0.5) / teeth) * arc, a2 = ((k + 1) / teeth) * arc;
    shape.lineTo(Math.cos(a0 + 0.004) * rTooth, Math.sin(a0 + 0.004) * rTooth);
    shape.lineTo(Math.cos(a1) * rTooth, Math.sin(a1) * rTooth);
    shape.lineTo(Math.cos(a1 + 0.004) * rOut, Math.sin(a1 + 0.004) * rOut);
    shape.lineTo(Math.cos(a2) * rOut, Math.sin(a2) * rOut);
  }
  shape.lineTo(Math.cos(arc) * rIn, Math.sin(arc) * rIn);
  shape.absarc(0, 0, rIn, arc, 0, true);
  const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.025, bevelSegments: 1, curveSegments: 40 });
  g.translate(0, 0, -d / 2);
  return g;
}

export function createRings(env) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 6, 40);
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 200);

  // faint hologram shell, crisp feature edges on top, and an even fainter full wireframe for depth
  const shellMat = blueprintMaterial();
  shellMat.uniforms.uReveal.value = 0.45;
  const edgeMat = blueprintLineMaterial(0.85);
  const meshMat = blueprintLineMaterial(0.045);

  const rand = rng(23);
  const pieces = [];
  const rings = RINGS.map((def) => {
    const holder = new THREE.Group(); // the ring's orientation in space
    holder.rotation.set(...def.tilt);
    const spin = new THREE.Group(); // spins about the ring's own axis
    holder.add(spin);
    scene.add(holder);

    const gap = 0.14 / def.r;
    const arc = (Math.PI * 2) / def.n - gap;
    const geo = segmentGeometry(def.r, def.w, def.d, arc);
    const edges = new THREE.EdgesGeometry(geo, 25);
    const wire = new THREE.WireframeGeometry(geo);
    const boltEdges = new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.055, 0.055, def.d + 0.12, 10).rotateX(Math.PI / 2), 30);

    for (let k = 0; k < def.n; k++) {
      const piece = new THREE.Group();
      piece.add(new THREE.Mesh(geo, shellMat), new THREE.LineSegments(edges, edgeMat), new THREE.LineSegments(wire, meshMat));
      for (const a of [0.03, arc - 0.03]) {
        // bolts at both ends of the segment
        const b = new THREE.LineSegments(boltEdges, edgeMat);
        b.position.set(Math.cos(a) * def.r, Math.sin(a) * def.r, 0);
        piece.add(b);
      }
      const a0 = (k / def.n) * Math.PI * 2;
      piece.rotation.z = a0;
      const mid = a0 + arc / 2;
      pieces.push({ m: piece, dir: new THREE.Vector3(Math.cos(mid), Math.sin(mid), 0), dist: 3 + rand() * 5, z: (rand() - 0.5) * 10, spin: (rand() - 0.5) * 2 });
      spin.add(piece);
    }
    return { def, holder, spin };
  });

  // core: two nested polyhedra turning against each other, joined to the inner ring by struts
  const core = new THREE.Group();
  scene.add(core);
  const innerGeo = new THREE.IcosahedronGeometry(0.85, 1);
  const outerGeo = new THREE.IcosahedronGeometry(1.25, 0);
  const coreA = new THREE.Group(), coreB = new THREE.Group();
  coreA.add(new THREE.Mesh(innerGeo, shellMat), new THREE.LineSegments(new THREE.EdgesGeometry(innerGeo, 1), edgeMat));
  coreB.add(new THREE.LineSegments(new THREE.EdgesGeometry(outerGeo, 1), edgeMat));
  core.add(coreA, coreB);
  {
    const pts = [], rIn = RINGS[2].r - RINGS[2].w / 2;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      pts.push(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0, Math.cos(a) * rIn, Math.sin(a) * rIn, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    rings[2].spin.add(new THREE.LineSegments(g, blueprintLineMaterial(0.4)));
  }

  // measuring ring: fine ticks every 5°, long ticks every 30°, plus a crosshair
  const gauge = new THREE.Group();
  scene.add(gauge);
  {
    const pts = [], R = 5.8;
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * Math.PI * 2, len = k % 6 ? 0.18 : 0.45;
      pts.push(Math.cos(a) * R, Math.sin(a) * R, 0, Math.cos(a) * (R + len), Math.sin(a) * (R + len), 0);
      const b = ((k + 1) / 72) * Math.PI * 2;
      pts.push(Math.cos(a) * R, Math.sin(a) * R, 0, Math.cos(b) * R, Math.sin(b) * R, 0);
    }
    pts.push(-6.8, 0, 0, -6.1, 0, 0, 6.1, 0, 0, 6.8, 0, 0, 0, -6.8, 0, 0, -6.1, 0, 0, 6.1, 0, 0, 6.8, 0);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    gauge.add(new THREE.LineSegments(g, blueprintLineMaterial(0.45)));
  }

  // soft glow at the core that brightens as the camera flies through
  const glowMat = new THREE.ShaderMaterial({
    uniforms: { uI: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uI; varying vec2 vUv; void main(){ float d = length(vUv - 0.5) * 2.0; float g = pow(max(0.0, 1.0 - d), 3.0); gl_FragColor = vec4(vec3(1.0) * g * uI, g * uI); }',
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), glowMat);
  glow.position.z = -0.5;
  scene.add(glow);

  // a label per ring, pinned to a point on the ring's (non-spinning) holder
  const callouts = rings.map(({ def }, i) => ({
    text: `R ${def.r.toFixed(2)}  ·  SEG ${String(def.n).padStart(2, '0')}  ·  T ${Math.round((Math.PI * 2 * (def.r + def.w / 2)) / TOOTH)}`,
    cls: 'tag',
    local: new THREE.Vector3(Math.cos(0.75) * (def.r + def.w / 2), Math.sin(0.75) * (def.r + def.w / 2), 0),
    anchor: new THREE.Vector3(),
    offset: [[60, -30], [90, -80], [-110, 40]][i],
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
    rings.forEach(({ def, holder, spin }, i) => {
      spin.rotation.z = time * def.speed + local * def.speed * 25;
      // the tilted rings slowly precess so the gyroscope reads as 3D; they flatten for the fly-through
      holder.rotation.x = def.tilt[0] * (1 - fly * 0.85) + Math.sin(time * 0.3 + i) * 0.08;
      holder.rotation.y = def.tilt[1] * (1 - fly * 0.85) + (i ? time * 0.12 : 0);
      holder.rotation.z = def.tilt[2] + Math.cos(time * 0.25 + i) * 0.05;
      holder.updateMatrixWorld();
    });
    coreA.rotation.set(time * 0.5, time * 0.35, 0);
    coreB.rotation.set(-time * 0.3, -time * 0.45, time * 0.2);
    core.scale.setScalar(lerp(0.4, 1, assemble));
    gauge.rotation.z = -time * 0.03;
    gauge.scale.setScalar(lerp(1.3, 1, assemble));

    shellMat.uniforms.uTime.value = time;
    shellMat.uniforms.uScan.value = ((time * 0.35) % 1.6) * 8 - 5;
    glowMat.uniforms.uI.value = 0.25 + fly * fly * 1.1;

    callouts.forEach((c, i) => {
      c.anchor.copy(c.local).applyMatrix4(rings[i].holder.matrixWorld);
      c.visible = assemble > 0.85 && fly < 0.25;
    });

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
