import { describe, expect, it } from 'vitest';

import {
  buildArSessionOptions,
  classifyArSupport,
  computeHologramTransform,
  interpretGesture,
  spatialPanFromPointer,
} from '../src/ar.js';

describe('AR helpers', () => {
  it('classifies WebXR AR support and fallback states', () => {
    expect(classifyArSupport({ hasXR: true, immersiveAr: true })).toBe('webxr-arcore-arkit');
    expect(classifyArSupport({ hasXR: true, immersiveAr: false })).toBe('webxr-no-immersive-ar');
    expect(classifyArSupport({ hasXR: false })).toBe('fallback-hologram');
    expect(classifyArSupport({ isSecureContext: false, hasXR: true, immersiveAr: true })).toBe(
      'blocked-insecure-context',
    );
  });

  it('builds ARCore/ARKit-ready WebXR session options', () => {
    const root = { nodeType: 1 };
    expect(buildArSessionOptions(root)).toEqual({
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['light-estimation', 'local-floor', 'dom-overlay'],
      domOverlay: { root },
    });
  });

  it('tilts the hologram based on pointer position', () => {
    const transform = computeHologramTransform(
      { x: 250, y: 100 },
      { left: 100, top: 50, width: 200, height: 200 },
    );

    expect(transform.rotateY).toBeGreaterThan(0);
    expect(transform.rotateX).toBeGreaterThan(0);
    expect(transform.scale).toBeGreaterThanOrEqual(0.98);
  });

  it('detects fallback gestures', () => {
    expect(interpretGesture({ start: { x: 0, y: 0 }, end: { x: 80, y: 10 } })).toBe('swipe-right');
    expect(interpretGesture({ start: { x: 0, y: 80 }, end: { x: 0, y: 0 } })).toBe('swipe-up');
    expect(interpretGesture({ start: { x: 10, y: 10 }, end: { x: 12, y: 11 } })).toBe('tap');
    expect(interpretGesture({ start: { x: 10, y: 10 }, end: { x: 12, y: 11 }, elapsedMs: 600 })).toBe('hold');
  });

  it('maps pointer position to spatial audio pan', () => {
    expect(spatialPanFromPointer({ x: 0 }, 400)).toBe(-1);
    expect(spatialPanFromPointer({ x: 200 }, 400)).toBe(0);
    expect(spatialPanFromPointer({ x: 400 }, 400)).toBe(1);
  });
});
