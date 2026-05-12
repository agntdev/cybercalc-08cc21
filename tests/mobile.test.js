import { describe, expect, it } from 'vitest';

import {
  appStoreReadiness,
  buildPlatformConfig,
  normalizePushToken,
} from '../src/mobile.js';

describe('mobile framework helpers', () => {
  it('normalizes Expo push tokens before storage', () => {
    expect(normalizePushToken(' ExpoPushToken[abc:def] ')).toBe('ExpoPushTokenabc:def');
    expect(normalizePushToken('')).toBeNull();
  });

  it('builds iOS platform optimization metadata', () => {
    expect(buildPlatformConfig('ios')).toEqual({
      platform: 'ios',
      safeArea: true,
      supportsTablet: true,
      notificationMode: 'remote-notification',
      artifact: 'ipa',
    });
  });

  it('builds Android platform optimization metadata', () => {
    expect(buildPlatformConfig('android')).toMatchObject({
      platform: 'android',
      adaptiveIcon: true,
      notificationPermission: 'POST_NOTIFICATIONS',
      artifact: 'aab',
    });
  });

  it('reports app-store submission blockers', () => {
    expect(appStoreReadiness({
      ios: { bundleIdentifier: 'ai.agnt.cybercalc' },
      android: { package: 'ai.agnt.cybercalc' },
      push: { handler: true, permissionCopy: true },
    })).toEqual({
      ready: true,
      blockers: [],
      platforms: ['ios', 'android'],
    });

    expect(appStoreReadiness().blockers).toContain('ios.bundleIdentifier');
  });
});
