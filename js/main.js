// Orchestrates the four chapters: scroll progress -> chapter cameras -> composite with transitions.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createHero } from './hero.js';
import { createCrystals } from './crystals.js';
import { createRings } from './rings.js';
import { createParticles } from './particles.js';
import { LINKS, PROJECTS, slugOf } from './projects.js';
import { createComposite } from './post.js';
import { UI } from './ui.js';
import { Sound } from './audio.js';
import { clamp01, easeOut } from './noise.js';
import { installExternalLinks } from './links.js';

// chapter i occupies scroll progress BOUNDS[i]..BOUNDS[i+1]; transitions straddle each boundary
const BOUNDS = [0, 0.158, 0.586, 0.767, 1];
const TW = 0.028;

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.localClippingEnabled = true; // the logos rebuild behind a rising clip plane after a click (shatter.js)
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.82;

const ui = new UI();
const sound = new Sound();
// visitors who asked their device for less motion get calm transitions and no spinning intro
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
// phones and tablets: lower pixel density and less anti-aliasing, so the site stays fast
const lightweight = matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 600;
const composite = createComposite(renderer, { samples: lightweight ? 2 : 4 });
// yield so the loader can paint; a timer (not rAF) keeps booting in background tabs
const frame = () => new Promise((r) => setTimeout(r, 16));

// pointer: raw NDC for raycasting; click: true for one frame; cursor: set by chapters that want a pointer cursor
const ctx = { time: 0, dt: 0, mouse: { x: 0, y: 0 }, pointer: { x: 0, y: 0, inside: false }, click: false, cursor: false, intro: 0, introT: 0, pixelRatio: 1, height: 1, reduced: reducedMotion.matches };
composite.setCalm(ctx.reduced);
reducedMotion.addEventListener('change', (e) => { ctx.reduced = e.matches; composite.setCalm(e.matches); });
const mouseTarget = { x: 0, y: 0 };
let chapters = [];

function resize() {
  const w = innerWidth, h = innerHeight;
  if (!w || !h) return; // hidden/zero-size viewport would give NaN aspect
  const pr = Math.min(devicePixelRatio, lightweight ? 1.25 : 1.75);
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h); // also sizes the canvas element, so it always matches the pixels drawn
  composite.setSize(Math.floor(w * pr), Math.floor(h * pr));
  ui.setSize(w, h);
  chapters[1]?.live.setSize(w, h);
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
  // the live demos on the 3D phones sit just above the canvas (phones and tablets keep the pictures)
  canvas.after(chapters[1].live.el);
  resize();
  // upload the project pictures now, so scrolling into the devices doesn't hitch on them
  for (const t of await chapters[1].ready) renderer.initTexture(t);
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
  // night mode: remembered per visitor, else follows the device's dark mode
  let night = matchMedia('(prefers-color-scheme: dark)').matches;
  try { const saved = localStorage.getItem('vcd-night'); if (saved !== null) night = saved === '1'; } catch {}
  chapters[0].setNight(night, true);
  ui.bindNight(night, (on) => {
    chapters[0].setNight(on);
    try { localStorage.setItem('vcd-night', on ? '1' : '0'); } catch {}
  });
  installExternalLinks(); // after the carousel and cards exist, so their links are covered too
  // deep link: #project-<slug> opens that project's pop-up once the site has loaded
  const linked = PROJECTS.findIndex((p) => location.hash === `#project-${slugOf(p)}`);

  await new Promise((r) => setTimeout(r, 350));
  document.body.classList.add('is-intro');
  ui.finishLoading();
  scrollTo(0, 0);
  introStart = performance.now() - (ctx.reduced ? 20000 : 0); // reduced motion: start with the intro already played
  if (linked >= 0) setTimeout(() => openProject(linked), 400);
  requestAnimationFrame(loop);
}

let introStart = 0;
let progress = 0, last = performance.now();
// how fast the scene catches up with the scrollbar (1/s, real time): just enough to round off a mouse
// wheel's steps. Touch scrolling already glides, so on phones the scene follows it exactly.
const SCROLL_CATCHUP = 24;
const followExactly = matchMedia('(pointer: coarse)').matches;

function loop(now) {
  requestAnimationFrame(loop);
  const realDt = Math.min(0.25, (now - last) / 1000);
  const dt = Math.min(0.05, realDt);
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
  // timed on the real clock, so a slow frame never leaves the scene behind the scrollbar
  const before = progress;
  progress = followExactly ? target : progress + (target - progress) * (1 - Math.exp(-realDt * SCROLL_CATCHUP));
  if (Math.abs(target - progress) < 1e-5) progress = target;
  const velocity = (progress - before) / Math.max(realDt, 1e-3);
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
  chapters[1].live.render(!lightweight && current === 1 && b < 0);
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
  if (!e.target.closest('a, button, dialog')) ctx.click = true;
});

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
boot();

// overview card beside each device; the projects scene reports which one is in view
const cards = PROJECTS.map((p, i) => {
  const el = document.createElement('article');
  el.className = `project-card ${i % 2 ? 'left' : 'right'}`;
  el.innerHTML = `<span class="num">PROJECT ${String(i + 1).padStart(2, '0')} / ${String(PROJECTS.length).padStart(2, '0')}</span>
    <img alt="" loading="lazy" />
    <h3></h3><p></p><span class="stack"></span>
    <button type="button" tabindex="-1">Learn more +</button>`;
  el.querySelector('img').src = p.image;
  el.querySelector('h3').textContent = p.name;
  el.querySelector('p').textContent = p.blurb.replace('\n', ' ');
  el.querySelector('.stack').textContent = p.stack;
  el.querySelector('button').addEventListener('click', () => openProject(i));
  return el;
});
document.getElementById('project-cards').append(...cards);
let shownCard = -2;
function updateCards(active) {
  if (active === shownCard) return;
  shownCard = active;
  cards.forEach((c, i) => c.classList.toggle('active', i === active));
}

