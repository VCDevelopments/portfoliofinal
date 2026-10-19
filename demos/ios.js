// Shared behaviour for the iOS demo apps: system chrome (status bar, Dynamic Island, home indicator)
// and the standard interactions: tabs, a navigation stack, sheets, action sheets, HUDs and banners.
// Demos run on the portfolio inside an iframe; the portfolio can tell them to pause (camera off).

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const svg = (body, vb = '0 0 24 24', extra = '') => `<svg viewBox="${vb}" ${extra} aria-hidden="true">${body}</svg>`;
// small icon set drawn for these demos (no system icon assets)
export const ICON = {
  chevron: svg('<path d="M1.5 1.5 6.5 7l-5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>', '0 0 8 14'),
  back: svg('<path d="M11 2 2.5 10.5 11 19" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>', '0 0 13 21'),
  check: svg('<circle cx="27" cy="27" r="25" fill="none" stroke="currentColor" stroke-width="3"/><path d="m16 28 7.5 7.5L39 20" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>', '0 0 54 54'),
  plus: svg('<path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
};

// status bar icons: signal bars, Wi-Fi arcs, battery
const statusIcons = `
  ${svg('<rect x="0" y="7.5" width="3" height="3.5" rx="0.8"/><rect x="4.5" y="5.5" width="3" height="5.5" rx="0.8"/><rect x="9" y="3" width="3" height="8" rx="0.8"/><rect x="13.5" y="0.5" width="3" height="10.5" rx="0.8"/>', '0 0 17 11', 'width="17" height="11" fill="currentColor"')}
  ${svg('<path d="M7.6 2.2c2.2 0 4.2.8 5.7 2.2l1-1C12.5 1.6 10.1.7 7.6.7S2.7 1.6.9 3.4l1 1c1.5-1.4 3.5-2.2 5.7-2.2z"/><path d="M7.6 5.4c1.3 0 2.5.5 3.4 1.3l1-1C10.8 4.6 9.3 4 7.6 4s-3.2.6-4.4 1.7l1 1c.9-.8 2.1-1.3 3.4-1.3z"/><path d="M7.6 8.4c.5 0 .9.2 1.2.5l-1.2 1.4-1.2-1.4c.3-.3.7-.5 1.2-.5z"/>', '0 0 15.2 11', 'width="15" height="11" fill="currentColor"')}
  ${svg('<rect x="0.5" y="0.5" width="24" height="12" rx="3.8" fill="none" stroke="currentColor" opacity="0.4"/><rect x="2" y="2" width="21" height="9" rx="2.5" fill="currentColor"/><path d="M26 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="currentColor" opacity="0.45"/>', '0 0 27.3 13', 'width="27" height="13"')}`;

// put the system chrome on the screen and keep the clock current
export function chrome(screen = $('.screen')) {
  screen.insertAdjacentHTML('beforeend', `<div class="statusbar"><span class="time"></span><span class="icons">${statusIcons}</span></div><div class="island"></div><div class="home-indicator"></div>`);
  const t = $('.statusbar .time', screen);
  const tick = () => { const d = new Date(); t.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
  tick();
  setInterval(tick, 5000);
  return screen;
}

// tab bar: buttons with data-tab="pageId" switch which page shows
export function tabs(onChange) {
  const bar = $('.tabbar');
  const buttons = $$('button', bar);
  const show = (id) => {
    buttons.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === id)));
    $$('.page[data-root]').forEach((p) => { p.hidden = p.id !== id; });
    $$('.page:not([data-root])').forEach((p) => { p.hidden = true; p.className = p.className.replace(/ ?pushed-(in|out)/g, ''); });
    stack.length = 0;
    stack.push($(`#${id}`));
    onChange?.(id);
  };
  buttons.forEach((b) => b.addEventListener('click', () => show(b.dataset.tab)));
  show((buttons.find((b) => b.getAttribute('aria-selected') === 'true') || buttons[0]).dataset.tab);
  return show;
}

