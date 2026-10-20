// Chapter 0 — snowy valley with the VCDevelopments logo as a glowing neon outline. On load a wireframe of
// the logo draws in large and spinning, then compacts down onto the neon logo. Every few seconds a
// blueprint scan sweeps up the logo, briefly showing its wireframe, grid and measurements.
// Hovering makes the wireframe flex out around the logo; clicking bursts it into particles that reassemble.
import * as THREE from 'three';
import { fbm3, smoothstep, lerp, easeInOut, easeOut, rng } from './noise.js';
import { getTextures } from './textures.js';
import { createShatter, SHATTER_DURATION } from './shatter.js';
import { FULL, MARK, neonMaterial } from './neonLogo.js';

const BG = 0x9a9ea6;

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

  const sky = new THREE.HemisphereLight(0xdfe5ee, 0x40444b, 0.75);
  scene.add(sky);
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
  // wide screens get the full logo (the mark and "developments"), scaled to span about 15 m of the valley
  // and centred; portrait screens keep the mark alone, as before
  const LOGO_SIGN = FULL && innerWidth > innerHeight ? FULL : MARK;
  const { minX, maxX, W, H, center } = LOGO_SIGN.bounds;
  const SIGN = LOGO_SIGN.wide ? 15 / W : 1;
  const monument = new THREE.Group();
  monument.scale.setScalar(SIGN);
  monument.position.set(LOGO_SIGN.wide ? -center.x * SIGN : 0, base, 0);
  monument.rotation.y = -0.12;
  scene.add(monument);

  const scanU = { uScan: { value: -100 }, uTime: { value: 0 } };
  const snowMat = snowBlockMaterial(tex, scanU);

  // the neon logo; it pivots around its own centre
  const solid = new THREE.Group();
  solid.position.copy(center);
  const neonGeos = LOGO_SIGN.geometries();
  // a light source: not fogged (the intro fog would hide its farther tubes first), it fades in whole instead
  const neonMat = neonMaterial({ fog: false, transparent: true, opacity: 0 });
  solid.add(...neonGeos.map((g) => new THREE.Mesh(g, neonMat)));
  monument.add(solid);

  // night mode (the Night switch): the valley goes dark, the neon burns brighter and lights the snow
  // around it, with a short flicker as it switches
  const DAY_BG = new THREE.Color(BG), NIGHT_BG = new THREE.Color(0x0a0e15);
  const DAY_NEON = neonMat.color.clone(), NIGHT_NEON = new THREE.Color(1.5, 3.1, 5.4);
  const glow = new THREE.PointLight(0x7cc4ff, 0, 20, 1.4);
  glow.position.set(center.x, center.y, 1.6);
  monument.add(glow);
  let night = 0, nightTarget = 0, flickerStart = -Infinity;
  function setNight(on, instant = false) {
    nightTarget = on ? 1 : 0;
    if (instant) night = nightTarget;
    else flickerStart = performance.now();
  }

  // click: the outline bursts into sparks that land back bottom-up, the neon growing behind them
  const shatter = createShatter(neonGeos, { count: LOGO_SIGN.wide ? 11000 : 6000, spread: 2.4, size: 110, color: new THREE.Color(0.85, 0.97, 1) });
  shatter.points.position.copy(center);
  monument.add(shatter.points);
  neonMat.clippingPlanes = [shatter.plane];

  // soft contact shadow where the logo meets the snow
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
  for (const x of LOGO_SIGN.feet) {
    const drift = new THREE.Mesh(driftGeometry(0.75), snowMat);
    drift.position.x = x;
    drift.scale.set(1, 1, 0.55);
    monument.add(drift);
  }

  // wireframe of the same logo: draws in bottom-up, glows in the scan band, flexes on hover
  const wireMat = new THREE.ShaderMaterial({
    uniforms: { uDraw: { value: -10 }, uA: { value: 0 }, uScan: scanU.uScan },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uDraw; varying float vLocalY; varying float vY;
      void main(){ vLocalY = position.y + ${center.y.toFixed(3)}; vec4 w = modelMatrix * vec4(position, 1.0); vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uDraw, uA, uScan; varying float vLocalY; varying float vY;
      void main(){
        float on = 1.0 - smoothstep(uDraw - 0.2, uDraw, vLocalY);
        float edge = exp(-pow((vLocalY - uDraw) * 7.0, 2.0)) * step(uDraw, ${(H + 0.2).toFixed(3)});
        float band = exp(-pow((vY - uScan) * 2.2, 2.0));
        float a = max(uA * (on * 0.85 + edge * 1.2), band * 0.95);
        gl_FragColor = vec4(vec3(0.75, 1.25, 2.1) * a, a);
      }`,
  });
  const wire = new THREE.Group();
  wire.position.copy(center);
  wire.add(new THREE.LineSegments(LOGO_SIGN.wire(), wireMat));
  monument.add(wire);

  // faint construction lines flickering around the wireframe while it loads
  const rand = rng(7);
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

  // invisible proxy the pointer is tested against
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, H + 0.4, 1.6), new THREE.MeshBasicMaterial());
  proxy.position.copy(center);
  proxy.visible = false;
  monument.add(proxy);
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hover = 0, hoverV = 0, pulseT = -10;

  // falling snow
  const SN = 1800;
  const snowPos = new Float32Array(SN * 3);
  const snowVel = new Float32Array(SN * 3); // pushes from the cursor and gusts, damped back to still
  const flake = new THREE.Vector3(), camRight = new THREE.Vector3(), camUp = new THREE.Vector3();
  let gust = 0, gustDir = 1;
  for (let i = 0; i < SN; i++) {
    snowPos[i * 3] = (rand() - 0.5) * 50;
    snowPos[i * 3 + 1] = rand() * 20;
    snowPos[i * 3 + 2] = (rand() - 0.5) * 50;
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  scene.add(new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0.8, depthWrite: false })));

  // blueprint annotations: rotating polar grid under the logo, plus width and height dimensions
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
  const callouts = [
    { text: `W ${W.toFixed(2)} M`, cls: 'tag', local: new THREE.Vector3(center.x, 0.02, 2.2), offset: [20, 26] },
    { text: `H ${H.toFixed(2)} M`, cls: 'tag', local: new THREE.Vector3(minX - 0.9, H * 0.5, 0), offset: [-24, -10] },
    { text: `VCD // MONUMENT_01\nLOGO 28${LOGO_SIGN.wide ? ' · FULL' : ''}`, local: new THREE.Vector3(maxX - 0.4, H * 0.85, 0), offset: [90, -60] },
  ].map((c) => ({ ...c, anchor: new THREE.Vector3(), visible: false }));

  function update(local, ctx) {
    const { time, dt, mouse, intro } = ctx;
    const t = easeInOut(local);
    const T = ctx.introT;

    // intro timeline: draw in large and spinning -> compact onto the logo -> solid emerges
    const compact = easeInOut(smoothstep(1.2, 2.6, T));
    const reveal = easeInOut(smoothstep(2.1, 3.4, T));
    const snap = Math.exp(-Math.pow((T - 2.6) * 5, 2)); // flash as it locks into place

    // blueprint scan: every 7 s after the intro, a band sweeps from the base to above the top,
    // and the grid, dimensions and labels show while it runs
    const sinceIntro = T - 4;
    const ph = sinceIntro > 0 ? sinceIntro % 7 : -1;
    scanU.uScan.value = ph >= 0 && ph < 2.6 ? base + lerp(-0.4, H + 0.8, ph / 2.6) : -100;
    const hudOn = ph >= 0 ? smoothstep(0, 0.4, ph) * (1 - smoothstep(2.4, 3.4, ph)) : 0;

    scene.fog.density = lerp(0.35, 0.013, reveal);
    night += (nightTarget - night) * (1 - Math.exp(-dt * 3));
    scene.background.lerpColors(DAY_BG, NIGHT_BG, night);
    scene.fog.color.copy(scene.background);
    sky.intensity = lerp(0.75, 0.08, night);
    sun.intensity = lerp(1.9, 0.1, night);
    scene.environmentIntensity = lerp(0.35, 0.06, night);
    neonMat.color.lerpColors(DAY_NEON, NIGHT_NEON, night);
    const flicker = performance.now() - flickerStart < 650 && Math.random() < 0.4 ? 0.25 : 1;
    neonMat.opacity = reveal * flicker;
    glow.intensity = night * 45 * neonMat.opacity;

    // slow orbit that settles as the scene appears
    const orbit = (1 - reveal) * 0.55;
    if (LOGO_SIGN.wide) {
      // settle at the distance where the whole sign fits with room at the sides
      const fitDist = (W * SIGN * 1.3) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
      const signY = H * SIGN * 0.55;
      const cx = lerp(0, 1.2, t) + mouse.x * 0.9, cz = lerp(Math.max(24, fitDist * 1.35), Math.max(11, fitDist), t);
      camera.position.set(cx * Math.cos(orbit) - cz * Math.sin(orbit), base + lerp(6.6, signY + 1.6, t) + mouse.y * 0.45 + (1 - reveal) * 2, cx * Math.sin(orbit) + cz * Math.cos(orbit));
      camera.lookAt(0, base + lerp(3.0, signY + 0.5, t), 0);
    } else {
      // portrait screens: step back so the logo keeps breathing room at the sides
      const fit = camera.aspect < 1 ? 1 + (1 - camera.aspect) * 0.5 : 1;
      const cx = (lerp(0, 2.6, t) + mouse.x * 0.9) * fit, cz = lerp(30, 12.5, t) * fit;
      camera.position.set(cx * Math.cos(orbit) - cz * Math.sin(orbit), base + lerp(6.6, 4.0, t) + mouse.y * 0.45 + (1 - reveal) * 2, cx * Math.sin(orbit) + cz * Math.cos(orbit));
      camera.lookAt(0, base + lerp(3.0, 2.6, t), 0);
    }
    camera.updateMatrixWorld();
    monument.updateMatrixWorld();

    // pointer: hover flexes the wireframe out around the logo, a click bursts it into particles
    let hovering = false;
    if (ctx.pointer.inside && intro > 0.9 && local < 0.95) {
      raycaster.setFromCamera(ndc.set(ctx.pointer.x, ctx.pointer.y), camera);
      if (raycaster.intersectObject(proxy, false)[0]) {
        hovering = true;
        if (ctx.click && shatter.trigger(time)) pulseT = time + SHATTER_DURATION - 0.2; // the wireframe flashes as it locks back together
      }
    }
    // a click anywhere else sends a gust through the valley, away from where you clicked
    if (ctx.click && !hovering && intro > 0.9) {
      gust = 1;
      gustDir = ctx.pointer.x > 0 ? -1 : 1;
    }
    ctx.cursor ||= hovering;
    hoverV += ((hovering ? 1 : 0) - hover) * 70 * dt - hoverV * 9 * dt;
    hover += hoverV * dt;
    const pulse = Math.exp(-(time - pulseT) * 3.5) * (time >= pulseT ? 1 : 0);

    const whole = shatter.update(time, ctx); // 0 while the logo is in pieces, back to 1 as it rebuilds
    wireMat.uniforms.uDraw.value = lerp(-0.3, H + 0.3, smoothstep(0.1, 1.4, T));
    const introA = smoothstep(0, 0.3, T) * (1 - smoothstep(2.9, 3.6, T));
    wireMat.uniforms.uA.value = Math.min(1.6, introA + snap * 0.8 + Math.max(0, hover) * 0.55 * whole + pulse);
    wire.scale.setScalar(lerp(1.9, 1, compact) + Math.max(0, hover) * 0.07 + pulse * 0.28);
    wire.rotation.y = (1 - compact) * 2.6 + Math.sin(time * 1.3) * 0.02 * hover;
    wire.visible = (wireMat.uniforms.uA.value > 0.002 || scanU.uScan.value > -50) && whole >= 1; // no wireframe or scan lines until it has rebuilt
    guideMat.opacity = smoothstep(0.2, 0.6, T) * (1 - smoothstep(1.6, 2.6, T)) * (0.22 + 0.13 * Math.sin(T * 40));
    guides.visible = guideMat.opacity > 0.001;

    // the solid settles in with a tiny overshoot as the wire locks on
    solid.scale.setScalar(lerp(0.92, 1, easeOut(smoothstep(2.3, 3.0, T))) + pulse * 0.03);

    scanU.uTime.value = time;
    hud.visible = hudOn > 0.01;
    hudMat.opacity = hudOn * 0.55;
    tickMat.opacity = hudOn * 0.8;
    grid.rotation.y = time * 0.05;

    // falling snow; flakes near the cursor drift away from it (in screen space), gusts blow sideways
    camRight.setFromMatrixColumn(camera.matrixWorld, 0);
    camUp.setFromMatrixColumn(camera.matrixWorld, 1);
    const pushing = ctx.pointer.inside && !ctx.reduced;
    const damp = Math.exp(-dt * 1.6);
    gust *= Math.exp(-dt * 1.1);
    for (let i = 0; i < SN; i++) {
      const k = i * 3;
      let vx = snowVel[k] * damp, vy = snowVel[k + 1] * damp, vz = snowVel[k + 2] * damp;
      if (pushing) {
        flake.set(snowPos[k], snowPos[k + 1], snowPos[k + 2]).project(camera);
        const dx = (flake.x - ctx.pointer.x) * camera.aspect, dy = flake.y - ctx.pointer.y;
        const d = Math.hypot(dx, dy);
        if (flake.z < 1 && d < 0.16 && d > 1e-4) {
          const f = (1 - d / 0.16) * 14 * dt / d;
          vx += (camRight.x * dx + camUp.x * dy) * f;
          vy += (camRight.y * dx + camUp.y * dy) * f;
          vz += (camRight.z * dx + camUp.z * dy) * f;
        }
      }
      if (gust > 0.01) {
        const g = gust * gustDir * (0.6 + (i % 5) * 0.15) * 22 * dt;
        vx += camRight.x * g; vz += camRight.z * g; vy += gust * 1.5 * dt;
      }
      snowVel[k] = vx; snowVel[k + 1] = vy; snowVel[k + 2] = vz;
      let x = snowPos[k] + vx * dt + Math.sin(time * 0.6 + i) * dt * 0.15;
      let y = snowPos[k + 1] + vy * dt - dt * (0.6 + (i % 7) * 0.08);
      let z = snowPos[k + 2] + vz * dt;
      if (y < 0) y += 20;
      if (y > 20) y -= 20;
      if (x > 25) x -= 50; else if (x < -25) x += 50; // blown out one side, back in the other
      if (z > 25) z -= 50; else if (z < -25) z += 50;
      snowPos[k] = x; snowPos[k + 1] = y; snowPos[k + 2] = z;
    }
    snowGeo.attributes.position.needsUpdate = true;

    for (const c of callouts) {
      c.anchor.copy(c.local).applyMatrix4(monument.matrixWorld);
      c.visible = hudOn > 0.5 && local < 0.6;
    }
  }

  return { scene, camera, update, callouts, setNight };
}
