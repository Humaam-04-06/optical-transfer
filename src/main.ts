/**
 * SpectraBeam - Main Application Entrypoint & Orchestrator
 */

import './style.css';
import { Router } from './ui/navigation.ts';
import { PageRoute } from './core/types.ts';
import { Icons } from './ui/icons.ts';
import { SendPage } from './modules/send/send-page.ts';
import { ReceivePage } from './modules/receive/receive-page.ts';
import { EnclavePage } from './modules/enclave/enclave-page.ts';
import { BenchmarkPage } from './modules/benchmark/benchmark-page.ts';

class App {
  private appEl: HTMLElement;
  private contentEl: HTMLElement | null = null;
  private activePageInstance: { destroy: () => void } | null = null;

  constructor() {
    this.appEl = document.getElementById('app')!;
    this.initShell();
    Router.init();
    Router.subscribe((route) => this.onRouteChanged(route));
  }

  private initShell(): void {
    this.appEl.innerHTML = `
      <header class="navbar">
        <a href="#home" class="brand-link">
          <img src="/favicon.svg" alt="SpectraBeam Logo" class="brand-logo-img" />
          <span class="brand-title">SPECTRA<span style="color: var(--accent-cyan)">BEAM</span></span>
          <span class="brand-version">v1.0-ENCLAVE</span>
        </a>

        <nav>
          <ul class="nav-links">
            <li><a href="#home" class="nav-link" data-route="home">${Icons.beam} Home</a></li>
            <li><a href="#send" class="nav-link" data-route="send">${Icons.send} Transmit</a></li>
            <li><a href="#receive" class="nav-link" data-route="receive">${Icons.camera} Receive</a></li>
            <li><a href="#enclave" class="nav-link" data-route="enclave">${Icons.shield} AirEnclave</a></li>
            <li><a href="#benchmark" class="nav-link" data-route="benchmark">${Icons.activity} Lab</a></li>
          </ul>
        </nav>

        <div class="nav-badges">
          <span class="air-gap-pill">
            <span class="pulse-dot"></span> ZERO-NETWORK ACTIVE
          </span>
        </div>
      </header>

      <main class="main-content" id="mainContent"></main>
    `;

    this.contentEl = document.getElementById('mainContent');
  }

  private onRouteChanged(route: PageRoute): void {
    // Update active nav links
    const navLinks = this.appEl.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
      const target = link.getAttribute('data-route');
      link.classList.toggle('active', target === route);
    });

    // Cleanup existing page
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
      <div class="home-hero">
        <div class="hero-tag">
          ${Icons.sparkles} High-Speed Optical Air-Gap Suite
        </div>
        <h1 class="hero-title">
          Send Files Through <span class="gradient-text">Pure Light</span>
        </h1>
        <p class="hero-desc">
          Zero network paths, zero servers, zero pairing, and zero RF emissions. 
          Powered by deterministic fountain codes, hardware-accelerated WebAssembly QR decoding, 
          and military-grade SpectraVault™ zero-knowledge encryption.
        </p>

        <div class="hero-cta-group">
          <a href="#send" class="btn btn-primary">
            ${Icons.send} Start Transmitting
          </a>
          <a href="#receive" class="btn btn-secondary">
            ${Icons.camera} Open Viewfinder
          </a>
        </div>
      </div>

      <!-- Feature Launch Grid -->
      <div class="features-grid">
        <a href="#send" class="card glass-panel feature-card">
          <div class="feature-icon-wrapper">${Icons.send}</div>
          <h3 class="feature-title">Optical Transmitter</h3>
          <p class="feature-desc">
            Stream files up to 64 MB or encrypted text snippets as an animated fountain-coded QR stream at 30–120 FPS.
          </p>
          <span class="feature-arrow">Launch Transmitter &rarr;</span>
        </a>

        <a href="#receive" class="card glass-panel feature-card">
          <div class="feature-icon-wrapper">${Icons.camera}</div>
          <h3 class="feature-title">Camera Receiver</h3>
          <p class="feature-desc">
            Point any device camera to intercept and reassemble files out of thin air using multi-core WASM decoding workers.
          </p>
          <span class="feature-arrow">Open Receiver &rarr;</span>
        </a>

        <a href="#send" class="card glass-panel feature-card">
          <div class="feature-icon-wrapper">${Icons.shield}</div>
          <h3 class="feature-title">SpectraVault™ E2EE</h3>
          <p class="feature-desc">
            End-to-end zero-knowledge AES-256-GCM encryption with anti-shoulder-surfing visual stroboscopic camouflage.
          </p>
          <span class="feature-arrow">Configure Security &rarr;</span>
        </a>

        <a href="#enclave" class="card glass-panel feature-card">
          <div class="feature-icon-wrapper">${Icons.lock}</div>
          <h3 class="feature-title">AirEnclave™ Cold Vault</h3>
          <p class="feature-desc">
            Turn offline phones into air-gapped hardware wallets for Bitcoin PSBTs (BIP-174) and password database sync.
          </p>
          <span class="feature-arrow">Access Cold Enclave &rarr;</span>
        </a>

        <a href="#benchmark" class="card glass-panel feature-card">
          <div class="feature-icon-wrapper">${Icons.activity}</div>
          <h3 class="feature-title">ChromaLab & Diagnostics</h3>
          <p class="feature-desc">
            Test Soliton distribution mathematical curves, display refresh rate sync, and RGB 3-channel optical multiplexing.
          </p>
          <span class="feature-arrow">Run Diagnostics &rarr;</span>
        </a>
      </div>
    `;
  }
}

// Bootstrap app on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
