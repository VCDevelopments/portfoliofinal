// Chapter 1 — portfolio: each project is an object frozen inside a drifting ice block.
// Callouts name it; clicking the block opens the repository.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { fbm3, rng } from './noise.js';
import { getTextures, crackTexture } from './textures.js';
import { PROJECTS } from './projects.js';
import { openExternal } from './links.js';

const BG = 0xb6b9bf;
const SPACING = 15;

const ITEMS = PROJECTS.map((p, i) => ({ ...p, code: `PROJECT_${String(i + 1).padStart(2, '0')}`, side: i % 2 ? 1 : -1 })); // crystal sits on this side, the overview card on the other

// A chunk of ice: noisy body with several cleavage planes sliced off, giving flat cut faces
// with softened edges. Smooth normals + spherical UVs for the frost maps.
function crystalGeometry(seed) {
  let g = new THREE.IcosahedronGeometry(1, 32);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g);
  const r = rng(seed * 97 + 5);
  const planes = Array.from({ length: 13 }, () => {
    const n = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
    return { n, d: 1.15 + r() * 0.45 };
  });
  const p = g.attributes.position;
  const uv = new Float32Array(p.count * 2);
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    uv[i * 2] = Math.atan2(v.z, v.x) / (Math.PI * 2) + 0.5;
    uv[i * 2 + 1] = Math.acos(v.y) / Math.PI;
    const ridge = 1 - Math.abs(fbm3(v.x * 3 + seed, v.y * 3, v.z * 3, 3));
    const micro = fbm3(v.x * 9 - seed, v.y * 9, v.z * 9 + seed, 3) * 0.012; // fine chips and pits
    const radius = 1.55 * (1 + fbm3(v.x * 1.3 + seed, v.y * 1.3, v.z * 1.3 - seed, 4) * 0.3 + ridge * ridge * 0.06 + micro);
    v.multiplyScalar(radius);
    for (const pl of planes) {
      const excess = v.dot(pl.n) - pl.d;
      if (excess > 0) v.addScaledVector(pl.n, -excess * 0.92);
    }
    v.y *= 1.35;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// Tiny trapped air bubbles, biased toward the core.
function bubbles(seed, count = 520, size = 0.03) {
  const r = rng(seed);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u), rad = Math.pow(r(), 0.7) * 1.05;
    pos.set([s * Math.cos(a) * rad, u * rad * 1.4, s * Math.sin(a) * rad], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size, transparent: true, opacity: 0.75, depthWrite: false }));
}

