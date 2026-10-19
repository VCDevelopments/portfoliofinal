// Records a short 4:5 case-study video per project: videos/<slug>.mp4 (1080 × 1350, H.264, for
// LinkedIn), a lighter <slug>-web.mp4 (720 × 900) that plays on the site, and <slug>-poster.jpg;
// each is tools/reel.html with the project's demo playing its guided tour.
// Needs the site served locally and Google Chrome:
//   python3 -m http.server 5173 &   node tools/record-reels.mjs [slug …]
// Chrome renders the reel headless; the frames it paints are collected over the DevTools protocol and
// then encoded at a steady 30 fps with the browser's own H.264 encoder (WebCodecs) into an MP4.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PROJECTS, slugOf } from '../js/projects.js';

const SITE = 'http://localhost:5173';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W = 1080, H = 1350, MAX_SECONDS = 60, TAIL = 0.4;
const out = new URL('../videos/', import.meta.url);
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const port = 9700 + Math.floor(Math.random() * 200);
const chrome = spawn(CHROME, ['--headless=new', '--use-angle=metal', '--enable-gpu', `--remote-debugging-port=${port}`, `--window-size=${W},${H}`, '--hide-scrollbars', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'reel-'))}`, 'about:blank'], { stdio: 'ignore' });
let pageWs;
for (let k = 0; k < 40 && !pageWs; k++) {
  await sleep(500);
  try { pageWs = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === 'page')?.webSocketDebuggerUrl; } catch {}
}
const ws = new WebSocket(pageWs);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map(), handlers = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  if (d.method) handlers.get(d.method)?.(d.params);
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'evaluate failed');
  return r.result.result.value;
};
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });

const wanted = process.argv.slice(2);
for (const p of PROJECTS.filter((x) => !wanted.length || wanted.includes(slugOf(x)))) {
  const slug = slugOf(p);
  // 1. play the reel and keep every painted frame with its time
  const frames = [];
  handlers.set('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    frames.push({ data, t: metadata.timestamp });
    send('Page.screencastFrameAck', { sessionId });
  });
  await send('Page.navigate', { url: `${SITE}/tools/reel.html?p=${slug}&r=${Date.now()}` });
  for (let k = 0; k < 60 && !(await evaluate("document.body?.dataset.ready === '1'").catch(() => false)); k++) await sleep(250);
  await send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
  await sleep(600);
  await evaluate('play()');
  const t0 = Date.now();
  while (Date.now() - t0 < MAX_SECONDS * 1000) {
    await sleep(500);
    if (await evaluate("document.body.dataset.done === '1'")) break;
  }
  await sleep(TAIL * 1000);
  await send('Page.stopScreencast');
  handlers.delete('Page.screencastFrame');
  console.log(`${slug}: ${frames.length} frames captured, encoding…`);
  if (process.env.DUMP) for (const q of [0.2, 0.5, 0.8]) writeFileSync(`${process.env.DUMP}/${slug}-${q}.jpg`, Buffer.from(frames[Math.floor(frames.length * q)].data, 'base64'));
  // 2. re-time the frames onto a canvas and record it
  await send('Page.navigate', { url: `${SITE}/robots.txt` }); // any local page: the encoder needs a secure context
  await sleep(300);
  await evaluate(`window.frames_ = []; true`);
  for (let i = 0; i < frames.length; i += 20) {
    const batch = frames.slice(i, i + 20).map((f) => [f.data, f.t]);
    await evaluate(`frames_.push(...${JSON.stringify(batch)}); true`);
  }
  // full size for LinkedIn, a lighter 720 × 900 copy for the site, and a poster frame from the tour
  await evaluate(`(async () => {
    const { Muxer, ArrayBufferTarget } = await import('https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/+esm');
    const decode = async (b64) => createImageBitmap(await (await fetch('data:image/jpeg;base64,' + b64)).blob());
    const b64 = (buf) => { let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000)); return btoa(s); };
    // a steady 30 fps: each output frame shows the latest painted frame at that moment
    window.encode = async (w, h, bitrate) => {
      const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc', width: w, height: h }, fastStart: 'in-memory' });
      let failed = null;
      const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { failed = e; } });
      enc.configure({ codec: 'avc1.640028', width: w, height: h, bitrate, framerate: 30 });
      const canvas = new OffscreenCanvas(w, h), g = canvas.getContext('2d');
      const base = frames_[0][1], N = Math.round((frames_.at(-1)[1] - base) * 30);
      let src = -1;
      for (let k = 0; k <= N; k++) {
        let i = Math.max(src, 0);
        while (i + 1 < frames_.length && frames_[i + 1][1] - base <= k / 30) i++;
        if (i !== src) { const bm = await decode(frames_[i][0]); g.drawImage(bm, 0, 0, w, h); bm.close(); src = i; }
        const vf = new VideoFrame(canvas, { timestamp: Math.round((k * 1e6) / 30), duration: Math.round(1e6 / 30) });
        enc.encode(vf, { keyFrame: k % 60 === 0 });
        vf.close();
        while (enc.encodeQueueSize > 8 && !failed) await new Promise((r) => setTimeout(r, 5));
        if (failed) throw failed;
      }
      await enc.flush();
      muxer.finalize();
      return b64(new Uint8Array(muxer.target.buffer));
    };
    window.poster = async (w, h, at) => {
      const c = new OffscreenCanvas(w, h);
      const bm = await decode(frames_[Math.floor(frames_.length * at)][0]);
      c.getContext('2d').drawImage(bm, 0, 0, w, h);
      return b64(new Uint8Array(await (await c.convertToBlob({ type: 'image/jpeg', quality: 0.82 })).arrayBuffer()));
    };
    return true;
  })()`);
  writeFileSync(new URL(`${slug}.mp4`, out), Buffer.from(await evaluate(`encode(${W}, ${H}, 6e6)`), 'base64'));
  writeFileSync(new URL(`${slug}-web.mp4`, out), Buffer.from(await evaluate('encode(720, 900, 2.2e6)'), 'base64'));
  writeFileSync(new URL(`${slug}-poster.jpg`, out), Buffer.from(await evaluate('poster(720, 900, 0.45)'), 'base64'));
  console.log(`${slug}: ${frames.length} frames over ${(frames.at(-1).t - frames[0].t).toFixed(1)} s → ${slug}.mp4, ${slug}-web.mp4, ${slug}-poster.jpg`);
}
ws.close();
chrome.kill();
process.exit(0);
