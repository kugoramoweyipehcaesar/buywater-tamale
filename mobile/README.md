# BuyWater Tamale – Mobile (PWA + Capacitor APK)

Your live site: https://buywater-tamale.onrender.com  
Package: `com.buywater.tamale`  
App name: **BuyWater Tamale**

Backend is **not** changed. The app is a shell around the live website.

---

## 1) Progressive Web App (already in main repo)

After deploy, on Android Chrome:
1. Open https://buywater-tamale.onrender.com
2. Menu → **Install app** / **Add to Home screen**
3. Opens fullscreen like a native app (no Play Store fee)

on iPhone Safari:
1. Share → **Add to Home Screen**

Files:
- `/public/manifest.json`
- `/public/sw.js`
- `/components/PwaRegister.js`

---

## 2) Free Android APK with Capacitor (load live URL)

### Prerequisites (one time)
- Node.js 18+
- Java 17 JDK
- Android SDK command-line tools **or** Android Studio (free)

### Commands (from this `mobile/` folder)

```bash
cd mobile
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/splash-screen @capacitor/app

# Copy config (already present as capacitor.config.json)
npx cap add android
npx cap copy
npx cap open android
```

Or without opening Android Studio (CLI build):

```bash
cd android
./gradlew assembleDebug
```

Debug APK path:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Install on phone via USB or copy the APK (sideload). **No Google Play fee** required for personal use.

### Important: capacitor.config.json

```json
{
  "appId": "com.buywater.tamale",
  "appName": "BuyWater Tamale",
  "webDir": "www",
  "server": {
    "url": "https://buywater-tamale.onrender.com",
    "cleartext": true
  }
}
```

The WebView loads your **live Render site** — login, orders, admin emails keep working exactly as on the website.

---

## 3) Free APK via PWABuilder.com (easiest, no Android Studio)

1. Deploy the PWA changes to Render
2. Open https://www.pwabuilder.com/
3. Enter: `https://buywater-tamale.onrender.com`
4. Click **Start** → **Package for stores** → **Android**
5. Download the APK / ZIP package
6. Install on your phone

Still free for sideloading. Play Store listing is optional and has a one-time developer fee if you choose it later.

---

## 4) iOS

- Easiest free path: **Add to Home Screen** from Safari (PWA)
- Native IPA with Capacitor needs a Mac + Xcode + Apple Developer account ($99/yr) to install on non-dev devices

```bash
npx cap add ios
npx cap copy
npx cap open ios
```

---

## 5) Push notifications note

Local notifications after placing an order can use the browser Notification API (already wired via service worker message).

True **push when the app is closed** needs Firebase Cloud Messaging (FCM) + server keys — optional later; does not block APK/PWA use.

---

## 6) App icons

Place PNG icons in the main site `public/icons/`:
- `icon-192.png`
- `icon-512.png`

You can export these from your logo at https://www.pwabuilder.com/imageGenerator or any icon tool.
