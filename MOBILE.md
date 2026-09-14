# BuyWater Tamale → Mobile App (FREE)

Live site: **https://buywater-tamale.onrender.com**  
Package ID: `com.buywater.tamale`  
App name: **BuyWater Tamale**  
Theme color: `#0077C8`

Backend logic is unchanged. The app loads your live Render website.

---

## A) PWA (already in the repo)

### Files added
| File | Purpose |
|------|--------|
| `public/manifest.json` | App name, icons, standalone display |
| `public/sw.js` | Offline shell + cache |
| `components/PwaRegister.js` | Registers service worker |
| `app/layout.js` | Apple/Android install meta tags |

### Install on phone (no fee)
**Android Chrome**
1. Open https://buywater-tamale.onrender.com
2. Menu ⋮ → **Install app** / **Add to Home screen**

**iPhone Safari**
1. Share → **Add to Home Screen**

---

## B) Easiest free APK — PWABuilder (no Android Studio)

1. Wait for Render to redeploy with PWA files
2. Go to https://www.pwabuilder.com/
3. Paste: `https://buywater-tamale.onrender.com`
4. **Start** → **Package** → **Android**
5. Download APK / package ZIP
6. Transfer to phone and install (allow “unknown sources” if asked)

No Google Play fee for personal install.

---

## C) Capacitor APK on your laptop (FREE)

### 1. One-time tools
- Node.js 18+
- Java JDK 17
- Android Studio **or** command-line SDK (free from Google)

### 2. Commands

```bash
# clone your repo if needed
git clone https://github.com/kugoramoweyipehcaesar/buywater-tamale.git
cd buywater-tamale/mobile

npm install

# first time only
npx cap add android
npx cap sync

# open Android Studio, or build CLI debug APK:
npx cap open android
# OR:
cd android && ./gradlew assembleDebug
```

### 3. APK location
```text
mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

Install with USB:
```bash
adb install -r app-debug.apk
```

### capacitor.config.json (already in `mobile/`)

```json
{
  "appId": "com.buywater.tamale",
  "appName": "BuyWater Tamale",
  "webDir": "www",
  "server": {
    "url": "https://buywater-tamale.onrender.com",
    "cleartext": true
  },
  "android": {
    "allowMixedContent": true,
    "backgroundColor": "#0077C8"
  }
}
```

Login, orders, and admin SMTP emails all still run on Render — same as the website.

---

## D) iOS

| Method | Cost |
|--------|------|
| Safari “Add to Home Screen” (PWA) | Free |
| Capacitor + Xcode IPA | Needs Mac; Apple Developer $99/yr for public devices |

```bash
npx cap add ios
npx cap sync
npx cap open ios
```

---

## E) Icons / splash

Replace or generate:
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`

Tools: https://www.pwabuilder.com/imageGenerator (upload `public/logo.jpg`)

Capacitor splash uses blue `#0077C8` background (see config).

---

## F) Push notifications

- **Local** notification after placing an order: supported via service worker when the user grants permission.
- **Remote push** (app closed): needs Firebase Cloud Messaging — optional later; not required for APK/PWA.

---

## G) manifest.json (reference)

See `public/manifest.json` — name **BuyWater Tamale**, theme `#0077C8`, `display: standalone`.

## H) service-worker.js

See `public/sw.js` — caches shell assets; never caches `/api/*`.
