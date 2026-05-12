# CyberCalc Mobile Submission Checklist

## iOS

- Bundle identifier: `ai.agnt.cybercalc`
- Build profile: `production`
- Submission command: `npm run submit:ios`
- Required owner input: App Store Connect app id, screenshots, privacy answers.

## Android

- Package: `ai.agnt.cybercalc`
- Build artifact: Android App Bundle.
- Submission command: `npm run submit:android`
- Required owner input: Play Console app, screenshots, store listing, privacy answers.

## Shared

- Push notifications use Expo notification permissions and a foreground handler.
- Preview builds target iOS Simulator and Android APK for quick device smoke.
- Production builds auto-increment through EAS.
