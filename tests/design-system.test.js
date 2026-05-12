import { describe, expect, it } from 'vitest';

import { getColorToken, listIconNames, validateDesignTokens } from '../src/design-system.js';

describe('design system', () => {
  it('validates required visual foundations', () => {
    expect(validateDesignTokens()).toEqual({
      valid: true,
      missingColors: [],
      hasMotion: true,
      hasTypography: true,
    });
  });

  it('exposes neon color tokens', () => {
    expect(getColorToken('cyan')).toBe('#00f0ff');
    expect(getColorToken('magenta')).toBe('#ff00aa');
    expect(getColorToken('missing')).toBeNull();
  });

  it('lists the icon set delivered in icons.svg', () => {
    expect(listIconNames()).toEqual(['calc', 'sync', 'ar', 'glitch', 'community']);
  });
});
