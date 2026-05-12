import tokens from '../design/tokens.json' with { type: 'json' };

export function getColorToken(name) {
  return tokens.colors[name] || null;
}

export function listIconNames() {
  return ['calc', 'sync', 'ar', 'glitch', 'community'];
}

export function validateDesignTokens(input = tokens) {
  const requiredColors = ['background', 'panel', 'surface', 'cyan', 'magenta', 'yellow', 'green', 'text'];
  const missingColors = requiredColors.filter((name) => !input.colors?.[name]);
  const hasMotion = Boolean(input.motion?.glitchBurst && input.motion?.tracePulse);
  const hasTypography = Boolean(input.typography?.mono && input.typography?.displayWeight);

  return {
    valid: missingColors.length === 0 && hasMotion && hasTypography,
    missingColors,
    hasMotion,
    hasTypography,
  };
}
