// Guided tour, shared by every demo (the iOS apps and the real web apps): a fingertip plays a scripted
// walkthrough with captions. The portfolio starts it with the message 'vcd:tour'; 'vcd:pause' or a real
// touch stops it. In a case-study recording (?reel) the demo reports its captions and touch points to the
// reel instead of drawing captions itself.
const $ = (sel, root = document) => root.querySelector(sel);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const style = document.createElement('style');
style.textContent = `/* guided tour: a soft fingertip with a press ripple, and a caption pill above the home indicator */
.tour-finger { position: fixed; z-index: 300; left: -22px; top: -22px; width: 44px; height: 44px; border-radius: 50%; background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0 30%, rgba(255, 255, 255, 0.35) 55%, rgba(255, 255, 255, 0) 72%); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25); opacity: 0; pointer-events: none; }
.tour-finger.on { opacity: 1; }
.tour-finger::after { content: ""; position: absolute; inset: 6px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.9); transform: scale(0.6); opacity: 0; }
.tour-finger.press::after { animation: tap-ring 0.45s ease-out; }
@keyframes tap-ring { from { transform: scale(0.6); opacity: 1; } to { transform: scale(1.8); opacity: 0; } }
.tour-caption { position: fixed; z-index: 299; left: 50%; bottom: 96px; width: max-content; max-width: calc(100% - 48px); transform: translate(-50%, 12px); padding: 9px 16px; border-radius: 20px; background: rgba(20, 20, 22, 0.82); color: #fff; font: 600 15px/20px -apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif; text-align: center; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); opacity: 0; transition: opacity 0.3s, transform 0.4s cubic-bezier(0.32, 0.72, 0, 1); pointer-events: none; }
.tour-caption.on { opacity: 1; transform: translate(-50%, 0); }
.reel .tour-caption { display: none; }
`;
document.head.append(style);

// Each step is { tap: selector | () => element } or { drag: selector, by: [dx, dy] | () => [dx, dy] },
// or { scroll: selector, to: y, left: x } (numbers or functions), or { wait: ms }; `say` shows a caption while it runs.
// The portfolio starts a tour with the message 'vcd:tour'; 'vcd:pause' or touching the screen stops it.
let touring = null;
// recording a case-study reel (?reel): the reel draws its own captions, so the demo reports its steps instead
const REEL = new URLSearchParams(location.search).has('reel');
if (REEL) document.documentElement.classList.add('reel');
const report = (msg) => { if (REEL) parent.postMessage(msg, location.origin); };
const finger = () => {
  let f = $('.tour-finger');
  if (!f) {
    f = Object.assign(document.createElement('div'), { className: 'tour-finger' });
    ($('.screen') || document.body).append(f, Object.assign(document.createElement('div'), { className: 'tour-caption' }));
  }
  return f;
};
// scroll with requestAnimationFrame rather than behavior: 'smooth', so it also glides in the recorded videos
// (those step the page clock, which the browser's own smooth scroll ignores)
const scrollEase = (el, top, left, ms = 700) => new Promise((done) => {
  const t0 = top - el.scrollTop, l0 = left - el.scrollLeft, y = el.scrollTop, x = el.scrollLeft, w = el.ownerDocument.defaultView;
  const start = w.performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - start) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
    el.scrollTo(x + l0 * e, y + t0 * e);
    k < 1 ? w.requestAnimationFrame(step) : done();
  };
  w.requestAnimationFrame(step);
});
const scroller = (el) => {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight) return p;
  }
  return el.ownerDocument.scrollingElement;
};
const find = (s) => (typeof s === 'function' ? s() : $(s));
// the centre of an element's visible part in this page's coordinates, also for elements inside a
// (same-origin) frame on it; a scrolled page reports its viewport rather than the whole document
const centre = (el) => {
  let w = el.ownerDocument.defaultView;
  const r = el.getBoundingClientRect(), mid = (a, b, max) => (Math.max(a, 0) + Math.min(b, max)) / 2;
  let x = mid(r.left, r.right, w.innerWidth), y = mid(r.top, r.bottom, w.innerHeight);
  while (w && w !== window && w.frameElement) { const f = w.frameElement.getBoundingClientRect(); x += f.left; y += f.top; w = w.parent; }
  return [x, y];
};
async function glide(f, x, y, ms = 650) {
  f.style.transition = `transform ${ms}ms cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s`;
  f.style.transform = `translate(${x}px, ${y}px)`;
  await wait(ms);
}
const ptr = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true }));

