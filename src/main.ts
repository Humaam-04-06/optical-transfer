/**
 * SpectraBeam - Main Application Entrypoint & Orchestrator
 * Playful Geometric Theme Implementation (100% Responsive)
 */

import './style.css';
import confetti from 'canvas-confetti';
import { Router } from './ui/navigation.ts';
import { PageRoute } from './core/types.ts';
import { Icons } from './ui/icons.ts';
import { Alert } from './ui/alert.ts';
import { ThemeManager } from './ui/theme.ts';
import { Toast } from './ui/toast.ts';
import { SoundFX } from './ui/audio.ts';
import { SendPage } from './modules/send/send-page.ts';
import { ReceivePage } from './modules/receive/receive-page.ts';
import { EnclavePage } from './modules/enclave/enclave-page.ts';
import { BenchmarkPage } from './modules/benchmark/benchmark-page.ts';

class App {
  private appEl: HTMLElement;
  private contentEl: HTMLElement | null = null;
  private activePageInstance: { destroy: () => void } | null = null;
  private mobileMenuOpen = false;

  constructor() {
    ThemeManager.init();
    this.appEl = document.getElementById('app')!;
    this.initShell();
    Router.subscribe((route) => this.onRouteChanged(route));
    Router.init();
  }

  private initShell(): void {
    this.appEl.innerHTML = `
      <!-- Playful Geometric Brand Navigation Bar -->
      <header class="navbar-playful sticky top-0 z-50 bg-[#FFFDF5] border-b-2 border-[#1E293B] px-3 sm:px-6 md:px-8 py-3 flex items-center justify-between">
        <!-- Logo & Brand Sticker -->
        <a href="#home" class="flex items-center gap-2.5 sm:gap-3 no-underline group select-none flex-shrink-0">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FBBF24] border-2 border-[#1E293B] shadow-pop-sm flex items-center justify-center p-1.5 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
            <img src="/favicon.svg" alt="SpectraBeam Logo" class="w-full h-full" />
          </div>
          <div class="flex items-baseline gap-1.5">
            <span class="font-heading font-extrabold text-xl sm:text-2xl tracking-tight text-[#1E293B]">
              SPECTRA<span class="text-[#8B5CF6]">BEAM</span>
            </span>
            <span class="hidden sm:inline-block bg-[#F472B6] text-white text-[10px] font-heading font-extrabold px-2 py-0.5 rounded-full border-2 border-[#1E293B] shadow-[2px_2px_0px_#1E293B] -rotate-2">
              LIGHTSPEED
            </span>
          </div>
        </a>

        <!-- Desktop Navigation Pills Group -->
        <nav class="hidden md:flex items-center">
          <ul class="nav-pill-group flex items-center gap-1 bg-[#F1F5F9] border-2 border-[#1E293B] rounded-full p-1 shadow-pop-sm list-none">
            <li>
              <a href="#home" class="nav-pill-item flex items-center gap-1.5 px-3.5 lg:px-4 py-1.5 rounded-full font-heading font-bold text-sm text-[#64748B] hover:text-[#1E293B] transition-all duration-200" data-route="home">
                <span class="nav-icon-circle w-5 h-5 rounded-full flex items-center justify-center text-xs">${Icons.beam}</span>
                <span>Home</span>
              </a>
            </li>
            <li>
              <a href="#send" class="nav-pill-item flex items-center gap-1.5 px-3.5 lg:px-4 py-1.5 rounded-full font-heading font-bold text-sm text-[#64748B] hover:text-[#1E293B] transition-all duration-200" data-route="send">
                <span class="nav-icon-circle w-5 h-5 rounded-full flex items-center justify-center text-xs">${Icons.send}</span>
                <span>Transmit</span>
              </a>
            </li>
            <li>
              <a href="#receive" class="nav-pill-item flex items-center gap-1.5 px-3.5 lg:px-4 py-1.5 rounded-full font-heading font-bold text-sm text-[#64748B] hover:text-[#1E293B] transition-all duration-200" data-route="receive">
                <span class="nav-icon-circle w-5 h-5 rounded-full flex items-center justify-center text-xs">${Icons.camera}</span>
                <span>Receive</span>
              </a>
            </li>
            <li>
              <a href="#enclave" class="nav-pill-item flex items-center gap-1.5 px-3.5 lg:px-4 py-1.5 rounded-full font-heading font-bold text-sm text-[#64748B] hover:text-[#1E293B] transition-all duration-200" data-route="enclave">
                <span class="nav-icon-circle w-5 h-5 rounded-full flex items-center justify-center text-xs">${Icons.shield}</span>
                <span>AirEnclave</span>
              </a>
            </li>
            <li>
              <a href="#benchmark" class="nav-pill-item flex items-center gap-1.5 px-3.5 lg:px-4 py-1.5 rounded-full font-heading font-bold text-sm text-[#64748B] hover:text-[#1E293B] transition-all duration-200" data-route="benchmark">
                <span class="nav-icon-circle w-5 h-5 rounded-full flex items-center justify-center text-xs">${Icons.activity}</span>
                <span>Lab</span>
              </a>
            </li>
          </ul>
        </nav>

        <!-- Right Side: Security Pill, Theme Toggle & Mobile Hamburger -->
        <div class="flex items-center gap-2 sm:gap-2.5">
          <div class="hidden lg:flex items-center gap-2 bg-[#34D399] text-[#1E293B] font-heading font-extrabold text-xs px-3.5 py-1.5 rounded-full border-2 border-[#1E293B] shadow-pop-sm select-none hover-wiggle cursor-pointer" id="btnAirGapPill" title="Click to view air-gap guarantee">
            <span class="w-2 h-2 rounded-full bg-[#1E293B] animate-pulse"></span>
            <span>ZERO-NETWORK AIR-GAP</span>
          </div>

          <!-- Dark Mode Toggle Button -->
          <button id="btnThemeToggle" class="btn-icon-square" title="Toggle Dark / Light Theme" aria-label="Toggle Dark / Light Theme">
            <span id="themeToggleIcon" class="flex items-center justify-center">${ThemeManager.isDark() ? Icons.sun : Icons.moon}</span>
          </button>

          <!-- Mobile Menu Button -->
          <button id="mobileMenuBtn" class="md:hidden btn-icon-square" aria-label="Toggle Navigation Menu">
            <span id="mobileMenuIcon" class="flex items-center justify-center">${Icons.menu}</span>
          </button>
        </div>
      </header>

      <!-- Mobile Dropdown Drawer -->
      <div id="mobileDrawer" class="hidden md:hidden bg-[#FFFDF5] border-b-2 border-[#1E293B] px-4 py-4 space-y-2 animate-pop-in">
        <a href="#home" class="mobile-nav-link flex items-center gap-2.5 p-3 rounded-xl font-heading font-bold text-[#1E293B] border-2 border-transparent transition-all" data-route="home">
          ${Icons.beam} Home Dashboard
        </a>
        <a href="#send" class="mobile-nav-link flex items-center gap-2.5 p-3 rounded-xl font-heading font-bold text-[#1E293B] border-2 border-transparent transition-all" data-route="send">
          ${Icons.send} Optical Transmitter
        </a>
        <a href="#receive" class="mobile-nav-link flex items-center gap-2.5 p-3 rounded-xl font-heading font-bold text-[#1E293B] border-2 border-transparent transition-all" data-route="receive">
          ${Icons.camera} Optical Receiver
        </a>
        <a href="#enclave" class="mobile-nav-link flex items-center gap-2.5 p-3 rounded-xl font-heading font-bold text-[#1E293B] border-2 border-transparent transition-all" data-route="enclave">
          ${Icons.shield} AirEnclave Cold Vault
        </a>
        <a href="#benchmark" class="mobile-nav-link flex items-center gap-2.5 p-3 rounded-xl font-heading font-bold text-[#1E293B] border-2 border-transparent transition-all" data-route="benchmark">
          ${Icons.activity} Diagnostics Lab
        </a>

        <!-- Mobile Dark Mode Toggle -->
        <div class="pt-3 border-t-2 border-[#1E293B] flex items-center justify-between px-2">
          <span class="font-heading font-extrabold text-sm text-[#1E293B]">Appearance</span>
          <button id="mobileThemeToggle" class="btn-candy btn-candy-secondary btn-candy-sm text-xs gap-1.5 cursor-pointer">
            <span id="mobileThemeIcon">${ThemeManager.isDark() ? Icons.sun : Icons.moon}</span>
            <span id="mobileThemeLabel">${ThemeManager.isDark() ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        <!-- Direct Android APK Download Button on Mobile -->
        <div class="pt-3 border-t-2 border-[#1E293B]">
          <a href="https://github.com/Humaam-04-06/optical-transfer/releases/tag/v1.0.1" target="_blank" rel="noopener noreferrer" class="btn-candy btn-candy-mint btn-full text-xs gap-2 no-underline">
            ${Icons.download} Download Android App (.apk)
          </a>
        </div>
      </div>

      <!-- Main Page Viewport Container -->
      <main class="main-content max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10 w-full" id="mainContent"></main>
    `;

    this.contentEl = document.getElementById('mainContent');
    this.bindNavbarEvents();
  }

