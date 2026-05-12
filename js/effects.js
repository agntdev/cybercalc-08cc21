import {
  computeGlowStrength,
  createCircuitSegments,
  createGlitchFrames,
} from '../src/effects.js';

const THREE_URL = 'https://unpkg.com/three@0.164.1/build/three.module.js';

function ensureLayer(className, parent = document.body) {
  let layer = document.querySelector(`.${className}`);
  if (!layer) {
    layer = document.createElement('div');
    layer.className = className;
    layer.setAttribute('aria-hidden', 'true');
    parent.prepend(layer);
  }
  return layer;
}

function installCircuitBackground() {
  const layer = ensureLayer('circuit-layer');
  const width = Math.max(window.innerWidth, 360);
  const height = Math.max(window.innerHeight, 640);
  const segments = createCircuitSegments(width, height, {
    columns: width > 800 ? 12 : 7,
    rows: height > 800 ? 8 : 5,
    margin: 32,
  });

  layer.innerHTML = segments
    .map((segment, index) => {
      const isHorizontal = segment.y1 === segment.y2;
      const left = Math.min(segment.x1, segment.x2);
      const top = Math.min(segment.y1, segment.y2);
      const length = isHorizontal
        ? Math.abs(segment.x2 - segment.x1)
        : Math.abs(segment.y2 - segment.y1);
      const style = isHorizontal
        ? `left:${left}px;top:${top}px;width:${length}px;height:1px;animation-delay:${index * 70}ms`
        : `left:${left}px;top:${top}px;width:1px;height:${length}px;animation-delay:${index * 70}ms`;

      return `<span class="circuit-trace ${isHorizontal ? 'h' : 'v'}" style="${style}"></span>`;
    })
    .join('');
}

function installDynamicLighting(calculator) {
  const target = calculator || document.querySelector('.calculator');
  const update = (event) => {
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;

    document.body.style.setProperty('--pointer-x', `${x}px`);
    document.body.style.setProperty('--pointer-y', `${y}px`);

    if (target) {
      const strength = computeGlowStrength({ x, y }, target.getBoundingClientRect());
      target.style.setProperty('--glow-cyan-size', `${12 + 14 * strength}px`);
      target.style.setProperty('--glow-magenta-size', `${30 + 36 * strength}px`);
    }
  };

  window.addEventListener('pointermove', update, { passive: true });
  window.addEventListener('focus', update);
  update();
}

function installGlitchBursts() {
  const frames = createGlitchFrames('CyberCalc');
  let frame = 0;
  let timeoutId = null;

  const trigger = () => {
    const current = frames[frame % frames.length];
    frame += 1;
    document.body.style.setProperty('--glitch-x', `${current.x}px`);
    document.body.style.setProperty('--glitch-y', `${current.y}px`);
    document.body.style.setProperty('--glitch-skew', `${current.skew}deg`);
    document.body.style.setProperty('--glitch-opacity', String(current.opacity));
    document.body.classList.add('glitching');

    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => document.body.classList.remove('glitching'), 180);
  };

  document.getElementById('buttons')?.addEventListener('click', trigger);
  document.addEventListener('keydown', (event) => {
    if (event.key.length === 1 || ['Enter', 'Backspace', 'Escape'].includes(event.key)) {
      trigger();
    }
  });
}

async function installThreeScene() {
  const canvas = document.createElement('canvas');
  canvas.className = 'cyber-3d';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  try {
    const THREE = await import(THREE_URL);
    canvas.dataset.engine = 'three.js r164';
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    const geometry = new THREE.TorusKnotGeometry(1.2, 0.22, 96, 12);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.32,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const magenta = new THREE.PointLight(0xff00aa, 1.4, 8);
    const cyan = new THREE.PointLight(0x00f0ff, 1.1, 8);

    scene.add(mesh, magenta, cyan);
    camera.position.z = 4.5;
    magenta.position.set(-2, 1.4, 2);
    cyan.position.set(2, -1.2, 2);

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const render = () => {
      mesh.rotation.x += 0.0028;
      mesh.rotation.y += 0.004;
      magenta.intensity = 1.1 + Math.sin(Date.now() / 580) * 0.25;
      renderer.render(scene, camera);
      window.requestAnimationFrame(render);
    };

    window.addEventListener('resize', resize);
    resize();
    render();
  } catch {
    canvas.dataset.engine = 'css-fallback';
    canvas.classList.add('cyber-3d-fallback');
  }
}

export function bootCyberEffects() {
  installCircuitBackground();
  installDynamicLighting(document.querySelector('.calculator'));
  installGlitchBursts();
  installThreeScene();
  window.addEventListener('resize', installCircuitBackground);
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', bootCyberEffects, { once: true });
}
