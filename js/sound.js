/**
 * CyberCalc Sound Engine
 * Web Audio API — keypad clicks, error tones, ambient cyberpunk music
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientNodes = [];
    this.ambientStarted = false;
    this.enabled = { click: true, error: true, ambient: true };
    this.volume = 0.5;
    this._initialized = false;
  }

  /** Lazily init AudioContext (must be called from user gesture) */
  _ensure() {
    if (this._initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);
    this._initialized = true;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this.volume;
  }

  toggleSound(type, on) {
    if (type in this.enabled) this.enabled[type] = on;
  }

  /* ── Keypad click ──────────────────────────────────── */
  playKeyClick() {
    if (!this.enabled.click) return;
    this._ensure();
    const t = this.ctx.currentTime;

    // Short sine blip with fast decay + noise burst for tactile feel
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.05);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);

    // Subtle noise click
    const bufSize = this.ctx.sampleRate * 0.02;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.08, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    noise.connect(ng).connect(this.masterGain);
    noise.start(t);
  }

  /* ── Error tone ────────────────────────────────────── */
  playError() {
    if (!this.enabled.error) return;
    this._ensure();
    const t = this.ctx.currentTime;

    // Dissonant buzz — two detuned saw waves
    [120, 125].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4 + i * 0.05);
      osc.connect(gain).connect(this.masterGain);
      osc.start(t + i * 0.05);
      osc.stop(t + 0.5);
    });
  }

  /* ── Ambient cyberpunk music ───────────────────────── */
  startAmbient() {
    if (!this.enabled.ambient || this.ambientStarted) return;
    this._ensure();
    this.ambientStarted = true;

    const t = this.ctx.currentTime;

    // Drone bass
    const drone = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    drone.type = 'sine';
    drone.frequency.value = 55; // A1
    droneGain.gain.setValueAtTime(0, t);
    droneGain.gain.linearRampToValueAtTime(0.15, t + 2);
    this.ambientNodes.push({ osc: drone, gain: droneGain });
    drone.connect(droneGain).connect(this.masterGain);
    drone.start(t);

    // Pulsating pad — triangle wave with LFO on gain
    const pad = this.ctx.createOscillator();
    const padGain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    pad.type = 'triangle';
    pad.frequency.value = 110; // A2
    lfo.type = 'sine';
    lfo.frequency.value = 0.5; // 0.5 Hz pulse
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain).connect(padGain.gain);
    padGain.gain.setValueAtTime(0.12, t);
    pad.connect(padGain).connect(this.masterGain);
    this.ambientNodes.push({ osc: pad, gain: padGain, lfo });
    pad.start(t);
    lfo.start(t);

    // High shimmer — filtered noise
    const bufSize = this.ctx.sampleRate * 4;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const shimmer = this.ctx.createBufferSource();
    shimmer.buffer = buf;
    shimmer.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4000;
    filter.Q.value = 0.5;
    const sg = this.ctx.createGain();
    sg.gain.setValueAtTime(0, t);
    sg.gain.linearRampToValueAtTime(0.03, t + 3);
    shimmer.connect(filter).connect(sg).connect(this.masterGain);
    this.ambientNodes.push({ src: shimmer, gain: sg });
    shimmer.start(t);
  }

  stopAmbient() {
    this.ambientStarted = false;
    this.ambientNodes.forEach(n => {
      if (n.osc) try { n.osc.stop(); } catch(e) {}
      if (n.lfo) try { n.lfo.stop(); } catch(e) {}
      if (n.src) try { n.src.stop(); } catch(e) {}
      if (n.gain) n.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    });
    this.ambientNodes = [];
  }
}

// Singleton
window.sound = new SoundEngine();
