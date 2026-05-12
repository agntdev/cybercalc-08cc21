import { describe, expect, it } from 'vitest';

import {
  clamp,
  computeGlowStrength,
  createCircuitSegments,
  createGlitchFrames,
  DEFAULT_GRID,
} from '../src/effects.js';

describe('visual effects helpers', () => {
  it('clamps finite values into the requested range', () => {
    expect(clamp(-1)).toBe(0);
    expect(clamp(0.4)).toBe(0.4);
    expect(clamp(3, 0, 2)).toBe(2);
  });

  it('falls back to the minimum for non-finite values', () => {
    expect(clamp(Number.NaN, 0.2, 1)).toBe(0.2);
    expect(clamp(Infinity, 0.2, 1)).toBe(0.2);
  });

  it('computes stronger glow near the center of the calculator', () => {
    const rect = { left: 100, top: 100, width: 200, height: 200 };

    expect(computeGlowStrength({ x: 200, y: 200 }, rect)).toBeGreaterThan(
      computeGlowStrength({ x: 100, y: 100 }, rect),
    );
  });

  it('creates bounded circuit traces across the viewport', () => {
    const segments = createCircuitSegments(320, 240, {
      columns: 4,
      rows: 3,
      margin: 10,
    });

    expect(segments.length).toBeGreaterThan(DEFAULT_GRID.rows);
    for (const segment of segments) {
      expect(segment.x1).toBeGreaterThanOrEqual(10);
      expect(segment.y1).toBeGreaterThanOrEqual(10);
      expect(segment.x2).toBeLessThanOrEqual(310);
      expect(segment.y2).toBeLessThanOrEqual(230);
    }
  });

  it('builds deterministic glitch frames from brand text', () => {
    expect(createGlitchFrames('CyberCalc')).toEqual(createGlitchFrames('CyberCalc'));
    expect(createGlitchFrames('CyberCalc')).not.toEqual(createGlitchFrames('Other'));
  });
});