  private bindNavbarEvents(): void {
    const mobileBtn = this.appEl.querySelector('#mobileMenuBtn');
    const mobileDrawer = this.appEl.querySelector('#mobileDrawer');
    const mobileIcon = this.appEl.querySelector('#mobileMenuIcon');
    const airGapPill = this.appEl.querySelector('#btnAirGapPill');
    const btnThemeToggle = this.appEl.querySelector('#btnThemeToggle');
    const mobileThemeToggle = this.appEl.querySelector('#mobileThemeToggle');

    mobileBtn?.addEventListener('click', () => {
      this.mobileMenuOpen = !this.mobileMenuOpen;
      mobileDrawer?.classList.toggle('hidden', !this.mobileMenuOpen);
      if (mobileIcon) {
        mobileIcon.innerHTML = this.mobileMenuOpen ? Icons.close : Icons.menu;
      }
    });

    // Theme toggle events
    const updateThemeUI = (isDark: boolean) => {
      const icon = isDark ? Icons.sun : Icons.moon;
      const desktopIcon = this.appEl.querySelector('#themeToggleIcon');
      const mobileIconEl = this.appEl.querySelector('#mobileThemeIcon');
      const mobileLabel = this.appEl.querySelector('#mobileThemeLabel');
      if (desktopIcon) desktopIcon.innerHTML = icon;
      if (mobileIconEl) mobileIconEl.innerHTML = icon;
      if (mobileLabel) mobileLabel.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    };

    const handleThemeToggle = () => {
      const isDark = ThemeManager.toggle();
      updateThemeUI(isDark);
      SoundFX.playPacketTick();
      Toast.show(isDark ? 'Switched to Midnight Dark Mode 🌙' : 'Switched to Warm Cream Light Mode ☀️', 'info');
    };

    btnThemeToggle?.addEventListener('click', handleThemeToggle);
    mobileThemeToggle?.addEventListener('click', handleThemeToggle);
    updateThemeUI(ThemeManager.isDark());

    // Close drawer on link click
    const mobileLinks = this.appEl.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        this.mobileMenuOpen = false;
        mobileDrawer?.classList.add('hidden');
        if (mobileIcon) mobileIcon.innerHTML = Icons.menu;
      });
    });

    // Air Gap Pill SweetAlert
    airGapPill?.addEventListener('click', () => {
      Alert.info(
        '🛡️ Zero-Network Guarantee',
        '<p class="text-left mb-3">SpectraBeam transfers files exclusively through <strong>photons (light)</strong> between your screen and camera.</p><ul class="text-left space-y-1 list-disc list-inside"><li>No Wi-Fi or Bluetooth emissions</li><li>No pairing or device discovery</li><li>Zero analytics or servers</li><li>Works 100% offline once opened</li></ul>'
      );
    });
  }

  private onRouteChanged(route: PageRoute): void {
    // Update Desktop Nav Pills
    const navLinks = this.appEl.querySelectorAll('.nav-pill-item');
    navLinks.forEach((link) => {
      const target = link.getAttribute('data-route');
      const isActive = target === route;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.className = 'nav-pill-item active flex items-center gap-1.5 px-3.5 lg:px-4 py-1.5 rounded-full font-heading font-extrabold text-sm bg-[#FBBF24] text-[#1E293B] border-2 border-[#1E293B] shadow-[2px_2px_0px_#1E293B] transition-all';
      } else {
        link.className = 'nav-pill-item flex items-center gap-1.5 px-3.5 lg:px-4 py-1.5 rounded-full font-heading font-bold text-sm text-[#64748B] hover:text-[#1E293B] hover:bg-white/60 transition-all';
      }
    });

    // Update Mobile Links
    const mobileLinks = this.appEl.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach((link) => {
      const target = link.getAttribute('data-route');
      const isActive = target === route;
      if (isActive) {
        link.className = 'mobile-nav-link flex items-center gap-2.5 p-3 rounded-xl font-heading font-extrabold text-[#1E293B] bg-[#FBBF24] border-2 border-[#1E293B] shadow-pop-sm';
      } else {
        link.className = 'mobile-nav-link flex items-center gap-2.5 p-3 rounded-xl font-heading font-bold text-[#1E293B] border-2 border-transparent hover:bg-slate-100';
      }
    });

    // Cleanup previous page instance
    if (this.activePageInstance) {
      this.activePageInstance.destroy();
      this.activePageInstance = null;
    }

    if (!this.contentEl) return;
    this.contentEl.innerHTML = '';

    switch (route) {
      case 'home':
        this.renderHome();
        break;
      case 'send': {
        const page = new SendPage(this.contentEl);
        page.render();
        this.activePageInstance = page;
        break;
      }
      case 'receive': {
        const page = new ReceivePage(this.contentEl);
        page.render();
        this.activePageInstance = page;
        break;
      }
      case 'enclave': {
        const page = new EnclavePage(this.contentEl);
        page.render();
        this.activePageInstance = page;
        break;
      }
      case 'benchmark': {
        const page = new BenchmarkPage(this.contentEl);
        page.render();
        this.activePageInstance = page;
        break;
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private renderHome(): void {
    if (!this.contentEl) return;

    this.contentEl.innerHTML = `
      <!-- ==========================================================================
           PART 3: HERO SECTION (100% Responsive Playful Geometric)
           ========================================================================== -->
      <section class="relative py-4 sm:py-8 md:py-12">
        <!-- Wild Geometric Decorative Floating Elements -->
        <div class="hidden sm:block absolute -top-6 -left-6 w-24 h-24 rounded-full bg-[#FDE68A] opacity-60 -z-10 pointer-events-none"></div>
        <div class="hidden sm:block absolute top-1/2 -right-8 w-32 h-32 rounded-3xl bg-[#FCE7F3] -rotate-12 -z-10 pointer-events-none"></div>
        <div class="hidden sm:block absolute bottom-4 left-1/3 w-16 h-16 rounded-speech-bubble bg-[#D1FAE5] opacity-80 -z-10 pointer-events-none"></div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <!-- Left Column: Copy & Tactile CTA Buttons -->
          <div class="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
            <div class="inline-flex items-center gap-2 bg-[#FBBF24] text-[#1E293B] font-heading font-extrabold text-[11px] sm:text-xs px-3.5 py-1.5 rounded-full border-2 border-[#1E293B] shadow-pop-sm select-none -rotate-1 mx-auto lg:mx-0">
              ${Icons.sparkles} <span>ZERO-RF • AIR-GAPPED OPTICAL TRANSFER</span>
            </div>

            <h1 class="font-heading font-black text-3xl sm:text-5xl lg:text-6xl text-[#1E293B] leading-[1.15] tracking-tight">
              Transfer Data <br class="hidden sm:inline" />
              Through <span class="relative inline-block bg-[#FBBF24] border-2 border-[#1E293B] px-3 sm:px-4 py-1 rounded-2xl shadow-pop -rotate-1 text-[#1E293B] mt-1">Pure Light</span><span class="text-[#8B5CF6]">.</span>
            </h1>

            <p class="font-body text-base sm:text-lg text-[#64748B] leading-relaxed max-w-xl mx-auto lg:mx-0">
              No Wi-Fi, no Bluetooth, no pairing, and no cables. Stream data directly between any screen and camera using mathematical 
              <strong>Luby Transform fountain codes</strong>, hardware-accelerated <strong>WebAssembly QR decoding</strong>, 
              and zero-knowledge <strong>SpectraVault™ AES-256-GCM encryption</strong>.
            </p>

            <!-- Candy CTA Buttons Group (Full-width on mobile, auto on desktop) -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <a href="#send" class="btn-candy text-base px-7 py-3.5 w-full sm:w-auto group">
                <span>Start Transmitting</span>
                <span class="w-6 h-6 rounded-full bg-white text-[#8B5CF6] flex items-center justify-center font-bold text-xs transition-transform group-hover:translate-x-1">→</span>
              </a>

              <a href="#receive" class="btn-candy btn-candy-secondary text-base px-7 py-3.5 w-full sm:w-auto group">
                ${Icons.camera}
                <span>Open Viewfinder</span>
              </a>
            </div>

            <!-- Micro-Pill Feature Stickers -->
            <div class="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-3 sm:pt-4">
              <span class="badge-pill bg-[#34D399] text-[#1E293B]">⚡ 418 KB/s Speed</span>
              <span class="badge-pill bg-[#F472B6] text-white">🔒 Military E2EE</span>
              <span class="badge-pill bg-[#8B5CF6] text-white">📦 Files up to 64MB</span>
              <span class="badge-pill bg-[#FBBF24] text-[#1E293B]">🌐 100% Offline PWA</span>
              <a href="https://github.com/Humaam-04-06/optical-transfer/releases/tag/v1.0.1" target="_blank" rel="noopener noreferrer" class="badge-pill bg-[#8B5CF6] text-white hover:scale-105 transition-transform no-underline">
                📱 Get Android APK (v1.0.1)
              </a>
            </div>
          </div>

          <!-- Right Column: Interactive Playful Sticker Device Mockup -->
          <div class="lg:col-span-5 relative mt-4 lg:mt-0">
            <div class="card-sticker shadow-pop-xl bg-white p-4 sm:p-6 relative overflow-hidden group max-w-md mx-auto">
              <!-- Window Header -->
              <div class="flex items-center justify-between border-b-2 border-[#1E293B] pb-3 mb-4 sm:mb-5">
                <div class="flex items-center gap-1.5 sm:gap-2">
                  <span class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#F472B6] border-2 border-[#1E293B]"></span>
                  <span class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#FBBF24] border-2 border-[#1E293B]"></span>
                  <span class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#34D399] border-2 border-[#1E293B]"></span>
                </div>
                <span class="font-heading font-extrabold text-[10px] sm:text-xs text-[#1E293B] uppercase tracking-wider bg-[#F1F5F9] px-2.5 py-0.5 rounded-full border border-[#CBD5E1]">
                  optical_beam.stream
                </span>
              </div>

              <!-- Animated Visual Demonstration -->
              <div class="relative bg-dot-grid border-2 border-[#1E293B] rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center text-center overflow-hidden min-h-[220px] sm:min-h-[260px]">
                <!-- Floating Decorative Stickers -->
                <div class="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-[#FBBF24] border-2 border-[#1E293B] shadow-pop-sm px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-heading font-black rotate-6 z-10">
                  NO WI-FI NEEDED!
                </div>

                <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#8B5CF6] border-2 border-[#1E293B] shadow-pop flex items-center justify-center text-white mb-3 sm:mb-4 animate-bounce">
                  ${Icons.beam}
                </div>

                <h3 class="font-heading font-black text-lg sm:text-xl text-[#1E293B] mb-1">
                  Photon Data Stream
                </h3>
                <p class="font-body text-xs text-[#64748B] max-w-[220px]">
                  Fountain codes break files into resilient math packets transmitted as light
                </p>

                <!-- Interactive SweetAlert Demo Button inside card -->
                <button id="btnConfettiDemo" class="btn-candy btn-candy-mint btn-candy-sm mt-4 w-full sm:w-auto">
                  ${Icons.sparkles} Celebrate Optical Air-Gap
                </button>
              </div>

              <!-- Bottom Stats Row -->
              <div class="grid grid-cols-2 gap-2 sm:gap-3 mt-4 pt-1 sm:pt-2">
                <div class="bg-[#F8FAFC] border-2 border-[#1E293B] rounded-xl p-2 sm:p-2.5 text-center shadow-pop-sm">
                  <span class="block text-[9px] sm:text-[10px] font-heading font-bold text-[#64748B] uppercase">Transfer Mode</span>
                  <span class="font-heading font-extrabold text-xs sm:text-sm text-[#1E293B]">Simplex Light</span>
                </div>
                <div class="bg-[#F8FAFC] border-2 border-[#1E293B] rounded-xl p-2 sm:p-2.5 text-center shadow-pop-sm">
                  <span class="block text-[9px] sm:text-[10px] font-heading font-bold text-[#64748B] uppercase">Encryption</span>
                  <span class="font-heading font-extrabold text-xs sm:text-sm text-[#8B5CF6]">AES-GCM-256</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ==========================================================================
           PART 3: STICKER FEATURE CARDS GRID (100% Responsive Grid)
           ========================================================================== -->
      <section class="py-8 sm:py-12">
        <div class="text-center max-w-xl mx-auto mb-8 sm:mb-12 px-2">
          <div class="inline-flex items-center gap-1.5 bg-[#F472B6] text-white font-heading font-extrabold text-[11px] sm:text-xs px-3.5 py-1 rounded-full border-2 border-[#1E293B] shadow-pop-sm mb-3 -rotate-1">
            ${Icons.zap} FOUR CORE POWERS
          </div>
          <h2 class="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-[#1E293B]">
            Engineered for <span class="bg-[#34D399] px-2 py-0.5 rounded-xl border-2 border-[#1E293B] shadow-pop-sm inline-block rotate-1">Extreme Security</span>
          </h2>
          <p class="font-body text-sm sm:text-base text-[#64748B] mt-2">
            Every layer is designed for speed, zero-knowledge privacy, and tactile simplicity.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          <!-- Card 1: Optical Transmitter -->
          <div class="card-sticker card-sticker-yellow flex flex-col justify-between pt-8 group">
            <div class="card-icon-badge bg-[#8B5CF6] text-white -mt-12 group-hover:rotate-6 transition-transform">
              ${Icons.send}
            </div>
            <div>
              <span class="text-[11px] font-heading font-bold text-[#8B5CF6] uppercase tracking-wider block mb-1">TRANSMITTER</span>
              <h3 class="font-heading font-black text-xl text-[#1E293B] mb-2">Fountain Stream</h3>
              <p class="font-body text-sm text-[#64748B] leading-relaxed mb-6">
                Converts files or text snippets into animated Luby Transform QR streams running at 30 to 120 FPS with pinned mask optimization.
              </p>
            </div>
            <a href="#send" class="btn-candy btn-candy-sm btn-full justify-between">
              <span>Open Transmitter</span>
              <span>&rarr;</span>
            </a>
          </div>

          <!-- Card 2: Camera Receiver -->
          <div class="card-sticker card-sticker-pink flex flex-col justify-between pt-8 group">
            <div class="card-icon-badge bg-[#F472B6] text-white -mt-12 group-hover:-rotate-6 transition-transform">
              ${Icons.camera}
            </div>
            <div>
              <span class="text-[11px] font-heading font-bold text-[#F472B6] uppercase tracking-wider block mb-1">RECEIVER</span>
              <h3 class="font-heading font-black text-xl text-[#1E293B] mb-2">WASM Viewfinder</h3>
              <p class="font-body text-sm text-[#64748B] leading-relaxed mb-6">
                Captures light frames with multi-core WebAssembly workers, peeling packets out in any order with live KB/s goodput telemetry.
              </p>
            </div>
            <a href="#receive" class="btn-candy btn-candy-pink btn-candy-sm btn-full justify-between">
              <span>Open Viewfinder</span>
              <span>&rarr;</span>
            </a>
          </div>

          <!-- Card 3: SpectraVault E2EE -->
          <div class="card-sticker card-sticker-yellow flex flex-col justify-between pt-8 group">
            <div class="card-icon-badge bg-[#FBBF24] text-[#1E293B] -mt-12 group-hover:rotate-6 transition-transform">
              ${Icons.shield}
            </div>
            <div>
              <span class="text-[11px] font-heading font-bold text-[#D97706] uppercase tracking-wider block mb-1">SECURITY</span>
              <h3 class="font-heading font-black text-xl text-[#1E293B] mb-2">SpectraVault™</h3>
              <p class="font-body text-sm text-[#64748B] leading-relaxed mb-6">
                Zero-knowledge AES-256-GCM encryption with anti-shoulder-surfing visual stroboscopic noise and RAM-only burn-after-reading.
              </p>
            </div>
            <button id="btnLearnE2EE" class="btn-candy btn-candy-secondary btn-candy-sm btn-full justify-between">
              <span>Security Specs</span>
              <span>ℹ️</span>
            </button>
          </div>

          <!-- Card 4: AirEnclave Cold Vault -->
          <div class="card-sticker card-sticker-mint flex flex-col justify-between pt-8 group">
            <div class="card-icon-badge bg-[#34D399] text-[#1E293B] -mt-12 group-hover:-rotate-6 transition-transform">
              ${Icons.lock}
            </div>
            <div>
              <span class="text-[11px] font-heading font-bold text-[#059669] uppercase tracking-wider block mb-1">COLD STORAGE</span>
              <h3 class="font-heading font-black text-xl text-[#1E293B] mb-2">AirEnclave™</h3>
              <p class="font-body text-sm text-[#64748B] leading-relaxed mb-6">
                Turns offline devices into hardware wallets for Bitcoin PSBT (BIP-174) visual transaction signing and offline password vault sync.
              </p>
            </div>
            <a href="#enclave" class="btn-candy btn-candy-mint btn-candy-sm btn-full justify-between">
              <span>Open Enclave</span>
              <span>&rarr;</span>
            </a>
          </div>
        </div>
      </section>
    `;

    this.bindHomeEvents();
  }

  private bindHomeEvents(): void {
    const btnConfetti = this.contentEl?.querySelector('#btnConfettiDemo');
    const btnLearnE2EE = this.contentEl?.querySelector('#btnLearnE2EE');

    btnConfetti?.addEventListener('click', () => {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
      Alert.success(
        'Light Transfer Ready! 🚀',
        'Your browser is configured for zero-network air-gapped optical file transmission.'
      );
    });

    btnLearnE2EE?.addEventListener('click', () => {
      Alert.info(
        '🔒 SpectraVault™ Architecture',
        '<div class="text-left space-y-2 text-sm">' +
          '<p><strong>1. Passphrase Derivation:</strong> PBKDF2 (100,000 iterations SHA-256) with dynamic salt.</p>' +
          '<p><strong>2. Authenticated Encryption:</strong> AES-256-GCM with hardware WebCrypto API.</p>' +
          '<p><strong>3. Anti-Shoulder-Surfing:</strong> Stroboscopic complementary polarity noise prevents human/camera recording.</p>' +
          '<p><strong>4. RAM Burn-After-Reading:</strong> Decrypted files exist strictly in memory and are wiped on command.</p>' +
        '</div>'
      );
    });
  }
}

// Bootstrap app on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
