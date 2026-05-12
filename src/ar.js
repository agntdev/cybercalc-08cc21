export function classifyArSupport({ isSecureContext = true, hasXR = false, immersiveAr = false } = {}) {
  if (!isSecureContext) return 'blocked-insecure-context';
  if (hasXR && immersiveAr) return 'webxr-arcore-arkit';
  if (hasXR) return 'webxr-no-immersive-ar';
  return 'fallback-hologram';
}

export function buildArSessionOptions(domOverlayRoot) {
  const options = {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['light-estimation', 'local-floor'],
  };

  if (domOverlayRoot) {
    options.optionalFeatures.push('dom-overlay');
    options.domOverlay = { root: domOverlayRoot };
  }

  return options;
}

export function computeHologramTransform(pointer, rect) {
  if (!pointer || !rect || rect.width <= 0 || rect.height <= 0) {
    return { rotateX: 0, rotateY: 0, scale: 1 };
  }

  const x = (pointer.x - rect.left) / rect.width - 0.5;
  const y = (pointer.y - rect.top) / rect.height - 0.5;

  return {
    rotateX: Number((-y * 14).toFixed(2)),
    rotateY: Number((x * 16).toFixed(2)),
    scale: Number((1.02 - Math.min(0.04, Math.abs(x * y))).toFixed(3)),
  };
}

export function interpretGesture({ start, end, elapsedMs = 0 } = {}) {
  if (!start || !end) return 'none';

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);

  if (distance < 12 && elapsedMs > 450) return 'hold';
  if (distance < 12) return 'tap';

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'swipe-right' : 'swipe-left';
  }

  return dy > 0 ? 'swipe-down' : 'swipe-up';
}

export function spatialPanFromPointer(pointer, width) {
  if (!pointer || !width || width <= 0) return 0;
  const pan = (pointer.x / width) * 2 - 1;
  return Number(Math.max(-1, Math.min(1, pan)).toFixed(3));
}
