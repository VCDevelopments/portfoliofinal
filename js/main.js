// Orchestrates the four chapters: scroll progress -> chapter cameras -> composite with transitions.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createHero } from './hero.js';
import { createCrystals } from './crystals.js';
import { createRings } from './rings.js';
import { createParticles } from './particles.js';
import { LINKS, PROJECTS } from './projects.js';
import { createComposite } from './post.js';
import { UI } from './ui.js';
import { Sound } from './audio.js';
import { clamp01, easeOut } from './noise.js';

// chapter i occupies scroll progress BOUNDS[i]..BOUNDS[i+1]; transitions straddle each boundary
const BOUNDS = [0, 0.13, 0.66, 0.81, 1];
const TW = 0.028;

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.82;

const ui = new UI();
const sound = new Sound();
const composite = createComposite(renderer);
// yield so the loader can paint; a timer (not rAF) keeps booting in background tabs
const frame = () => new Promise((r) => setTimeout(r, 16));

// pointer: raw NDC for raycasting; click: true for one frame; cursor: set by chapters that want a pointer cursor
const ctx = { time: 0, dt: 0, mouse: { x: 0, y: 0 }, pointer: { x: 0, y: 0, inside: false }, click: false, cursor: false, intro: 0, introT: 0, pixelRatio: 1, height: 1 };
const mouseTarget = { x: 0, y: 0 };
let chapters = [];

function resize() {
  const w = innerWidth, h = innerHeight;
  if (!w || !h) return; // hidden/zero-size viewport would give NaN aspect
  const pr = Math.min(devicePixelRatio, 1.75);
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h, false);
  composite.setSize(Math.floor(w * pr), Math.floor(h * pr));
  ui.setSize(w, h);
  ctx.pixelRatio = pr;
  ctx.height = h;
  for (const c of chapters) {
    c.camera.aspect = w / h;
    // keep subjects framed on portrait screens
    c.camera.fov = (c.baseFov ??= c.camera.fov) * (w < h ? 1.45 : 1);
    c.camera.updateProjectionMatrix();
  }
}

function resolve(p) {
  let i = 0;
  while (i < BOUNDS.length - 2 && p >= BOUNDS[i + 1]) i++;
  const local = (k) => clamp01((p - BOUNDS[k]) / (BOUNDS[k + 1] - BOUNDS[k]));
  const last = BOUNDS.length - 2;
  if (i < last && p > BOUNDS[i + 1] - TW) return { a: i, b: i + 1, mix: (p - (BOUNDS[i + 1] - TW)) / (2 * TW), local };
  if (i > 0 && p < BOUNDS[i] + TW) return { a: i - 1, b: i, mix: (p - (BOUNDS[i] - TW)) / (2 * TW), local };
  return { a: i, b: -1, mix: 0, local };
}

async function boot() {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const builders = [createHero, createCrystals, createRings, createParticles];
  for (let i = 0; i < builders.length; i++) {
    await frame();
    chapters.push(builders[i](env));
    ui.setProgress((i + 1) / (builders.length + 1));
  }
  resize();
  // pre-compile shaders so the first transition doesn't hitch
  for (const c of chapters) {
    c.update(0, ctx);
    await renderer.compileAsync(c.scene, c.camera);
  }
  ui.setProgress(1);

  const particles = chapters[3];
  ui.buildCarousel(LINKS, (i) => {
    particles.setShape(i, ctx.time);
    sound.blip(i % 2 ? 1320 : 990);
  });
  ui.bindSound(() => sound.toggle());

  await new Promise((r) => setTimeout(r, 350));
  document.body.classList.add('is-intro');
  ui.finishLoading();
  scrollTo(0, 0);
  introStart = performance.now();
  requestAnimationFrame(loop);
}

