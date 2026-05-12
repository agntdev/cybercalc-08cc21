import {
  buildArSessionOptions,
  classifyArSupport,
  computeHologramTransform,
  interpretGesture,
  spatialPanFromPointer,
} from '../src/ar.js';

const THREE_URL = 'https://unpkg.com/three@0.164.1/build/three.module.js';

class CyberCalcAr {
  constructor() {
    this.mode = 'checking';
    this.session = null;
    this.hologram = null;
    this.statusEl = null;
    this.button = null;
    this.pointerStart = null;
    this.pointerStartTime = 0;
    this.audioCtx = null;
    this.panner = null;
  }

  async init() {
    this.statusEl = document.getElementById('arStatus');
    this.button = document.getElementById('arToggle');
    this.button?.addEventListener('click', () => this.toggle());

    const hasXR = Boolean(navigator.xr);
    let immersiveAr = false;
    if (hasXR) {
      try {
        immersiveAr = await navigator.xr.isSessionSupported('immersive-ar');
      } catch {
        immersiveAr = false;
      }
    }

    this.mode = classifyArSupport({
      isSecureContext: window.isSecureContext !== false,
      hasXR,
      immersiveAr,
    });
    this.updateStatus(this.mode === 'webxr-arcore-arkit' ? 'AR ready' : 'fallback ready');
    this.installFallback();
  }

  async toggle() {
    if (this.session) {
      await this.session.end();
      return;
    }

    if (this.mode === 'webxr-arcore-arkit') {
      await this.startWebXr();
    } else {
      this.toggleFallback();
    }
  }

  installFallback() {
    this.hologram = document.createElement('div');
    this.hologram.className = 'ar-hologram';
    this.hologram.setAttribute('aria-hidden', 'true');
    this.hologram.innerHTML = `
      <div class="ar-hologram-label">AR fallback</div>
      <div class="ar-hologram-value" id="arDisplayMirror">0</div>
      <div class="ar-hologram-hint">tap · hold · swipe</div>
    `;
    document.body.appendChild(this.hologram);

    const display = document.getElementById('display');
    const mirror = document.getElementById('arDisplayMirror');
    const syncDisplay = () => {
      if (mirror && display) mirror.textContent = display.textContent;
    };
    syncDisplay();
    if (display) {
      new MutationObserver(syncDisplay).observe(display, { childList: true, characterData: true, subtree: true });
    }

    this.hologram.addEventListener('pointerdown', (event) => {
      this.pointerStart = { x: event.clientX, y: event.clientY };
      this.pointerStartTime = performance.now();
      this.playSpatialBlip(event);
    });
    this.hologram.addEventListener('pointermove', (event) => this.tilt(event));
    this.hologram.addEventListener('pointerup', (event) => this.handleGesture(event));
  }

  toggleFallback() {
    document.body.classList.toggle('ar-mode');
    const active = document.body.classList.contains('ar-mode');
    this.updateStatus(active ? 'fallback active' : 'fallback ready');
  }

  tilt(event) {
    const target = this.hologram || document.querySelector('.calculator');
    if (!target) return;

    const transform = computeHologramTransform(
      { x: event.clientX, y: event.clientY },
      target.getBoundingClientRect(),
    );
    target.style.setProperty('--ar-rotate-x', `${transform.rotateX}deg`);
    target.style.setProperty('--ar-rotate-y', `${transform.rotateY}deg`);
    target.style.setProperty('--ar-scale', String(transform.scale));
  }

  handleGesture(event) {
    const gesture = interpretGesture({
      start: this.pointerStart,
      end: { x: event.clientX, y: event.clientY },
      elapsedMs: performance.now() - this.pointerStartTime,
    });

    this.hologram?.setAttribute('data-gesture', gesture);
    this.updateStatus(gesture);
    this.playSpatialBlip(event);
  }

  playSpatialBlip(event) {
    try {
      this.audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const t = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      this.panner ||= this.audioCtx.createStereoPanner();
      this.panner.pan.value = spatialPanFromPointer({ x: event.clientX }, window.innerWidth);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, t);
      osc.frequency.exponentialRampToValueAtTime(720, t + 0.09);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain).connect(this.panner).connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch {
      // Audio is optional in fallback mode.
    }
  }

  async startWebXr() {
    try {
      const THREE = await import(THREE_URL);
      const session = await navigator.xr.requestSession(
        'immersive-ar',
        buildArSessionOptions(document.body),
      );
      this.session = session;
      document.body.classList.add('ar-mode');
      this.updateStatus('webxr active');

      const canvas = document.querySelector('.cyber-3d') || document.createElement('canvas');
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.xr.enabled = true;
      await renderer.xr.setSession(session);

      session.addEventListener('end', () => {
        this.session = null;
        document.body.classList.remove('ar-mode');
        this.updateStatus('AR ready');
      });
    } catch {
      this.mode = 'fallback-hologram';
      this.toggleFallback();
    }
  }

  updateStatus(text) {
    if (this.statusEl) this.statusEl.textContent = text;
  }
}

if (typeof window !== 'undefined') {
  window.cyberAr = new CyberCalcAr();
  window.addEventListener('DOMContentLoaded', () => window.cyberAr.init(), { once: true });
}