// navigation stack: push(pageId) slides a page in from the right, pop() slides it back out
const stack = [];
export function root(id) { stack.length = 0; stack.push($(`#${id}`)); }
export async function push(id) {
  const next = $(`#${id}`), prev = stack[stack.length - 1];
  next.classList.add('pushed-in');
  next.hidden = false;
  next.scrollTop = 0;
  next.offsetWidth; // start the slide from off-screen
  next.classList.remove('pushed-in');
  prev?.classList.add('pushed-out');
  stack.push(next);
  await wait(450);
  if (prev && stack.includes(prev)) prev.hidden = true;
}
export async function pop() {
  if (stack.length < 2) return;
  const top = stack.pop(), under = stack[stack.length - 1];
  under.hidden = false;
  under.offsetWidth;
  under.classList.remove('pushed-out');
  top.classList.add('pushed-in');
  await wait(450);
  top.hidden = true;
  top.classList.remove('pushed-in');
}
document.addEventListener('click', (e) => { if (e.target.closest('[data-back]')) pop(); });

// sheets and action sheets share one scrim; tapping it closes whatever is open
let scrim;
function getScrim() {
  if (!scrim) {
    scrim = Object.assign(document.createElement('div'), { className: 'scrim' });
    $('.screen').append(scrim);
    scrim.addEventListener('click', closeSheets);
  }
  return scrim;
}
export function openSheet(el) { getScrim().classList.add('open'); el.classList.add('open'); }
export function closeSheets() { scrim?.classList.remove('open'); $$('.sheet.open, .actions.open').forEach((s) => s.classList.remove('open')); }

// action sheet: resolves with the chosen label, or null for Cancel
export function actionSheet(title, options) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'actions';
    el.innerHTML = `<div class="group">${title ? `<div class="title"></div>` : ''}</div><div class="group"><button class="cancel" type="button">Cancel</button></div>`;
    if (title) $('.title', el).textContent = title;
    for (const o of options) {
      const b = Object.assign(document.createElement('button'), { type: 'button', textContent: o.label, className: o.destructive ? 'destructive' : '' });
      b.onclick = () => done(o.label);
      el.firstElementChild.append(b);
    }
    $('.cancel', el).onclick = () => done(null);
    $('.screen').append(el);
    el.offsetWidth;
    openSheet(el);
    const onScrim = () => done(null);
    scrim.addEventListener('click', onScrim, { once: true });
    function done(v) {
      closeSheets();
      scrim.removeEventListener('click', onScrim);
      setTimeout(() => el.remove(), 450);
      resolve(v);
    }
  });
}

// "Saved"-style HUD in the middle of the screen
export function hud(text, icon = ICON.check) {
  const el = document.createElement('div');
  el.className = 'hud';
  el.innerHTML = `${icon}<span></span>`;
  $('span', el).textContent = text;
  $('.screen').append(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 1500);
}

// notification banner from the top
export function banner(appHtml, title, body) {
  const el = document.createElement('div');
  el.className = 'banner';
  el.innerHTML = `<div class="app">${appHtml}</div><div><b></b><div></div></div>`;
  $('b', el).textContent = title;
  $('b + div', el).textContent = body;
  $('.screen').append(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 500); }, 3000);
}

// switches toggle on tap and report their new state
export function bindSwitch(el, onChange) {
  el.setAttribute('role', 'switch');
  el.addEventListener('click', () => {
    const on = el.getAttribute('aria-checked') !== 'true';
    el.setAttribute('aria-checked', String(on));
    onChange?.(on);
  });
}

// segmented control: resolves the pressed button's data-value
export function bindSegmented(el, onChange) {
  $$('button', el).forEach((b) => b.addEventListener('click', () => {
    $$('button', el).forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    onChange(b.dataset.value);
  }));
}

// count a number up/down to a new value
export function countTo(el, to, format, ms = 600) {
  const from = Number(el.dataset.v ?? to);
  el.dataset.v = to;
  const t0 = performance.now();
  (function step(now) {
    const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
    el.textContent = format(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

// the portfolio pauses demos it hides (e.g. ShotGuide turns its camera off)
export function onPause(fn) {
  addEventListener('message', (e) => { if (e.origin === location.origin && e.data === 'vcd:pause') fn(); });
  addEventListener('pagehide', fn);
}