export async function tour(steps) {
  if (touring) return;
  const run = (touring = { stopped: false });
  const f = finger(), cap = $('.tour-caption');
  document.body.classList.add('touring');
  const stop = () => { run.stopped = true; };
  // a real touch from the visitor ends the tour so they can take over
  const takeover = (e) => { if (e.isTrusted) stop(); };
  addEventListener('pointerdown', takeover, true);
  const [sx, sy] = [innerWidth * 0.75, innerHeight * 0.9];
  f.style.transition = 'none';
  f.style.transform = `translate(${sx}px, ${sy}px)`;
  f.offsetWidth;
  f.classList.add('on');
  try {
    for (const s of steps) {
      if (run.stopped) break;
      if (s.say) report({ vcd: 'say', text: s.say });
      cap.textContent = s.say || cap.textContent;
      cap.classList.toggle('on', !!s.say || cap.classList.contains('on'));
      if (s.wait) { await wait(s.wait); continue; }
      // a step of its own: optionally glide to an element first, then run the action
      if (s.run) {
        const at = s.at && find(s.at);
        if (at) {
          const [x, y] = centre(at);
          report({ vcd: 'point', x, y });
          await glide(f, x, y);
          f.classList.add('press');
          await wait(140);
        }
        await s.run();
        f.classList.remove('press');
        await wait(s.after ?? 650);
        continue;
      }
      const el = find(s.tap || s.drag || s.scroll);
      if (!el) continue;
      if (s.scroll) {
        const [x, y] = centre(el);
        report({ vcd: 'point', x, y });
        await glide(f, x, y);
        const v = (k) => (typeof s[k] === 'function' ? s[k]() : s[k]);
        await scrollEase(el, v('to') ?? el.scrollTop, v('left') ?? el.scrollLeft);
        await wait(200);
        continue;
      }
      // bring it into view first (and let the smooth scroll land) when it is off screen
      const r = el.getBoundingClientRect(), vh = el.ownerDocument.defaultView.innerHeight;
      if (r.top < 0 || r.bottom > vh) {
        const sc = scroller(el), box = sc.getBoundingClientRect?.() ?? { top: 0 }, top0 = sc === el.ownerDocument.scrollingElement ? 0 : box.top;
        await scrollEase(sc, sc.scrollTop + r.top - top0 - (Math.min(sc.clientHeight, vh) - r.height) / 2, sc.scrollLeft, 550);
        await wait(50);
      }
      const [x, y] = centre(el);
      report({ vcd: 'point', x, y });
      await glide(f, x, y);
      if (run.stopped) break;
      f.classList.add('press');
      if (s.tap) {
        await wait(140);
        el.click();
        await wait(160);
        f.classList.remove('press');
      } else {
        const [dx, dy] = typeof s.by === 'function' ? s.by() : s.by;
        ptr(el, 'pointerdown', x, y);
        const n = 24;
        for (let k = 1; k <= n && !run.stopped; k++) {
          const e = k / n, q = 1 - Math.pow(1 - e, 3);
          const px = x + dx * q, py = y + dy * q;
          f.style.transition = 'none';
          f.style.transform = `translate(${px}px, ${py}px)`;
          ptr(el, 'pointermove', px, py);
          await wait(28);
        }
        ptr(el, 'pointerup', x + dx, y + dy);
        f.classList.remove('press');
      }
      await wait(s.after ?? 650);
    }
  } finally {
    removeEventListener('pointerdown', takeover, true);
    f.classList.remove('on', 'press');
    cap.classList.remove('on');
    document.body.classList.remove('touring');
    touring = null;
    parent?.postMessage('vcd:tour-done', location.origin);
  }
}
export const stopTour = () => { if (touring) touring.stopped = true; };

// the portfolio asks a demo to play its tour; `?tour` in the address plays it on load (for recordings)
export function onTour(steps) {
  addEventListener('message', (e) => {
    if (e.origin !== location.origin) return;
    if (e.data === 'vcd:tour') tour(typeof steps === 'function' ? steps() : steps);
    if (e.data === 'vcd:pause') stopTour();
  });
  if (new URLSearchParams(location.search).has('tour')) setTimeout(() => tour(typeof steps === 'function' ? steps() : steps), 1200);
}
