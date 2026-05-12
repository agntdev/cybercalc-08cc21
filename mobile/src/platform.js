import { Platform } from 'react-native';

export function platformOptimizations(platform = Platform.OS) {
  if (platform === 'ios') {
    return {
      platform,
      summary: 'iOS: safe-area layout, tablet support, remote notification mode',
      preferredBuild: 'simulator preview + App Store production submit',
    };
  }

  if (platform === 'android') {
    return {
      platform,
      summary: 'Android: adaptive icon, notification permission, internal track submit',
      preferredBuild: 'APK preview + AAB production submit',
    };
  }

  return {
    platform,
    summary: 'Web/native fallback: shared calculator core and neon theme',
    preferredBuild: 'Expo preview',
  };
}