// screen-reader / keyboard access to the projects shown on the 3D devices
document.getElementById('project-list').append(
  ...PROJECTS.map((p, i) => {
    const li = document.createElement('li');
    const label = `${p.name} — ${p.blurb.replace('\n', ' ')} (${p.stack})`;
    const el = Object.assign(document.createElement('button'), { type: 'button', textContent: label, onclick: () => openProject(i) });
    // the project's own page, so it can be found and shared
    li.append(el, ' ', Object.assign(document.createElement('a'), { href: `projects/${slugOf(p)}/`, textContent: `${p.name} project page` }));
    return li;
  }),
);

// pop-up with a project's full story and pictures (like igloo.inc's project overlay);
// <dialog> handles focus, Esc and the inert page behind it
const dialog = document.getElementById('project-dialog');
const el = (tag, props) => Object.assign(document.createElement(tag), props);
let gallery = [], shown = 0;
function showPicture(k) {
  shown = (k + gallery.length) % gallery.length;
  const g = gallery[shown];
  const img = dialog.querySelector('.main');
  img.src = g.src;
  img.alt = g.caption;
  dialog.querySelector('figcaption').textContent = `${shown + 1} / ${gallery.length} · ${g.caption}`;
  dialog.querySelectorAll('.thumbs button').forEach((b, n) => b.setAttribute('aria-pressed', String(n === shown)));
}
function openProject(i) {
  const p = PROJECTS[i];
  gallery = p.gallery;
  dialog.querySelector('.status').textContent = p.details.status;
  dialog.querySelector('h2').textContent = p.name;
  dialog.querySelector('.intro').textContent = p.details.intro;
  dialog.querySelector('.devices').replaceChildren(...['laptop', 'phone'].filter((k) => p.device[k]).map((k) => deviceFrame(k, p.device[k], p.name)));
  dialog.querySelector('.try-note').textContent = p.demoNote;
  dialog.querySelector('.thumbs').replaceChildren(...gallery.map((g, n) => {
    const b = el('button', { type: 'button', onclick: () => showPicture(n) });
    b.setAttribute('aria-label', `Picture ${n + 1}: ${g.caption}`);
    b.append(el('img', { src: g.src, alt: '' }));
    return b;
  }));
  dialog.querySelector('.sections').replaceChildren(...p.details.sections.map((sec) => {
    const s = el('section');
    s.append(el('h3', { textContent: sec.title }), el('p', { textContent: sec.text }));
    return s;
  }));
  dialog.querySelector('.stack').textContent = p.stack;
  dialog.querySelector('.page').href = `projects/${slugOf(p)}/`;
  const code = dialog.querySelector('.code');
  code.hidden = !p.url;
  if (p.url) code.href = p.url;
  dialog.style.setProperty('--glow', p.colors[2]);
  showPicture(0);
  dialog.showModal();
  fitDevices();
  dialog.querySelector('.sheet').scrollTop = 0;
}
// a full-size iPhone (and, for Relay, a laptop) running the project's demo, scaled to fit the pop-up
const FRAME = { phone: [427, 886], laptop: [1340, 876] };
function deviceFrame(kind, def, name) {
  const slot = el('div', { className: `slot ${kind}` });
  const body = el('div', { className: kind === 'phone' ? 'iphone' : 'macbook' });
  const screen = el('div', { className: 'glass' });
  const frame = el('iframe', { src: def.demo, title: `${name}: try the app` });
  frame.allow = 'camera';
  screen.append(frame);
  if (kind === 'phone') body.append(el('div', { className: 'bezel' }), ...['action', 'vol-up', 'vol-down', 'side', 'camera'].map((b) => el('i', { className: b })));
  body.append(screen);
  if (kind === 'laptop') body.append(el('div', { className: 'base' }));
  slot.append(body);
  return slot;
}
function fitDevices() {
  const box = dialog.querySelector('.devices');
  const room = box.clientWidth;
  const k = Math.min(0.82, (innerHeight * 0.74) / FRAME.phone[1], room / FRAME.phone[0]);
  const laptop = box.querySelector('.laptop');
  // the laptop shows beside the phone only when there is room for both
  const kl = laptop && Math.min((k * FRAME.phone[1] * 0.78) / FRAME.laptop[1], (room - FRAME.phone[0] * k - 32) / FRAME.laptop[0]);
  if (laptop) laptop.hidden = kl < 0.32;
  for (const [slot, kind, scale] of [[box.querySelector('.phone'), 'phone', k], [laptop, 'laptop', kl]]) {
    if (!slot) continue;
    slot.style.width = `${FRAME[kind][0] * scale}px`;
    slot.style.height = `${FRAME[kind][1] * scale}px`;
    slot.firstChild.style.transform = `scale(${scale})`;
  }
}
addEventListener('resize', () => { if (dialog.open) fitDevices(); });
// closing the pop-up unloads the demos (ShotGuide's camera turns off with it)
dialog.addEventListener('close', () => dialog.querySelector('.devices').replaceChildren());
ctx.openProject = openProject;
dialog.addEventListener('click', (e) => {
  if (e.target === dialog || e.target.closest('.close')) dialog.close();
  else if (e.target.closest('.prev')) showPicture(shown - 1);
  else if (e.target.closest('.next')) showPicture(shown + 1);
});
dialog.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') showPicture(shown - 1);
  if (e.key === 'ArrowRight') showPicture(shown + 1);
});
