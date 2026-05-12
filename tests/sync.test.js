import { describe, expect, it } from 'vitest';

import {
  buildSyncPayload,
  createCalculationRecord,
  firebaseConfigReady,
  MAX_HISTORY_ITEMS,
  queueOfflineOperation,
  sanitizePreferences,
  userStatePath,
} from '../src/sync.js';

describe('cloud sync helpers', () => {
  it('sanitizes calculation records before storage', () => {
    const record = createCalculationRecord({
      expression: '<2 + 2>',
      result: '{4}',
      createdAt: '2026-05-12T18:00:00Z',
    });

    expect(record.expression).toBe('2 + 2');
    expect(record.result).toBe('4');
    expect(record.createdAt).toBe('2026-05-12T18:00:00.000Z');
    expect(record.id).toMatch(/^calc_/);
  });

  it('caps history in newest-first order', () => {
    const history = Array.from({ length: MAX_HISTORY_ITEMS + 5 }, (_, index) => ({
      expression: `${index} + 1`,
      result: String(index + 1),
      createdAt: new Date(Date.UTC(2026, 4, 12, 18, index)).toISOString(),
    }));

    const payload = buildSyncPayload({ history, deviceId: 'device-1' });

    expect(payload.history).toHaveLength(MAX_HISTORY_ITEMS);
    expect(payload.history[0].expression).toBe('54 + 1');
    expect(payload.history.at(-1).expression).toBe('5 + 1');
  });

  it('whitelists preference values', () => {
    expect(sanitizePreferences({
      theme: 'hacked',
      motion: 'wild',
      soundEnabled: false,
    })).toEqual({
      theme: 'neon',
      motion: 'full',
      soundEnabled: false,
    });
  });

  it('keeps the offline queue bounded', () => {
    const queue = Array.from({ length: 30 }, (_, index) => ({
      type: 'history',
      createdAt: new Date(Date.UTC(2026, 4, 12, 18, index)).toISOString(),
    }));

    expect(queueOfflineOperation(queue, { type: 'preferences' })).toHaveLength(25);
  });

  it('requires the Firebase fields needed for a real provider', () => {
    expect(firebaseConfigReady({
      apiKey: 'key',
      authDomain: 'example.firebaseapp.com',
      projectId: 'project',
      appId: 'app',
    })).toBe(true);
    expect(firebaseConfigReady({ apiKey: 'key' })).toBe(false);
  });

  it('builds a sanitized per-user Firestore path', () => {
    expect(userStatePath('demo/user@example.com')).toBe(
      'users/demo_user_example_com/cybercalc/state',
    );
  });
});
