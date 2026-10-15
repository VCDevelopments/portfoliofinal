// DOM layer: loader, scrambled text, 3D-anchored callouts, sound button and link carousel.
import * as THREE from 'three';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/\\[]{}_';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function scramble(el, text = el.dataset.text ?? el.textContent, duration = 900) {
  el.dataset.text = text;
  cancelAnimationFrame(el._raf);
  if (reduced) { el.textContent = text; return; }
  const start = performance.now();
  const reveal = [...text].map((_, i) => (i / text.length) * 0.55 * duration + Math.random() * 0.45 * duration);
  el._scrambling = true;
  const tick = (now) => {
    const t = now - start;
    let out = '', done = true;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === ' ' || c === '\n' || t >= reveal[i]) out += c;
      else {
        done = false;
        out += t < reveal[i] * 0.35 ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
    }
    el.textContent = out;
    if (done) el._scrambling = false;
    else el._raf = requestAnimationFrame(tick);
  };
  el._raf = requestAnimationFrame(tick);
}

export class UI {
  constructor() {
    this.body = document.body;
    this.chapter = -1;
    this.calloutRoot = document.getElementById('callouts');
    this.svg = document.getElementById('lines');
    this.loaderBar = document.querySelector('.loader-bar');
    // a short line of mono glyphs: '-' still to load, '=' and '+' loaded, with a pulse running through it
    this.loadTarget = 0;
    this.loadShown = 0;
    const N = 12;
    const tick = (now) => {
      if (this.loaderGone) return;
      this.loadShown += (this.loadTarget - this.loadShown) * 0.12;
      const filled = this.loadShown * N;
      let out = '';
      for (let i = 0; i < N; i++) {
        const pulse = Math.sin(now * 0.011 - i * 0.85);
        out += i < filled ? (pulse > 0.25 ? '+' : '=') : pulse > 0.9 ? '=' : '-';
      }
      this.loaderBar.textContent = out;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    this.v = new THREE.Vector3();
  }

  setProgress(p) {
    this.loadTarget = p;
  }

  finishLoading() {
    document.getElementById('loader').classList.add('done');
    setTimeout(() => { this.loaderGone = true; }, 700);
    this.body.classList.remove('is-loading');
  }

  setChapter(i) {
    if (i === this.chapter) return;
    this.chapter = i;
    this.body.dataset.chapter = i;
    document.querySelectorAll(`.ch-${i} [data-scramble], .ch-${i}[data-scramble]`).forEach((el, k) => {
      setTimeout(() => scramble(el), k * 120);
    });
  }

  setSize(w, h) {
    this.w = w;
    this.h = h;
    this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }

  // Positions a chapter's callouts over the canvas. alpha fades them during transitions.
  drawCallouts(list, camera, alpha) {
    for (const c of list) {
      if (!c.el) {
        c.el = document.createElement('div');
        c.el.className = `callout ${c.cls ?? ''}`;
        this.calloutRoot.appendChild(c.el);
        c.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.svg.appendChild(c.path);
        c.shown = false;
      }
      const show = c.visible && alpha > 0.01;
      if (show && !c.shown) scramble(c.el, c.text, 700);
      else if (show && c.live && !c.el._scrambling && c.el.textContent !== c.text) c.el.textContent = c.text;
      c.shown = show;

      const op = show ? alpha : 0;
      c.el.style.opacity = op;
      c.path.style.opacity = op;
      if (!show) continue;

      this.v.copy(c.anchor).project(camera);
      const ax = (this.v.x * 0.5 + 0.5) * this.w;
      const ay = (-this.v.y * 0.5 + 0.5) * this.h;
      // behind the camera, or a degenerate (e.g. zero-size) viewport
      if (this.v.z > 1 || !Number.isFinite(ax + ay)) { c.el.style.opacity = 0; c.path.style.opacity = 0; continue; }
      const [dx, dy] = c.offset;
      const lx = ax + dx, ly = ay + dy;
      const left = dx < 0;
      const width = c.el.offsetWidth;
      c.el.style.transform = `translate(${left ? lx - width : lx}px, ${ly - c.el.offsetHeight}px)`;
      c.path.setAttribute('d', `M${ax.toFixed(1)},${ay.toFixed(1)}L${lx.toFixed(1)},${ly.toFixed(1)}L${(left ? lx - width : lx + width).toFixed(1)},${ly.toFixed(1)}`);
    }
  }

  bindSeason(label, onNext) {
    const btn = document.querySelector('.season');
    if (!btn) return; // an older cached page without the button must still boot
    const b = btn.querySelector('b');
    b.textContent = label;
    btn.addEventListener('click', () => scramble(b, onNext(), 400));
  }

  bindSound(onToggle) {
    const btn = document.querySelector('.sound');
    const label = btn.querySelector('b');
    btn.addEventListener('click', () => {
      const on = onToggle();
      btn.setAttribute('aria-pressed', on);
      scramble(label, on ? 'On' : 'Off', 300);
    });
  }

  buildCarousel(links, onChange) {
    const track = document.querySelector('.track');
    const items = links.map((l) => {
      const a = document.createElement('a');
      a.href = l.href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = l.label;
      track.appendChild(a);
      return a;
    });
    let index = 0;
    const render = () => {
      const n = links.length;
      items.forEach((a, i) => {
        // show the active link with one neighbour either side
        const rel = (i - index + n) % n;
        const order = rel === 0 ? 1 : rel === 1 ? 2 : rel === n - 1 ? 0 : 3;
        a.style.order = order;
        a.hidden = order === 3;
        a.classList.toggle('active', rel === 0);
        a.tabIndex = rel === 0 ? 0 : -1;
      });
      scramble(items[index], links[index].label, 450);
      onChange(index);
    };
    const go = (d) => { index = (index + d + links.length) % links.length; render(); };
    document.querySelector('.carousel .prev').addEventListener('click', () => go(-1));
    document.querySelector('.carousel .next').addEventListener('click', () => go(1));
    items.forEach((a, i) => a.addEventListener('click', (e) => {
      if (i !== index) { e.preventDefault(); go(((i - index + links.length) % links.length) === 1 ? 1 : -1); }
    }));
    addEventListener('keydown', (e) => {
      if (this.chapter !== 3) return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    });
    render();
  }
}
