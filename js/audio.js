// Generative ambience: wind (filtered brown noise), a low drone, scroll whoosh and UI blips.
export class Sound {
  on = false;
  ctx = null;

  init() {
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const wind = ctx.createBiquadFilter();
    wind.type = 'bandpass';
    wind.frequency.value = 420;
    wind.Q.value = 0.7;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(wind.frequency);
    const windGain = ctx.createGain();
    windGain.gain.value = 0.55;
    src.connect(wind).connect(windGain).connect(this.master);

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    this.whoosh = ctx.createGain();
    this.whoosh.gain.value = 0;
    src.connect(hp).connect(this.whoosh).connect(this.master);

    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 500;
    droneFilter.connect(this.master);
    [55, 82.4, 110.6].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i ? 'sine' : 'triangle';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.07 / (i + 1);
      o.connect(g).connect(droneFilter);
      o.start();
    });

    src.start();
    lfo.start();
  }

  toggle() {
    if (!this.ctx) this.init();
    this.on = !this.on;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.master.gain.setTargetAtTime(this.on ? 0.6 : 0, this.ctx.currentTime, 0.4);
    return this.on;
  }

  setVelocity(v) {
    if (!this.on) return;
    this.whoosh.gain.setTargetAtTime(Math.min(1, Math.abs(v) * 8), this.ctx.currentTime, 0.08);
  }

  blip(freq = 1320) {
    if (!this.on) return;
    const { ctx } = this;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(ctx.currentTime + 0.13);
  }
}
