# PAC Mobile App

## 📱 Overview
This is the mobile application for the PAC system, built with React Native (Expo).

## 🚀 Setup

1. **Install Dependencies**:
   ```powershell
   npm install
   ```

2. **Run in Development**:
   ```powershell
   npx expo start
   ```
   - Press `a` for Android Emulator
   - Press `i` for iOS Simulator
   - Scan QR code with Expo Go

## 📦 Building APK (Android)

### Option 1: EAS (Recommended)
If you have an Expo account:
```powershell
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
This will generate a downloadable link for the APK.

### Option 2: Local Build (Requires Android SDK)
If you have Android Studio installed:

1. **Generate Native Code**:
   ```powershell
   npx expo prebuild
   ```

2. **Compile APK**:
   ```powershell
   cd android
   .\gradlew assembleDebug
   ```

3. **Locate APK**:
   The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`
