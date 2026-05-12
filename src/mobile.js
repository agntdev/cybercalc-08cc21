export function normalizePushToken(token) {
  const value = String(token || '').trim();
  if (!value) return null;
  return value.replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 180);
}

export function buildPlatformConfig(platform) {
  if (platform === 'ios') {
    return {
      platform,
      safeArea: true,
      supportsTablet: true,
      notificationMode: 'remote-notification',
      artifact: 'ipa',
    };
  }

  if (platform === 'android') {
    return {
      platform,
      adaptiveIcon: true,
      notificationPermission: 'POST_NOTIFICATIONS',
      artifact: 'aab',
    };
  }

  return {
    platform: 'preview',
    safeArea: true,
    artifact: 'expo-preview',
  };
}

export function appStoreReadiness({ ios = {}, android = {}, push = {} } = {}) {
  const blockers = [];
  if (!ios.bundleIdentifier) blockers.push('ios.bundleIdentifier');
  if (!android.package) blockers.push('android.package');
  if (!push.handler) blockers.push('push.handler');
  if (!push.permissionCopy) blockers.push('push.permissionCopy');

  return {
    ready: blockers.length === 0,
    blockers,
    platforms: ['ios', 'android'],
  };
}
