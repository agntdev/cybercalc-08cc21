export const DEFAULT_GRID = Object.freeze({
  columns: 7,
  rows: 5,
  margin: 8,
});

export function clamp(value, min = 0, max = 1) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function computeGlowStrength(pointer, rect) {
  if (!pointer || !rect || rect.width <= 0 || rect.height <= 0) return 0.5;

  const x = clamp((pointer.x - rect.left) / rect.width);
  const y = clamp((pointer.y - rect.top) / rect.height);
  const dx = x - 0.5;
  const dy = y - 0.5;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return Number(clamp(1 - distance * 1.25, 0.25, 1).toFixed(3));
}

export function createCircuitSegments(width, height, options = {}) {
  const grid = { ...DEFAULT_GRID, ...options };
  const usableWidth = Math.max(1, width - grid.margin * 2);
  const usableHeight = Math.max(1, height - grid.margin * 2);
  const colStep = usableWidth / Math.max(1, grid.columns - 1);
  const rowStep = usableHeight / Math.max(1, grid.rows - 1);
  const segments = [];

  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.columns; col += 1) {
      const x = Math.round(grid.margin + col * colStep);
      const y = Math.round(grid.margin + row * rowStep);

      if (col < grid.columns - 1 && (row + col) % 2 === 0) {
        segments.push({
          x1: x,
          y1: y,
          x2: Math.round(grid.margin + (col + 1) * colStep),
          y2: y,
        });
      }

      if (row < grid.rows - 1 && (row + col) % 3 !== 1) {
        segments.push({
          x1: x,
          y1: y,
          x2: x,
          y2: Math.round(grid.margin + (row + 1) * rowStep),
        });
      }
    }
  }

  return segments;
}

export function createGlitchFrames(seedText) {
  const source = String(seedText || 'cybercalc');
  const frames = [];

  for (let i = 0; i < Math.min(6, source.length); i += 1) {
    const code = source.charCodeAt(i);
    frames.push({
      x: ((code % 7) - 3) * 0.6,
      y: (((code >> 2) % 5) - 2) * 0.6,
      skew: ((code % 11) - 5) * 0.35,
      opacity: Number((0.55 + (code % 4) * 0.1).toFixed(2)),
    });
  }

  return frames;
}
