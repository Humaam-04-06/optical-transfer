# ⚡ SpectraBeam - Air-Gapped Optical File Transfer System

> **Zero-Network, Zero-RF, Zero-Pairing Light Transmission System**  
> Powered by Luby Transform (LT) Fountain Codes, WebAssembly ZXing C++ Engine, and SpectraVault™ AES-256-GCM Encryption.

---

## 📱 Direct Mobile Download (Android APK)

You can download and run SpectraBeam directly on your Android phone from GitHub:

[![Direct Download APK](https://img.shields.io/badge/Download_APK-v1.0.0_Release-8B5CF6?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Humaam-04-06/optical-transfer/releases/tag/v1.0.0)

### 📲 How to Download & Run on Your Phone:

#### Option A: Using GitHub Mobile App
1. Open the **GitHub Mobile App** on your phone (make sure you are logged into your `Humaam-04-06` account).
2. Go to your repository: **`optical-transfer`**.
3. Tap on **Releases** (or scroll to the **Releases** section).
4. Tap **v1.0.0** → Under **Assets**, tap **`SpectraBeam.apk`**.
5. Once downloaded, tap the notification to **Install**.
6. Open **SpectraBeam** and you're ready!

#### Option B: Using Mobile Browser (Chrome / Safari / Firefox)
1. Navigate to: [https://github.com/Humaam-04-06/optical-transfer/releases/tag/v1.0.0](https://github.com/Humaam-04-06/optical-transfer/releases/tag/v1.0.0)
2. Log into your GitHub account if prompted.
3. Tap **`SpectraBeam.apk`** under the **Assets** dropdown.
4. If Android asks *"File might be harmful"* or prompts for *"Install unknown apps"*, tap **Download anyway** / **Allow from this source**.
5. Tap **Open** / **Install**.

---

## 🛡️ Core Highlights

- 📴 **Zero RF Emissions**: Works with Wi-Fi, Bluetooth, NFC, and Cellular Data permanently turned OFF.
- ⚡ **High-Speed Fountain Streaming**: 30 to 120 FPS Luby Transform code streams with deterministic IEEE-754 Soliton distribution.
- 🔒 **SpectraVault™ AES-256-GCM**: End-to-end authenticated encryption derived via PBKDF2 with anti-shoulder-surfing visual stroboscopic noise.
- 📷 **High-Speed Hardware Camera Reticle**: Multi-threaded Web Workers running ZXing-C++ in WebAssembly for real-time frame peeling.
- 💼 **AirEnclave™ Cold Storage**: Air-gapped Bitcoin PSBT (BIP-174) transaction signer and offline password vault synchronizer.
- 🎨 **Playful Geometric Design**: 100% responsive on all screen sizes (mobile, tablet, desktop) with dark/light mode toggle.

---

## 💻 Running the Web App Locally

```bash
# Clone the repository
git clone https://github.com/Humaam-04-06/optical-transfer.git
cd optical-transfer

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## 🏗️ Building the Android APK from Source

```powershell
# Build web production bundle
npm run build

# Sync assets to Capacitor Android
npx cap sync android

# Compile debug APK using Gradle
.\android\gradlew.bat -p android assembleDebug
```
The compiled APK will be created at: `android/app/build/outputs/apk/debug/app-debug.apk`.