const coord = (r) => `${r() < 0.5 ? '-' : '+'}${(r() * 9).toFixed(0)}${String.fromCharCode(97 + Math.floor(r() * 26))}${(r() * 99).toFixed(0)},${(r() * 9).toFixed(1)}`;

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
  const picGeo = new THREE.PlaneGeometry(1.95, 1.3);
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xeef4fb,
    roughness: 0.2,
    roughnessMap: tex.iceRough,
    normalMap: tex.iceNormal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    transmission: 1,
    thickness: 2.6,
    ior: 1.31,
    dispersion: 1.4,
    iridescence: 0.3,
    iridescenceIOR: 1.3,
    attenuationColor: new THREE.Color(0x8db0d2),
    attenuationDistance: 3.2,
    clearcoat: 0.7,
    clearcoatRoughness: 0.12,
    specularIntensity: 1,
    envMapIntensity: 1.5,
  });
  const frostMat = new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 1, alphaMap: tex.frostAlpha, transparent: true, opacity: 0.55, depthWrite: false });
  const crackGeo = new THREE.PlaneGeometry(1.8, 1.8);
  const crackMats = [3, 8, 21].map((seed) => new THREE.MeshBasicMaterial({ map: crackTexture(seed), transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  const crystals = ITEMS.map((item, i) => {
    const group = new THREE.Group();
    group.position.set(0, -i * SPACING, 0);
    const geo = crystalGeometry(i * 3.7 + 1);
    const ice = new THREE.Mesh(geo, iceMat);
    // white frost settling on part of the surface
    const frost = new THREE.Mesh(geo, frostMat.clone());
    frost.scale.setScalar(1.006);
    frost.renderOrder = 2;
    // internal fractures + bubbles
    const cracks = new THREE.Group();
    for (let k = 0; k < 5; k++) {
      const c = new THREE.Mesh(crackGeo, crackMats[(i + k) % crackMats.length].clone());
      c.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
      c.position.set((rand() - 0.5) * 0.6, (rand() - 0.5) * 0.9, (rand() - 0.5) * 0.6);
      c.scale.setScalar(0.8 + rand() * 0.6);
      cracks.add(c);
    }
    // the project's picture frozen in the ice, always turned toward the viewer
    const map = loader.load(item.image);
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
    group.add(ice, inner, frost, cracks, bubbles(40 + i), bubbles(70 + i, 60, 0.07));
    scene.add(group);
    return { item, group, ice, inner, frame, pic, frost, cracks, h: 0, hv: 0 };
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
    const r = rng(100 + i);
    c.callouts = [
      { text: `${c.item.code}\n${c.item.name}`, local: new THREE.Vector3(-0.5, 1.9, 0.6), offset: [-90, -70] },
      { text: `TEMP ${(-30 - r() * 8).toFixed(1)}\n${coord(r)}`, local: new THREE.Vector3(0.9, -1.4, 0.7), offset: [70, 30] },
    ].map((o) => ({ ...o, anchor: new THREE.Vector3(), visible: false }));
    callouts.push(...c.callouts);
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const qInv = new THREE.Quaternion();
  const toCam = new THREE.Vector3();
  const state = { active: -1 };

  function update(local, ctx) {
    const { time, mouse } = ctx;
    // crystal i sits centred in the frame at local = (i + 0.5) / ITEMS.length
    const camY = SPACING * 0.5 - local * SPACING * ITEMS.length;
    blendBackground(camY);
    const sway = Math.sin(local * Math.PI * ITEMS.length) * 0.7;
    camera.position.set(sway + mouse.x * 0.8, camY + mouse.y * 0.5, 10.5);
    // on wide screens the crystal moves aside to make room for the overview card
    const offset = camera.aspect > 1.1 ? 2.3 : 0;
    camera.lookAt(sway * 0.3, camY, 0);

    camera.updateMatrixWorld();

    // pointer: hovering a block brightens it, clicking opens its repository
    let hovered = null;
    if (ctx.pointer.inside) {
      raycaster.setFromCamera(ndc.set(ctx.pointer.x, ctx.pointer.y), camera);
      const hit = raycaster.intersectObjects(crystals.flatMap((c) => [c.ice, c.pic]), false)[0];
      hovered = hit && crystals.find((c) => c.ice === hit.object || c.pic === hit.object);
      if (hovered && Math.abs(hovered.group.position.y - camY) > 4.2) hovered = null;
    }
    if (hovered) {
      ctx.cursor = true;
      if (ctx.click) openExternal(hovered.item.url);
    }

    state.active = -1;
    crystals.forEach((c, i) => {
      c.group.position.x = c.item.side * offset;
      c.group.rotation.y = Math.sin(time * 0.2 + i * 2) * 0.5 + local * 3 + mouse.x * 0.3;
      c.group.rotation.x = Math.sin(time * 0.3 + i) * 0.12 + mouse.y * 0.15;
      c.group.rotation.z = Math.sin(time * 0.25 + i * 2) * 0.08;
      // undo the crystal's spin so the picture faces the camera, with a slight lean
      c.inner.quaternion.copy(qInv.copy(c.group.quaternion).invert()).multiply(camera.quaternion);
      c.inner.rotateY(Math.sin(time * 0.4 + i) * 0.12 * (1 - Math.min(1, c.h)));
      // hover: the block swells slightly on a spring
      c.hv += ((hovered === c ? 1 : 0) - c.h) * 90 * ctx.dt - c.hv * 10 * ctx.dt;
      c.h += c.hv * ctx.dt;
      // hover: the block swells, frost and cracks clear, and the picture slides out toward the viewer
      const h = Math.max(0, c.h);
      c.group.scale.setScalar(1 + h * 0.16);
      c.group.updateMatrixWorld();
      c.frost.material.opacity = 0.55 * (1 - Math.min(1, h));
      c.cracks.children.forEach((m) => { m.material.opacity = 0.55 * (1 - Math.min(1, h)); });
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
        o.visible = active;
      }
    });
  }

  return { scene, camera, update, callouts, state };
}
