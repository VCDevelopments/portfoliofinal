// Relay (Dropzone) without its server: the real page (app.html) runs unchanged on top of this stand-in for
// the little Python server. Files live in the visitor's browser only; the laptop and phone views share
// them over a BroadcastChannel, so a file sent from one shows up on the other.
(() => {
  const channel = new BroadcastChannel('vcd-relay');
  const files = new Map(); // name -> { name, size, type, mtime, blob }
  const urls = new Map();
  const listing = () => [...files.values()].sort((a, b) => b.mtime - a.mtime).map(({ name, size, type, mtime }) => ({ name, size, type, mtime }));
  window.relayFileUrl = (name) => {
    const f = files.get(name);
    if (!f) return '#';
    if (!urls.has(name)) urls.set(name, URL.createObjectURL(f.blob));
    return urls.get(name);
  };
  const put = (f, announce = true) => { files.set(f.name, f); if (announce) channel.postMessage({ t: 'put', f }); };
  channel.onmessage = ({ data: m }) => {
    if (m.t === 'hello') channel.postMessage({ t: 'all', list: [...files.values()] });
    if (m.t === 'all') for (const f of m.list) if (!files.has(f.name)) files.set(f.name, f);
    if (m.t === 'put') files.set(m.f.name, m.f);
    if (m.t === 'del') { files.delete(m.name); urls.delete(m.name); }
    window.refresh?.();
  };

  // a few photos already shared, drawn here so the demo needs no image files
  function photo(colors, sun) {
    const c = Object.assign(document.createElement('canvas'), { width: 800, height: 600 });
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 600);
    colors.forEach((col, i) => grad.addColorStop(i / (colors.length - 1), col));
    g.fillStyle = grad;
    g.fillRect(0, 0, 800, 600);
    if (sun) { g.fillStyle = 'rgba(255,244,214,0.95)'; g.beginPath(); g.arc(520, 250, 70, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(30,20,35,0.9)';
    g.beginPath(); g.ellipse(400, 690, 620, 230, 0, 0, 7); g.fill();
    return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.86));
  }
  window.relayPhoto = photo;
  const now = Date.now() / 1000;
  const seeded = (async () => {
    const seed = [
      ['IMG_2481.JPG', ['#ffcf9a', '#e0745c', '#3d2a4a'], true, now - 3600],
      ['IMG_2476.JPG', ['#a8e6ff', '#3c8dde', '#123a6b'], false, now - 7200],
    ];
    for (const [name, cols, sun, mtime] of seed) {
      const blob = await photo(cols, sun);
      put({ name, size: blob.size * 9, type: 'image/jpeg', mtime, blob }, false);
    }
    const text = new Blob(['Agenda\n- launch plan\n- budget\n'], { type: 'text/plain' });
    put({ name: 'notes.txt', size: text.size, type: 'text/plain', mtime: now - 86400, blob: text }, false);
    channel.postMessage({ t: 'hello' });
  })();

  // in the phone view, "Save to Photos" opens the phone's share sheet (drawn by the phone frame)
  if (new URLSearchParams(location.search).has('phone')) {
    navigator.canShare = () => true;
    navigator.share = (data) => parent.relayShare ? parent.relayShare(data) : Promise.resolve();
  }

  // the server's API, answered in the browser
  const realFetch = window.fetch.bind(window);
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url === '/api/files') { await seeded; return json(listing()); }
    if (url === '/api/info') return json({ phoneUrl: 'https://192.168.1.24:8443/?k=Rk3v…' });
    if (url.startsWith('/api/files/') && init.method === 'DELETE') {
      const name = decodeURIComponent(url.slice('/api/files/'.length));
      files.delete(name);
      urls.delete(name);
      channel.postMessage({ t: 'del', name });
      return json({ ok: true });
    }
    return realFetch(input, init);
  };
  // uploads: the real page sends each file with an XMLHttpRequest PUT and shows its progress
  const RealXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function () {
    const x = new RealXHR();
    let target = null;
    const upload = { onprogress: null };
    const fake = {
      upload, status: 0, onloadend: null,
      open(method, url) { if (url.startsWith('/api/upload')) target = decodeURIComponent(new URL(url, location.href).searchParams.get('name')); else x.open(method, url); },
      async send(file) {
        if (!target) return x.send(file);
        const total = file.size || 1;
        for (let k = 1; k <= 12; k++) {
          await new Promise((r) => setTimeout(r, 70 + Math.random() * 60));
          upload.onprogress?.({ lengthComputable: true, loaded: (total * k) / 12, total });
        }
        put({ name: target, size: file.size, type: file.type || 'application/octet-stream', mtime: Date.now() / 1000, blob: file });
        fake.status = 201;
        fake.onloadend?.();
      },
    };
    return fake;
  };
})();
