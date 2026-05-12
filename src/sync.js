export const SYNC_SCHEMA_VERSION = 1;
export const MAX_HISTORY_ITEMS = 50;
export const MAX_OFFLINE_QUEUE = 25;

const ALLOWED_THEMES = new Set(['neon', 'matrix', 'midnight']);
const ALLOWED_MOTION = new Set(['full', 'reduced']);

function cleanText(value, maxLength = 120) {
  return String(value ?? '')
    .replace(/[<>{}\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function stableRecordId(expression, result, createdAt) {
  let hash = 0;
  const source = `${expression}|${result}|${createdAt}`;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return `calc_${hash.toString(36)}`;
}

export function createCalculationRecord({ expression, result, createdAt, id }) {
  const safeExpression = cleanText(expression);
  const safeResult = cleanText(result, 80);
  const timestamp = Number.isFinite(Date.parse(createdAt))
    ? new Date(createdAt).toISOString()
    : new Date().toISOString();

  return {
    id: id || stableRecordId(safeExpression, safeResult, timestamp),
    expression: safeExpression,
    result: safeResult,
    createdAt: timestamp,
  };
}

export function mergeHistory(localHistory = [], remoteHistory = []) {
  const byId = new Map();

  for (const item of [...remoteHistory, ...localHistory]) {
    if (!item || !item.expression || !item.result) continue;
    const record = createCalculationRecord(item);
    byId.set(record.id, record);
  }

  return [...byId.values()]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, MAX_HISTORY_ITEMS);
}

export function sanitizePreferences(input = {}) {
  const theme = ALLOWED_THEMES.has(input.theme) ? input.theme : 'neon';
  const motion = ALLOWED_MOTION.has(input.motion) ? input.motion : 'full';
  const soundEnabled = input.soundEnabled !== false;

  return {
    theme,
    motion,
    soundEnabled,
  };
}

export function buildSyncPayload({ history = [], preferences = {}, deviceId, updatedAt }) {
  return {
    schemaVersion: SYNC_SCHEMA_VERSION,
    deviceId: cleanText(deviceId || 'anonymous-device', 80),
    updatedAt: Number.isFinite(Date.parse(updatedAt))
      ? new Date(updatedAt).toISOString()
      : new Date().toISOString(),
    history: mergeHistory(history),
    preferences: sanitizePreferences(preferences),
  };
}

export function queueOfflineOperation(queue = [], operation, limit = MAX_OFFLINE_QUEUE) {
  const next = [...queue, {
    id: operation.id || stableRecordId(operation.type || 'sync', operation.createdAt || '', Date.now()),
    type: cleanText(operation.type || 'push', 40),
    createdAt: Number.isFinite(Date.parse(operation.createdAt))
      ? new Date(operation.createdAt).toISOString()
      : new Date().toISOString(),
  }];

  return next.slice(Math.max(0, next.length - limit));
}

export function firebaseConfigReady(config = {}) {
  return Boolean(
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.appId,
  );
}

export function userStatePath(userId) {
  const safeUser = cleanText(userId || 'local-user', 64).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `users/${safeUser}/cybercalc/state`;
}
