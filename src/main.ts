/**
 * SpectraBeam - Main Application Entrypoint & Orchestrator
 * Playful Geometric Theme Implementation
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
  private mobileMenuOpen = false;

  constructor() {
    this.appEl = document.getElementById('app')!;
    this.initShell();
    Router.init();
    Router.subscribe((route) => this.onRouteChanged(route));
  }

  private initShell(): void {
    this.appEl.innerHTML = `
      <!-- Playful Geometric Brand Navigation Bar -->
      <header class="navbar-playful sticky top-0 z-50 bg-[#FFFDF5] border-b-2 border-[#1E293B] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <!-- Logo & Brand Sticker -->
        <a href="#home" class="flex items-center gap-3 no-underline group select-none">
          <div class="w-10 h-10 rounded-2xl bg-[#FBBF24] border-2 border-[#1E293B] shadow-pop-sm flex items-center justify-center p-1.5 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
            <img src="/favicon.svg" alt="SpectraBeam Logo" class="w-full h-full" />
          </div>
          <div class="flex items-baseline gap-1.5">
            <span class="font-heading font-extrabold text-2xl tracking-tight text-[#1E293B]">
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
              <a href="#home" class="nav-pill-item flex items-center gap-1.5 px-4 py-1.5 rounded-full font-heading font-bold text-sm text-[#64748B] hover:text-[#1E293B] transition-all duration-200" data-route="home">
                <span class="nav-icon-circle w-5 h-5 rounded-full flex items-center justify-center text-xs">${Icons.beam}</span>
                <span>Home</span>
              </a>
            </li>
            <li>
              <a href="#send" class="nav-pill-item flex items-center gap-1.5 px-4 py-1.5 rounded-full font-heading font-bold text-sm text-[#64748B] hover:text-[#1E293B] transition-all duration-200" data-route="send">
                <span class="nav-icon-circle w-5 h-5 rounded-full flex items-center justify-center text-xs">${Icons.send}</span>
                <span>Transmit</span>
              </a>
            </li>
            <li>
              <a href="#receive" class="nav-pill-item flex items-center gap-1.5 px-4 py-1.5 rounded-full font-heading font-bold text-sm text-[#64748B] hover:text-[#1E293B] transition-all duration-200" data-route="receive">
                <span class="nav-icon-circle w-5 h-5 rounded-full flex items-center justify-center text-xs">${Icons.camera}</span>
                <span>Receive</span>
              </a>
            </li>
            <li>
              <a href="#enclave" class="nav-pill-item flex items-center gap-1.5 px-4 py-1.5 rounded-full font-heading font-bold text-sm text-[#64748B] hover:text-[#1E293B] transition-all duration-200" data-route="enclave">
                <span class="nav-icon-circle w-5 h-5 rounded-full flex items-center justify-center text-xs">${Icons.shield}</span>
                <span>AirEnclave</span>
              </a>
            </li>
            <li>
              <a href="#benchmark" class="nav-pill-item flex items-center gap-1.5 px-4 py-1.5 rounded-full font-heading font-bold text-sm text-[#64748B] hover:text-[#1E293B] transition-all duration-200" data-route="benchmark">
                <span class="nav-icon-circle w-5 h-5 rounded-full flex items-center justify-center text-xs">${Icons.activity}</span>
                <span>Lab</span>
              </a>
            </li>
          </ul>
        </nav>

        <!-- Right Side: Security Pill & Mobile Hamburger -->
        <div class="flex items-center gap-3">
          <div class="hidden lg:flex items-center gap-2 bg-[#34D399] text-[#1E293B] font-heading font-extrabold text-xs px-3.5 py-1.5 rounded-full border-2 border-[#1E293B] shadow-pop-sm select-none hover-wiggle cursor-default">
            <span class="w-2 h-2 rounded-full bg-[#1E293B] animate-pulse"></span>
            <span>ZERO-NETWORK AIR-GAP</span>
          </div>

          <!-- Mobile Menu Button -->
          <button id="mobileMenuBtn" class="md:hidden flex items-center justify-center w-10 h-10 bg-white border-2 border-[#1E293B] rounded-xl shadow-pop-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
            <span id="mobileMenuIcon">${Icons.menu}</span>
          </button>
        </div>
      </header>

      <!-- Mobile Dropdown Drawer -->
      <div id="mobileDrawer" class="hidden md:hidden bg-[#FFFDF5] border-b-2 border-[#1E293B] px-4 py-4 space-y-2 animate-pop-in">
        <a href="#home" class="mobile-nav-link flex items-center gap-2 p-2.5 rounded-xl font-heading font-bold text-[#1E293B] border-2 border-transparent" data-route="home">
          ${Icons.beam} Home Dashboard
        </a>
        <a href="#send" class="mobile-nav-link flex items-center gap-2 p-2.5 rounded-xl font-heading font-bold text-[#1E293B] border-2 border-transparent" data-route="send">
          ${Icons.send} Optical Transmitter
        </a>
        <a href="#receive" class="mobile-nav-link flex items-center gap-2 p-2.5 rounded-xl font-heading font-bold text-[#1E293B] border-2 border-transparent" data-route="receive">
          ${Icons.camera} Optical Receiver
        </a>
        <a href="#enclave" class="mobile-nav-link flex items-center gap-2 p-2.5 rounded-xl font-heading font-bold text-[#1E293B] border-2 border-transparent" data-route="enclave">
          ${Icons.shield} AirEnclave Cold Vault
        </a>
        <a href="#benchmark" class="mobile-nav-link flex items-center gap-2 p-2.5 rounded-xl font-heading font-bold text-[#1E293B] border-2 border-transparent" data-route="benchmark">
          ${Icons.activity} Diagnostics Lab
        </a>
      </div>

      <!-- Main Page Viewport Container -->
      <main class="main-content max-w-6xl mx-auto p-4 md:p-8 w-full" id="mainContent"></main>
    `;

    this.contentEl = document.getElementById('mainContent');
    this.bindNavbarEvents();
  }

  private bindNavbarEvents(): void {
    const mobileBtn = this.appEl.querySelector('#mobileMenuBtn');
    const mobileDrawer = this.appEl.querySelector('#mobileDrawer');
    const mobileIcon = this.appEl.querySelector('#mobileMenuIcon');

    mobileBtn?.addEventListener('click', () => {
      this.mobileMenuOpen = !this.mobileMenuOpen;
      mobileDrawer?.classList.toggle('hidden', !this.mobileMenuOpen);
      if (mobileIcon) {
        mobileIcon.innerHTML = this.mobileMenuOpen ? Icons.close : Icons.menu;
      }
    });

    // Close drawer on link click
    const mobileLinks = this.appEl.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        this.mobileMenuOpen = false;
        mobileDrawer?.classList.add('hidden');
        if (mobileIcon) mobileIcon.innerHTML = Icons.menu;
      });
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
        link.className = 'nav-pill-item active flex items-center gap-1.5 px-4 py-1.5 rounded-full font-heading font-extrabold text-sm bg-[#FBBF24] text-[#1E293B] border-2 border-[#1E293B] shadow-[2px_2px_0px_#1E293B] transition-all';
      } else {
        link.className = 'nav-pill-item flex items-center gap-1.5 px-4 py-1.5 rounded-full font-heading font-bold text-sm text-[#64748B] hover:text-[#1E293B] hover:bg-white/60 transition-all';
      }
    });

    // Update Mobile Links
    const mobileLinks = this.appEl.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach((link) => {
      const target = link.getAttribute('data-route');
      const isActive = target === route;
      if (isActive) {
        link.className = 'mobile-nav-link flex items-center gap-2 p-2.5 rounded-xl font-heading font-extrabold text-[#1E293B] bg-[#FBBF24] border-2 border-[#1E293B] shadow-pop-sm';
      } else {
        link.className = 'mobile-nav-link flex items-center gap-2 p-2.5 rounded-xl font-heading font-bold text-[#1E293B] border-2 border-transparent hover:bg-slate-100';
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

    // Temporary placeholder for Part 3 Home view
    this.contentEl.innerHTML = `
      <div class="py-12 text-center">
        <div class="inline-flex items-center gap-2 bg-[#FBBF24] text-[#1E293B] px-4 py-1 rounded-full border-2 border-[#1E293B] shadow-pop-sm font-heading font-bold text-xs uppercase tracking-wider mb-6">
          ${Icons.sparkles} Part 2 Complete: Playful Geometric Navigation Active
        </div>
        <h1 class="text-4xl md:text-5xl font-heading font-black text-[#1E293B] mb-4">
          Ready for <span class="bg-[#8B5CF6] text-white px-3 py-1 rounded-2xl border-2 border-[#1E293B] shadow-pop inline-block -rotate-1">Part 3: Hero Section</span>
        </h1>
        <p class="text-lg text-[#64748B] max-w-xl mx-auto font-body mb-8">
          The navigation bar, brand stickers, active route pills, and mobile drawer are live! Send your prompt or code for the Hero & Feature cards next.
        </p>
        <div class="flex items-center justify-center gap-4">
          <a href="#send" class="btn-candy">
            ${Icons.send} Test Transmit Nav Pill
          </a>
          <a href="#receive" class="btn-candy btn-candy-secondary">
            ${Icons.camera} Test Receive Nav Pill
          </a>
        </div>
      </div>
    `;
  }
}

// Bootstrap app on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
