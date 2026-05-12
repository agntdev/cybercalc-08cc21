/**
 * CyberCalc Sound Engine
 * Web Audio API — keypad clicks, error tones, ambient cyberpunk music
 * v2 — individual volume controls, localStorage persistence, robust error handling
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;

    // Per-type gain nodes
    this.gains = { click: null, error: null, ambient: null };

    this.ambientNodes = [];
    this.ambientInterval = null;
    this.ambientStarted = false;
    this._initialized = false;

    // Load persisted settings
    this._loadSettings();
  }

  /* ── Persistence ──────────────────────────────────── */
  _defaults() {
    return {
      enabled: { click: true, error: true, ambient: false },
      volume: { master: 0.5, click: 0.5, error: 0.5, ambient: 0.3 },
    };
  }

  _storageKey() { return 'cybercalc_sound_settings'; }

  _loadSettings() {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(this._storageKey()));
    } catch { /* ignore corrupted data */ }

    const def = this._defaults();
    if (saved && saved.enabled && saved.volume) {
      this.enabled = { ...def.enabled, ...saved.enabled };
      this.volume = { ...def.volume, ...saved.volume };
    } else {
      this.enabled = { ...def.enabled };
      this.volume = { ...def.volume };
    }
  }

  _saveSettings() {
    try {
      localStorage.setItem(this._storageKey(), JSON.stringify({
        enabled: this.enabled,
        volume: this.volume,
      }));
      window.dispatchEvent(new CustomEvent('cybercalc:preferences-changed', {
        detail: {
          soundEnabled: Object.values(this.enabled).some(Boolean),
        },
      }));
    } catch { /* quota exceeded, ignore silently */ }
  }

  /* ── AudioContext init ─────────────────────────────── */
  _ensure() {
    if (this._initialized) return true;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume.master;
      this.masterGain.connect(this.ctx.destination);

      // Per-type gain nodes
      for (const type of ['click', 'error', 'ambient']) {
        const g = this.ctx.createGain();
        g.gain.value = this.volume[type] || 0.5;
        g.connect(this.masterGain);
        this.gains[type] = g;
      }

      this._initialized = true;
      return true;
    } catch (e) {
      console.warn('CyberCalc: AudioContext init failed', e);
      return false;
    }
  }

  /* ── Volume API ────────────────────────────────────── */
  setVolume(type, v) {
    if (!['master', 'click', 'error', 'ambient'].includes(type)) return;
    v = Math.max(0, Math.min(1, v));
    this.volume[type] = v;
    if (type === 'master' && this.masterGain) {
      this.masterGain.gain.value = v;
    } else if (this.gains[type]) {
      this.gains[type].gain.value = v;
    }
    this._saveSettings();
  }

  getVolume(type) {
    return this.volume[type] ?? 0.5;
  }

  toggleSound(type, on) {
    if (!(type in this.enabled)) return;
    this.enabled[type] = on;
    this._saveSettings();
  }

  isEnabled(type) {
    return !!this.enabled[type];
  }

  /* ── Keypad click ──────────────────────────────────── */
  playKeyClick() {
    if (!this.enabled.click || !this._ensure()) return;
    try {
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.05);
      env.gain.setValueAtTime(0.3, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(env).connect(this.gains.click);
      osc.start(t);
      osc.stop(t + 0.08);

      // Noise burst
      const bufSize = Math.floor(this.ctx.sampleRate * 0.02);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(0.08, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
      noise.connect(ng).connect(this.gains.click);
      noise.start(t);
    } catch (e) {
      console.warn('CyberCalc: click sound failed', e);
    }
  }

  /* ── Error tone ────────────────────────────────────── */
  playError() {
    if (!this.enabled.error || !this._ensure()) return;
    try {
      const t = this.ctx.currentTime;

      [120, 125].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        env.gain.setValueAtTime(0.2, t + i * 0.05);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.4 + i * 0.05);
        osc.connect(env).connect(this.gains.error);
        osc.start(t + i * 0.05);
        osc.stop(t + 0.5);
      });
    } catch (e) {
      console.warn('CyberCalc: error sound failed', e);
    }
  }

  /* ── Ambient cyberpunk music ───────────────────────── */
  _buildAmbientLayer(layer, t) {
    switch (layer) {
      case 'drone': {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 55;
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.12, t + 2);
        osc.connect(env).connect(this.gains.ambient);
        osc.start(t);
        return { nodes: [osc], gain: env };
      }
      case 'pad': {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 110;
        lfo.type = 'sine';
        lfo.frequency.value = 0.4;
        lfoGain.gain.value = 0.06;
        lfo.connect(lfoGain).connect(env.gain);
        env.gain.setValueAtTime(0.1, t);
        osc.connect(env).connect(this.gains.ambient);
        osc.start(t);
        lfo.start(t);
        return { nodes: [osc, lfo], gain: env };
      }
      case 'shimmer': {
        const bufSize = Math.floor(this.ctx.sampleRate * 3);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 4000;
        filter.Q.value = 0.5;
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.025, t + 3);
        src.connect(filter).connect(env).connect(this.gains.ambient);
        src.start(t);
        return { nodes: [src], gain: env };
      }
    }
  }

  startAmbient() {
    if (!this.enabled.ambient || this.ambientStarted || !this._ensure()) return;
    this.ambientStarted = true;

    const start = () => {
      if (!this.ambientStarted) return;
      const t = this.ctx.currentTime;
      const layers = ['drone', 'pad', 'shimmer'];
      const result = layers.map(l => this._buildAmbientLayer(l, t));
      this.ambientNodes.push(...result);
    };

    start();

    // Re-build layers every ~8s so oscillators don't run into their natural
    // stop due to browser optimisations. Old layers are faded out before
    // being replaced.
    this.ambientInterval = setInterval(() => {
      if (!this.ambientStarted || !this.ctx) return;

      // Fade out old nodes
      const now = this.ctx.currentTime;
      this.ambientNodes.forEach(n => {
        if (n.gain) {
          n.gain.gain.setValueAtTime(n.gain.gain.value || 0.05, now);
          n.gain.gain.linearRampToValueAtTime(0.001, now + 1);
        }
      });
      // Stop old oscillator nodes after fade-out
      this.ambientNodes.forEach(n => {
        n.nodes.forEach(node => {
          try { node.stop(now + 1); } catch { /* already stopped */ }
        });
      });
      this.ambientNodes = [];

      // Start fresh layers (overlapping fade)
      const t2 = this.ctx.currentTime + 1;
      const layers = ['drone', 'pad', 'shimmer'];
      const result = layers.map(l => this._buildAmbientLayer(l, t2));
      this.ambientNodes.push(...result);
    }, 10000);
  }

  stopAmbient() {
    this.ambientStarted = false;

    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }

    if (this.ctx) {
      const t = this.ctx.currentTime;
      this.ambientNodes.forEach(n => {
        if (n.gain) n.gain.gain.linearRampToValueAtTime(0.001, t + 0.5);
        n.nodes.forEach(node => {
          try { node.stop(t + 0.5); } catch { /* already stopped */ }
        });
      });
    }
    this.ambientNodes = [];
  }
}

// Singleton
window.sound = new SoundEngine();