let introStart = 0;
let progress = 0, prevProgress = 0, last = performance.now();

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  ctx.dt = dt;
  ctx.time += dt;
  ctx.introT = (now - introStart) / 1000;
  ctx.intro = easeOut(clamp01((ctx.introT - 1.5) / 1.7));
  // HUD waits for the scene to emerge, then decodes in
  if (ctx.introT > 2.3 && document.body.classList.contains('is-intro')) {
    document.body.classList.remove('is-intro');
    ui.chapter = -1;
  }

  const max = document.documentElement.scrollHeight - innerHeight;
  const target = max > 0 ? scrollY / max : 0;
  progress += (target - progress) * (1 - Math.exp(-dt * 4.5));
  const velocity = (progress - prevProgress) / Math.max(dt, 1e-3);
  prevProgress = progress;
  sound.setVelocity(velocity);

  const k = 1 - Math.exp(-dt * 3);
  ctx.mouse.x += (mouseTarget.x - ctx.mouse.x) * k;
  ctx.mouse.y += (mouseTarget.y - ctx.mouse.y) * k;

  ctx.cursor = false;
  const { a, b, mix, local } = resolve(progress);
  const draw = (idx, rt) => {
    const c = chapters[idx];
    c.update(local(idx), ctx);
    renderer.setRenderTarget(rt);
    renderer.render(c.scene, c.camera);
  };
  draw(a, composite.rtA);
  if (b >= 0) draw(b, composite.rtB);

  const current = b >= 0 && mix >= 0.5 ? b : a;
  updateCards(current === 1 ? chapters[1].state.active : -1);
  ui.setChapter(current);
  const calloutAlpha = b >= 0 ? Math.abs(mix - 0.5) * 2 : 1;
  chapters.forEach((c, i) => ui.drawCallouts(c.callouts, c.camera, i === current ? calloutAlpha : 0));

  composite.render(b >= 0 ? mix : 0, ctx.time, Math.min(0.01, Math.abs(velocity) * 0.04));
  document.body.classList.toggle('is-grab', ctx.cursor);
  ctx.click = false;
}

addEventListener('resize', resize);
addEventListener('pointermove', (e) => {
  mouseTarget.x = (e.clientX / innerWidth) * 2 - 1;
  mouseTarget.y = -((e.clientY / innerHeight) * 2 - 1);
  ctx.pointer.x = mouseTarget.x;
  ctx.pointer.y = mouseTarget.y;
  ctx.pointer.inside = true;
});
document.documentElement.addEventListener('pointerleave', () => { ctx.pointer.inside = false; });
addEventListener('pointerdown', (e) => {
  if (!e.target.closest('a, button')) ctx.click = true;
});

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
boot();

// overview card beside each ice block; the crystal scene reports which block is in view
const cards = PROJECTS.map((p, i) => {
  const el = document.createElement('article');
  el.className = `project-card ${i % 2 ? 'left' : 'right'}`;
  el.innerHTML = `<span class="num">PROJECT ${String(i + 1).padStart(2, '0')} / ${String(PROJECTS.length).padStart(2, '0')}</span>
    <img alt="" loading="lazy" />
    <h3></h3><p></p><span class="stack"></span>
    <a target="_blank" rel="noopener" tabindex="-1">View on GitHub ↗</a>`;
  el.querySelector('img').src = p.image;
  el.querySelector('h3').textContent = p.name;
  el.querySelector('p').textContent = p.blurb.replace('\n', ' ');
  el.querySelector('.stack').textContent = p.stack;
  el.querySelector('a').href = p.url;
  return el;
});
document.getElementById('project-cards').append(...cards);
let shownCard = -2;
function updateCards(active) {
  if (active === shownCard) return;
  shownCard = active;
  cards.forEach((c, i) => c.classList.toggle('active', i === active));
}

// screen-reader / keyboard access to the projects shown in the 3D ice blocks
document.getElementById('project-list').append(
  ...PROJECTS.map((p) => {
    const li = document.createElement('li');
    const a = Object.assign(document.createElement('a'), { href: p.url, target: '_blank', rel: 'noopener', textContent: `${p.name} — ${p.blurb.replace('\n', ' ')} (${p.stack})` });
    li.append(a);
    return li;
  }),
);
