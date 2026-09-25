# ⚡ SpectraBeam - Air-Gapped Optical Data Transfer & Cold Enclave

<div align="center">

![SpectraBeam Logo](/public/favicon.svg)

### Zero-Network • Zero-RF • Zero-Pairing • Pure Photon Data Transmission

[![Release APK](https://img.shields.io/badge/Download_APK-v1.0.0_Release-8B5CF6?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Humaam-04-06/optical-transfer/releases/tag/v1.0.0)
[![Zero Network Air Gap](https://img.shields.io/badge/Air--Gap-100%25_Zero--RF-34D399?style=for-the-badge&logo=shield&logoColor=1E293B)](#-zero-trust-security-model)
[![WebAssembly](https://img.shields.io/badge/WASM-ZXing--C++_Decoder-FBBF24?style=for-the-badge&logo=webassembly&logoColor=1E293B)](#-technical-architecture)
[![Encryption](https://img.shields.io/badge/SpectraVault-AES--256--GCM-F472B6?style=for-the-badge&logo=lock&logoColor=white)](#-spectravault-zero-knowledge-encryption)
[![Responsive](https://img.shields.io/badge/Layout-100%25_Responsive-0EA5E9?style=for-the-badge&logo=css3&logoColor=white)](#-universal-responsive-design)

</div>

> **⚡ High-speed, zero-network optical air-gap data transfer system using Luby Transform fountain codes, WebAssembly ZXing, and SpectraVault AES-256-GCM encryption.**  
> Transmit confidential documents, archives, recovery phrases, and cold-storage Bitcoin PSBTs through pure visible light without Wi-Fi, Bluetooth, NFC, or USB cables.

### 🏷️ Topics & Tags
`#air-gap` • `#optical-transfer` • `#fountain-codes` • `#luby-transform` • `#qr-code` • `#webassembly` • `#zxing` • `#aes-256-gcm` • `#cryptography` • `#cold-storage` • `#bitcoin-psbt` • `#offline-first` • `#pwa` • `#capacitor` • `#android` • `#zero-trust` • `#cybersecurity` • `#privacy` • `#typescript` • `#tailwind-css`

---

## 📖 Table of Contents

- [1. Executive Summary & Vision](#-executive-summary--vision)
- [2. Direct Mobile Download (Android APK)](#-direct-mobile-download-android-apk)
- [3. Getting Started: How to Run the Web Application](#-getting-started-how-to-run-the-web-application)
- [4. Building the Android APK from Source](#-building-the-android-apk-from-source)
- [5. User Guide: How to Use Every Feature](#-user-guide-how-to-use-every-feature)
  - [Transmitting Files or Text Snippets](#1-transmitting-files-or-text-snippets)
  - [SpectraVault™ Zero-Knowledge Encryption](#2-spectravault-zero-knowledge-encryption)
  - [Receiving Data via Camera Viewfinder](#3-receiving-data-via-camera-viewfinder)
  - [Fallback Image Scanner (Testing on a Single PC)](#4-fallback-image-scanner-testing-on-a-single-pc)
  - [AirEnclave™ Bitcoin PSBT Signer & Password Vault Sync](#5-airenclave-bitcoin-psbt-signer--password-vault-sync)
  - [Diagnostics Lab & 120Hz Refresh Rate Benchmark](#6-diagnostics-lab--120hz-refresh-rate-benchmark)
- [6. Technical Architecture & Wire Protocol](#-technical-architecture--wire-protocol)
- [7. Zero-Trust Security Model](#-zero-trust-security-model)
- [8. Technology Stack & Dependencies](#-technology-stack--dependencies)
- [9. Repository & License](#-repository--license)

---

## 🌟 Executive Summary & Vision

**SpectraBeam** elevates physical air-gapped communication into a high-performance, mathematically confidential transmission system.

Traditional wireless communication (Wi-Fi, Bluetooth, NFC, Cellular) and physical connections (USB cables) are fundamentally exposed to wireless eavesdropping, man-in-the-middle packet sniffing, and BadUSB hardware compromise.

SpectraBeam transmits digital payloads exclusively via **photons (visible light)** beamed from a computer or phone display and ingested by any camera lens.

### Why SpectraBeam Outperforms Standard QR Codes:
- **Luby Transform (LT) Fountain Codes**: Traditional QR codes cannot handle large files because a single dropped frame destroys the transfer. SpectraBeam decomposes files into mathematical fountain blocks with a deterministic Soliton distribution. The receiver can catch frames in **any arbitrary order**, tolerate 40%+ dropped frames, and reconstruct the file effortlessly.
- **SpectraVault™ Authenticated E2EE**: While raw optical broadcast is visible to ambient cameras, SpectraVault encrypts frames using hardware-accelerated **AES-256-GCM** derived with PBKDF2 (100,000+ SHA-256 iterations) and anti-shoulder-surfing visual noise stroboscopic filters.
- **Multi-Core WebAssembly QR Engine**: Runs multi-threaded `zxing-cpp` compiled to WebAssembly inside background Web Workers, decoding frames at up to 60–120 FPS.
- **AirEnclave™ Bridge**: Built-in support for inspecting and signing raw Bitcoin Partially Signed Bitcoin Transactions (BIP-174) and transferring encrypted password manager vaults without network exposure.

---

## 📱 Direct Mobile Download (Android APK)

A standalone signed Android APK is published and available for direct installation:

👉 **GitHub Release v1.0.0:** [https://github.com/Humaam-04-06/optical-transfer/releases/tag/v1.0.0](https://github.com/Humaam-04-06/optical-transfer/releases/tag/v1.0.0)  
👉 **Direct APK Download Link:** [SpectraBeam.apk (4.5 MB)](https://github.com/Humaam-04-06/optical-transfer/releases/download/v1.0.0/SpectraBeam.apk)

### 📲 How to Install & Run on Your Android Device:

#### Option A: Direct Download via Mobile Browser
1. On your Android phone, open Chrome or your preferred browser.
2. Visit [https://github.com/Humaam-04-06/optical-transfer/releases/tag/v1.0.0](https://github.com/Humaam-04-06/optical-transfer/releases/tag/v1.0.0).
3. Under **Assets**, tap **`SpectraBeam.apk`**.
4. Once downloaded, tap the notification or open your phone's **Downloads** folder.
5. If Android displays *"For your security, your phone is not allowed to install unknown apps from this source"*:
   - Tap **Settings**
   - Toggle **Allow from this source**
   - Tap **Install**
6. Open **SpectraBeam** from your app drawer!

#### Option B: Via the GitHub Mobile App
1. Open the **GitHub Mobile App** on your phone (logged into your account).
2. Open your repository: **`optical-transfer`**.
3. Scroll to the **Releases** section and tap **v1.0.0**.
4. Under **Assets**, tap **`SpectraBeam.apk`** to download and install.

---

## 💻 Getting Started: How to Run the Web Application

The SpectraBeam Web App runs 100% client-side with zero external backend dependencies.

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0.0 or higher)
- `npm` (comes bundled with Node.js)
- A modern web browser (Google Chrome, Microsoft Edge, Brave, Safari, or Firefox) with Camera permissions enabled.

### 1. Clone the Repository
```bash
git clone https://github.com/Humaam-04-06/optical-transfer.git
cd optical-transfer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch Development Server
```bash
npm run dev
```
The server will start instantly (typically at `http://localhost:5173/`).  
Open your browser and navigate to:
```
http://localhost:5173/
```

### 4. Build for Production (Static PWA)
```bash
npm run build
npm run preview
```
The production bundle will be output to the `dist/` directory, ready to be hosted on GitHub Pages, Cloudflare Pages, Vercel, or any offline local web server.

---

## 🏗️ Building the Android APK from Source

SpectraBeam is wrapped into a native Android container using **Capacitor 7**, giving it direct hardware Camera2 API access, flashlight/torch hardware bindings, and system WakeLock.

### Prerequisites for Compiling Android:
- **Java Development Kit (JDK)**: OpenJDK 21 or higher.
- **Android SDK**: Android API Level 36 (`platforms/android-36`) and Build Tools (`34.0.0` or `35.0.0`).
- Ensure `JAVA_HOME` and `ANDROID_HOME` environment variables are properly set.

### Build Steps:

```powershell
# 1. Build the production web bundle
npm run build

# 2. Sync the web bundle into the Capacitor Android project
npx cap sync android

# 3. Compile the debug APK using Gradle
$env:JAVA_HOME = "C:\Program Files\Android\openjdk\jdk-21.0.8"
$env:ANDROID_HOME = "C:\Users\system angel\AppData\Local\Android\Sdk"
.\android\gradlew.bat -p android assembleDebug
```

The resulting standalone installable APK is located at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

To directly install it on a connected Android phone via ADB:
```powershell
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🎮 User Guide: How to Use Every Feature

### 1. Transmitting Files or Text Snippets
1. Navigate to **Transmit** (`#send`) in the navigation bar.
2. Select your data:
   - **File Mode**: Drag and drop any file (PDF, image, video, audio, archive, or code up to 64 MB) into the purple dropzone.
   - **Text Snippet Mode**: Paste confidential keys, recovery seed phrases, passwords, or code snippets into the text box and click **Load Snippet into Stream**.
3. Configure your optics:
   - **Frame Rate**: Choose between `30 FPS` (Standard displays), `60 FPS` (High refresh rate laptops), or `120 FPS` (Gaming monitors/phones).
   - **Block Size**: Choose `256 B` (best for mobile-to-mobile), `384 B` (balanced), or `512 B` (monitors).
   - **ChromaBeam™ RGB**: Toggle to enable 3-channel optical multiplexing.
4. Click **Start Transmitting**: The canvas will immediately begin animating fountain-coded QR frames.

### 2. SpectraVault™ Zero-Knowledge Encryption
1. On the **Transmit** page, switch on the **SpectraVault™ Encryption** toggle.
2. Enter a secret passphrase.
3. *(Optional)* Check **Anti-Shoulder-Surfing Polarity Strobe**: This introduces stroboscopic visual polarity inversion between frames, making the screen appear as an illegible blur to human eyes or surveillance cameras while the receiver's high-speed sensor decodes it seamlessly.
4. The payload will be encrypted with **AES-256-GCM** using a key derived via **PBKDF2** (100,000 iterations of SHA-256 with a unique 16-byte random salt).

### 3. Receiving Data via Camera Viewfinder
1. Open SpectraBeam on your second device (or Android phone) and navigate to **Receive** (`#receive`).
2. Allow camera access when prompted.
3. Aim the camera at the sending screen so that the animated QR stream is centered within the **Playful Reticle HUD**:
   - The reticle features active corner brackets and an animated scanning laser.
   - You can tap **Switch Cam** to toggle between front and rear cameras.
   - You can tap **Torch** to turn on your phone's hardware flashlight if in a low-light environment.
4. Watch the real-time telemetry meters:
   - **Goodput (KB/s)**: Instantaneous data throughput.
   - **Blocks Solved**: Shows progress as fountain packets are peeled.
   - **Fountain Completion %**: Dynamic striped candy progress bar.
5. Once all blocks are solved:
   - An audio chime will play.
   - A celebratory confetti burst will trigger.
   - If the stream was encrypted, a tactile SweetAlert2 dialog will appear asking for the sender's passphrase.
   - Preview the decrypted file (documents, images, videos, or text) directly in the browser!
   - Tap **Save File to Device** to download, or tap **Burn-After-Reading** to instantly wipe all decrypted buffers from RAM.

### 4. Fallback Image Scanner (Testing on a Single PC)
*Don't have a second camera or phone nearby? No problem!*
1. On the **Transmit** page, capture or save a frame of the QR stream as an image.
2. On the **Receive** page, click the **Scan Image** button.
3. Select your saved image: the WebAssembly decoder will immediately parse the frame and register its fountain packets!

### 5. AirEnclave™ Bitcoin PSBT Signer & Password Vault Sync
Navigate to **AirEnclave** (`#enclave`):
- **Bitcoin PSBT Signer (BIP-174)**:
  - Load and inspect unsigned Partially Signed Bitcoin Transactions without network exposure.
  - Review sending amounts, recipient Bitcoin addresses, and miner fee rates in sat/vB.
  - Verify address safety (anti-poisoning check).
  - Click **Sign Offline & Broadcast Signed PSBT Stream** to output the signed transaction as an optical fountain stream back to an internet-connected watch-only device.
- **Air-Gapped Vault Sync**:
  - Securely migrate password databases (`.kdbx` KeePass, Bitwarden encrypted JSON, PGP armored keys, SSH keys) across physical air-gaps without Bluetooth or Wi-Fi.

### 6. Diagnostics Lab & 120Hz Refresh Rate Benchmark
Navigate to **Lab** (`#benchmark`):
- **Robust Soliton Distribution (CDF)**:
  - Adjust the payload K-blocks slider from 10 to 500 blocks.
  - View the interactive Canvas visualization of the degree distribution curve that powers Luby Transform fountain code mechanics.
- **Display Refresh Synchronization**:
  - Click **Measure Display Refresh Rate** to run a real-time `requestAnimationFrame` benchmark measuring your screen's exact frame dispatch frequency (60Hz, 90Hz, 120Hz, or 144Hz).

---

## 📐 Technical Architecture & Wire Protocol

SpectraBeam utilizes a custom **v4 Extended Wire Protocol**. Every single optical frame begins with an exact 26-byte binary header, followed by the fountain packet slice:

```
┌────────────────────────────────────────────────────────────────────────┐
│               SpectraBeam Extended Wire Format (v4 - 26 Bytes)         │
├───────────────┬────────┬────────────────┬──────────────────────────────┤
│ Byte Offset   │ Type   │ Name           │ Description                  │
├───────────────┼────────┼────────────────┼──────────────────────────────┤
│ 0             │ uint8  │ Magic0 (0xD1)  │ SpectraBeam Magic Byte 1     │
│ 1             │ uint8  │ Magic1 (0xC4)  │ Wire Format Identifier (v4)  │
│ 2             │ uint8  │ Version (0x04) │ Protocol Version 4           │
│ 3             │ uint8  │ Flags          │ Bit 0: Encrypted (AES-GCM)   │
│               │        │                │ Bit 1: Chromatic RGB Mode    │
│               │        │                │ Bit 2: Gzip Compressed       │
│               │        │                │ Bit 3: Cold Enclave (PSBT)   │
│ 4-5           │ uint16 │ SessionId      │ Random 16-bit session token  │
│ 6-9           │ uint32 │ SequenceNumber │ Frame sequence seed for PRNG │
│ 10-11         │ uint16 │ K (Blocks)     │ Total count of source blocks │
│ 12-13         │ uint16 │ BlockLength    │ Length per block (in bytes)  │
│ 14-17         │ uint32 │ TotalLength    │ Exact unpadded payload size  │
│ 18-21         │ uint32 │ PayloadFnv     │ 32-bit FNV-1a checksum       │
│ 22-25         │ uint32 │ SecurityTag    │ Salt checksum / Key Token    │
│ 26...End      │ bytes  │ FramePayload   │ Fountain XOR chunk or cipher │
└───────────────┴────────┴────────────────┴──────────────────────────────┘
```

---

## 🔒 Zero-Trust Security Model

SpectraBeam is strictly engineered for high-security environments:

1. **Zero External Requests**: The application makes **0 HTTP calls**, contains **0 third-party trackers**, and requires **0 backend servers**.
2. **Ephemeral RAM-Only Storage**: Decrypted payloads reside strictly inside volatile memory buffers (`Uint8Array`) and temporary revoked Blob URLs. No data is ever persisted to `localStorage`, `sessionStorage`, or `IndexedDB`.
3. **Burn-After-Reading**: The dedicated RAM Purge action zeroes out decrypted buffers and revokes all object URLs immediately.
4. **Physical Air-Gap Compatible**: You can run SpectraBeam with Wi-Fi, Bluetooth, NFC, and Cellular Data permanently disabled.

---

## 🛠️ Technology Stack & Dependencies

- **Core Framework**: [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Mobile Container**: [Capacitor](https://capacitorjs.com/) (Android Native Runtime)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom **Playful Geometric Design System** tokens:
  - Warm Cream (`#FFFDF5`) paper theme & Midnight Arcade (`#0B0F19`) dark theme
  - Hard tactile 0-blur pop shadows (`shadow-pop-sm`, `shadow-pop-xl`)
  - Candy buttons with fluid responsive scaling
- **Optical Engine**: `zxing-cpp` compiled to WebAssembly (`decimen-codec.wasm`) running in background Web Workers
- **Cryptography**: Native Web Crypto API (`window.crypto.subtle`) for hardware-accelerated AES-256-GCM and PBKDF2
- **Audio Synthesizer**: Native Web Audio API (`AudioContext`) for zero-asset feedback chimes
- **Interactive Modals**: [SweetAlert2](https://sweetalert2.github.io/) styled with custom Playful Geometric pop borders
- **Visual FX**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) for celebration milestones

---

## 📄 Repository & License

- **GitHub Repository**: [https://github.com/Humaam-04-06/optical-transfer](https://github.com/Humaam-04-06/optical-transfer)
- **Author**: Humaam-04-06
- **License**: MIT License - Free for private, commercial, and research use.
