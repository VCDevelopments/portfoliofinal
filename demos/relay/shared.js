// Relay demo: the phone app and the laptop page share one file list. They talk over a
// BroadcastChannel inside the visitor's browser, so a file dropped on the laptop shows up on the
// phone next to it. Nothing is uploaded anywhere.
const channel = new BroadcastChannel('vcd-relay-demo');

export const files = [
  { id: 'a', name: 'IMG_2481.HEIC', size: 2.4e6, from: 'phone', kind: 'image', look: 'linear-gradient(160deg,#ffcf9a,#e0745c 55%,#3d2a4a)' },
  { id: 'b', name: 'presentation-final.pdf', size: 8.1e6, from: 'laptop', kind: 'doc' },
  { id: 'c', name: 'screen-recording.mov', size: 41.7e6, from: 'phone', kind: 'video', look: 'linear-gradient(160deg,#9ad7ff,#2f6fd6)' },
];
export const state = { paired: false };

const listeners = new Set();
export const onChange = (fn) => listeners.add(fn);
const changed = (e) => listeners.forEach((fn) => fn(e));

channel.onmessage = ({ data: m }) => {
  if (m.t === 'hello') channel.postMessage({ t: 'state', files, paired: state.paired });
  if (m.t === 'state') {
    for (const f of m.files) if (!files.some((o) => o.id === f.id)) files.unshift(f);
    for (let i = files.length - 1; i >= 0; i--) if (!m.files.some((o) => o.id === files[i].id)) files.splice(i, 1);
    state.paired ||= m.paired;
    changed({ t: 'state' });
  }
  if (m.t === 'add' && !files.some((o) => o.id === m.file.id)) { files.unshift(m.file); changed(m); }
  if (m.t === 'del') { const i = files.findIndex((o) => o.id === m.id); if (i >= 0) files.splice(i, 1); changed(m); }
  if (m.t === 'paired') { state.paired = true; changed(m); }
};
channel.postMessage({ t: 'hello' });

export function addFile(file) { files.unshift(file); channel.postMessage({ t: 'add', file }); changed({ t: 'add', file, local: true }); }
export function deleteFile(id) { const i = files.findIndex((o) => o.id === id); if (i >= 0) files.splice(i, 1); channel.postMessage({ t: 'del', id }); changed({ t: 'del', id, local: true }); }
export function pair() { state.paired = true; channel.postMessage({ t: 'paired' }); changed({ t: 'paired', local: true }); }

export const newId = () => Math.random().toString(36).slice(2, 9);
export const size = (b) => (b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);
export const kindOf = (name, type = '') => (type.startsWith('image/') || /\.(heic|jpe?g|png|gif|webp)$/i.test(name) ? 'image' : type.startsWith('video/') || /\.(mov|mp4)$/i.test(name) ? 'video' : 'doc');

// a file's little picture: the photo itself when there is one, else a coloured tile with its type
export function thumb(f, px) {
  const el = document.createElement('span');
  el.className = 'thumb';
  el.style.cssText = `width:${px}px;height:${px}px;border-radius:${px * 0.2}px;flex:0 0 auto;display:grid;place-items:center;overflow:hidden;font:600 ${px * 0.24}px/1 -apple-system,system-ui,sans-serif;color:#fff;background:${f.look || (f.kind === 'doc' ? '#e5484d' : '#8e8e93')};background-size:cover;background-position:center`;
  if (f.blob) el.style.backgroundImage = `url(${URL.createObjectURL(f.blob)})`;
  else if (f.kind === 'doc') el.textContent = (f.name.split('.').pop() || 'FILE').slice(0, 4).toUpperCase();
  if (f.kind === 'video') el.innerHTML = '<svg viewBox="0 0 10 10" width="40%" height="40%"><path d="M3 2v6l5-3z" fill="#fff"/></svg>';
  return el;
}

// a QR-style code (finder squares in three corners, a fixed scatter of modules elsewhere)
export function qr(n = 25) {
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let cells = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if ([[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => x >= fx - 1 && x < fx + 8 && y >= fy - 1 && y < fy + 8)) continue;
    if (r() > 0.52) cells += `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`;
  }
  const eye = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  return `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><g fill="#0b2a2e">${eye(0, 0)}${eye(n - 7, 0)}${eye(0, n - 7)}${cells}</g></svg>`;
}
