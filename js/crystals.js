// Chapter 1 — portfolio: each project's case-study video (its device drawn as a blueprint, powering on
// into the working demo) plays on a floating panel as the visitor arrives at it. Callouts name it;
// clicking the panel opens the project's pop-up, where the demo itself can be tried.
import * as THREE from 'three';
import { rng } from './noise.js';
import { PROJECTS, slugOf } from './projects.js';
import { t, dateLabel, agoLabel } from './i18n.js';
import { activityOf } from './activity.js';
import { roundedRect } from './devices.js';

const BG = 0xb6b9bf;
const SPACING = 15;
const ITEMS = PROJECTS.map((p, i) => ({ ...p, code: `PROJECT_${String(i + 1).padStart(2, '0')}`, side: i % 2 ? 1 : -1 })); // the video sits on this side, the overview card on the other

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
  // each project's case-study video (tools/record-reels.mjs) on a 4:5 panel: it plays from the start as
  // the visitor arrives at the project and pauses when they move on; its poster shows until it plays
  const loader = new THREE.TextureLoader();
  const pictures = []; // resolve once each poster has loaded
  const maps = [];
  const PANEL_H = 4.3, PANEL_W = PANEL_H * 0.8;
  const panelGeo = roundedRect(PANEL_W, PANEL_H, 0.14);
  const frameGeo = roundedRect(PANEL_W + 0.05, PANEL_H + 0.05, 0.16);
  const shadowGeo = roundedRect(PANEL_W * 0.96, PANEL_H * 0.96, 0.3);
  const crystals = ITEMS.map((item, i) => {
    const slug = slugOf(item);
    let loaded;
    pictures.push(new Promise((res) => { loaded = res; }));
    const poster = loader.load(`videos/${slug}-poster.jpg`, loaded, undefined, loaded);
    poster.colorSpace = THREE.SRGBColorSpace;
    maps.push(poster);
    const video = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, preload: 'none' });
    video.setAttribute('playsinline', ''); // iOS plays it in place, muted, without a tap
    video.src = `videos/${slug}-web.mp4`;
    const footage = new THREE.VideoTexture(video);
    footage.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: poster, toneMapped: false, color: 0xebebeb });
    video.addEventListener('playing', () => { material.map = footage; material.needsUpdate = true; }, { once: true });
    const group = new THREE.Group();
    const panel = new THREE.Mesh(panelGeo, material);
    // a hairline frame, and a soft shadow behind, so the panel sits in the scene
    const frame = new THREE.Mesh(frameGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false }));
    frame.position.z = -0.005;
    const shadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ color: 0x05060a, transparent: true, opacity: 0.35, depthWrite: false }));
    shadow.position.set(0.12, -0.22, -0.5);
    group.add(shadow, frame, panel);
    group.position.set(0, -i * SPACING, 0);
    scene.add(group);
    return { item, group, panel, material, video, size: new THREE.Vector3(PANEL_W, PANEL_H, 0.1), playing: false, h: 0, hv: 0, near: 0 };
  });
  // play the video of the project in view (only while this chapter is on screen), restarting on arrival
  let chapterOn = false;
  function playVideos() {
    for (const c of crystals) {
      const want = chapterOn && c.near > 0.5;
      if (want === c.playing) continue;
      c.playing = want;
      if (want) {
        c.video.currentTime = 0;
        c.video.play().catch(() => { c.playing = false; });
      } else c.video.pause();
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
      // live timer under the video: time spent on the project so far
      // (above it on narrow screens, where the project card covers the bottom)
      { text: '', cls: 'timer', center: true, live: true, since: startOf(c.item), local: new THREE.Vector3(0, -c.size.y * 0.5 - 0.45, 0), above: c.size.y * 0.5 + 0.35, offset: [0, 0] },
    ].map((o) => ({ ...o, anchor: new THREE.Vector3(), visible: false }));
    callouts.push(...c.callouts);
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const state = { active: -1 };

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
    camera.lookAt(Math.sin(swing) * dist * 0.25, camY, 0);

    camera.updateMatrixWorld();
    blendBackground(camY, offset, time);

    // pointer: hovering a video brings it forward a little, clicking opens the project's pop-up
    let hovered = null;
    if (ctx.pointer.inside) {
      raycaster.setFromCamera(ndc.set(ctx.pointer.x, ctx.pointer.y), camera);
      const hit = raycaster.intersectObjects(crystals.map((c) => c.panel), false)[0];
      hovered = hit && crystals.find((c) => c.panel === hit.object);
      if (hovered && Math.abs(hovered.group.position.y - camY) > 4.2) hovered = null;
    }
    if (hovered) {
      ctx.cursor = true;
      if (ctx.click) ctx.openProject(crystals.indexOf(hovered));
    }

    // portrait screens: the overview card covers the lower half, so the video sits smaller and higher
    const portrait = camera.aspect < 0.8, fit = portrait ? 0.68 : 1, lift = portrait ? 1.15 : 0;
    state.active = -1;
    crystals.forEach((c, i) => {
      // panels well out of frame skip rendering entirely
      c.group.visible = Math.abs(c.group.position.y - camY) < SPACING * 0.85;
      c.group.position.x = c.item.side * offset;
      // hover springs in: the panel turns to face the viewer, grows a little and brightens
      c.hv += ((hovered === c ? 1 : 0) - c.h) * 90 * ctx.dt - c.hv * 10 * ctx.dt;
      c.h += c.hv * ctx.dt;
      const h = THREE.MathUtils.clamp(c.h, 0, 1.2);
      const loose = (ctx.reduced ? 0 : 1) * (1 - Math.min(1, h)); // reduced motion: panels hold still; hovered ones too
      const pass = THREE.MathUtils.clamp((c.group.position.y - camY) / SPACING, -1, 1); // -1 above … 1 below
      c.group.rotation.y = (Math.sin(time * 0.2 + i * 2) * 0.12 + mouse.x * 0.15 + pass * 0.7) * loose; // turns as it passes
      c.group.rotation.x = (Math.sin(time * 0.3 + i) * 0.06 + mouse.y * 0.1) * loose;
      c.group.rotation.z = Math.sin(time * 0.25 + i * 2) * 0.03 * loose;
      c.group.position.y = -i * SPACING + lift + Math.sin(time * 0.5 + i) * 0.08 * loose; // floats gently
      c.group.scale.setScalar(fit * (1 + h * 0.04));
      c.material.color.setScalar(0.92 + Math.min(1, h) * 0.08);

      // how settled in front of the camera it is: the video plays once it is
      c.near = THREE.MathUtils.clamp((2.6 - Math.abs(c.group.position.y - camY)) / 1, 0, 1);

      const active = Math.abs(c.group.position.y - camY) < 4.2;
      if (Math.abs(c.group.position.y - camY) < SPACING * 0.3) state.active = i;
      for (const o of c.callouts) {
        // anchors follow the crystal's position, not its spin, so labels stay readable
        o.anchor.copy(o.local).add(c.group.position);
        if (o.above && camera.aspect < 0.8) o.anchor.y = c.group.position.y + o.above;
        if (o.since) o.text = `${t('timeInvested')}\n${elapsed(Date.now() - o.since)}`;
        if (o.started) o.text = startedText(o.started);
        o.visible = active;
      }
    });
    playVideos();
  }

  // `pictures`: the loaded posters, so they can be uploaded to the GPU before the first scroll reaches them
  const ready = Promise.all(pictures).then(() => maps);
  // `setActive(on)`: whether this chapter is on screen at all; off, every video pauses
  const setActive = (on) => { if (on !== chapterOn) { chapterOn = on; playVideos(); } };
  return { scene, camera, update, callouts, state, ready, setActive };
}
