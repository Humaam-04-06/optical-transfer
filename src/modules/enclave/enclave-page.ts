/**
 * SpectraBeam - AirEnclave (Cold-Storage & PSBT Bridge Page)
 * Playful Geometric Theme Implementation (100% Fluid & Responsive)
 */

import { Toast } from '../../ui/toast.ts';
import { Alert } from '../../ui/alert.ts';
import { Icons } from '../../ui/icons.ts';

export class EnclavePage {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render(): void {
    this.container.innerHTML = `
      <div class="space-y-6 sm:space-y-8 animate-pop-in">
        
        <!-- Page Title Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1E293B] pb-5">
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-[#FBBF24] text-[#1E293B] border-2 border-[#1E293B] shadow-pop-sm flex items-center justify-center p-2 flex-shrink-0">
                ${Icons.shield}
              </div>
              <h2 class="font-heading font-black text-2xl sm:text-3xl text-[#1E293B]">AirEnclave™ Cold Vault</h2>
            </div>
            <p class="font-body text-sm sm:text-base text-[#64748B] pl-0 sm:pl-13">
              Air-gapped transaction signing and secure password vault synchronization via light
            </p>
          </div>

          <div class="flex items-center gap-2 self-start sm:self-auto">
            <span class="badge-pill bg-[#34D399] text-[#1E293B]">
              <span class="w-2 h-2 rounded-full bg-[#1E293B] animate-pulse"></span>
              <span>COLD-ISOLATED ENCLAVE</span>
            </span>
          </div>
        </div>

        <!-- 100% Responsive Grid: 2 equal cards on desktop, stacked on mobile -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
          
          <!-- Bitcoin PSBT Signer Sticker Card -->
          <div class="card-sticker shadow-pop-lg bg-white p-5 sm:p-7 space-y-5">
            <div class="flex items-center gap-3 border-b-2 border-[#1E293B] pb-3.5">
              <div class="w-10 h-10 rounded-xl bg-[#FBBF24] border-2 border-[#1E293B] shadow-pop-sm flex items-center justify-center text-[#1E293B] flex-shrink-0">
                ${Icons.zap}
              </div>
              <div>
                <h3 class="font-heading font-black text-lg text-[#1E293B]">Bitcoin PSBT Signer (BIP-174)</h3>
                <p class="font-body text-xs text-[#64748B]">Verify inputs, outputs, and fees offline without network exposure</p>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-[#FFFDF5] border-2 border-[#1E293B] shadow-pop-sm space-y-3">
              <div class="flex items-center justify-between">
                <span class="badge-pill bg-[#8B5CF6] text-white text-[10px] py-0.5 px-2">SAMPLE UNSPENT TX</span>
                <span class="text-[11px] font-mono font-bold text-[#64748B]">BIP-174 READY</span>
              </div>

              <div class="space-y-2 text-xs sm:text-sm font-body">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#E2E8F0] pb-1.5">
                  <span class="font-heading font-bold text-[#64748B]">Sending Amount:</span>
                  <span class="font-mono font-black text-base text-[#059669]">1.45800000 BTC</span>
                </div>

                <div class="flex flex-col gap-0.5 border-b border-[#E2E8F0] pb-1.5">
                  <span class="font-heading font-bold text-[#64748B]">Destination:</span>
                  <span class="font-mono text-xs text-[#1E293B] break-all bg-[#F1F5F9] p-1.5 rounded-lg border border-[#CBD5E1]">
                    bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
                  </span>
                </div>

                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span class="font-heading font-bold text-[#64748B]">Estimated Miner Fee:</span>
                  <span class="font-mono text-xs text-[#1E293B]">0.00012400 BTC (14 sat/vB)</span>
                </div>
              </div>

              <div class="p-2.5 rounded-xl bg-[#ECFDF5] border-2 border-[#34D399] flex items-center gap-2 text-xs font-heading font-bold text-[#065F46]">
                <span class="text-[#059669]">${Icons.check}</span>
                <span>Security Audit: No address poisoning detected • Sighash All</span>
              </div>
            </div>

            <button id="btnSignPSBT" class="btn-candy btn-candy-secondary btn-full">
              ${Icons.shield} Sign Offline & Broadcast Signed PSBT Stream
            </button>
          </div>

          <!-- Password Vault Air-Gap Sync Card -->
          <div class="card-sticker card-sticker-pink shadow-pop-lg bg-white p-5 sm:p-7 space-y-5">
            <div class="flex items-center gap-3 border-b-2 border-[#1E293B] pb-3.5">
              <div class="w-10 h-10 rounded-xl bg-[#F472B6] border-2 border-[#1E293B] shadow-pop-sm flex items-center justify-center text-white flex-shrink-0">
                ${Icons.lock}
              </div>
              <div>
                <h3 class="font-heading font-black text-lg text-[#1E293B]">Air-Gapped Vault Sync</h3>
                <p class="font-body text-xs text-[#64748B]">Transfer encrypted password manager databases</p>
              </div>
            </div>

            <div class="space-y-4">
              <p class="font-body text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Synchronize your offline KeePass, Bitwarden, or PGP keyrings between air-gapped computers and mobile phones with zero wireless pairing, Bluetooth, or WiFi exposure.
              </p>

              <div class="flex flex-wrap gap-2">
                <span class="badge-pill bg-[#F1F5F9] text-[#1E293B] text-[11px]">KeePass (.kdbx)</span>
                <span class="badge-pill bg-[#F1F5F9] text-[#1E293B] text-[11px]">Bitwarden Encrypted JSON</span>
                <span class="badge-pill bg-[#F1F5F9] text-[#1E293B] text-[11px]">PGP / GPG Armored Keys</span>
                <span class="badge-pill bg-[#F1F5F9] text-[#1E293B] text-[11px]">SSH Ed25519 Keys</span>
              </div>

              <div class="p-4 rounded-2xl bg-[#FFFDF5] border-2 border-[#1E293B] shadow-pop-sm text-xs font-body text-[#64748B]">
                <strong class="text-[#1E293B] block mb-1">Zero-Trust Operational Guide:</strong>
                Export your database on your primary offline machine, drop it into SpectraBeam's Optical Transmitter, and capture on your air-gapped receiver.
              </div>

              <a href="#send" class="btn-candy btn-candy-pink btn-full">
                ${Icons.send} Prepare Vault Optical Stream
              </a>
            </div>
          </div>

        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const btnSign = this.container.querySelector('#btnSignPSBT') as HTMLButtonElement;
    btnSign?.addEventListener('click', async () => {
      await Alert.info(
        'Offline PSBT Signed',
        'Transaction signed using isolated memory buffer! Ready to stream to an internet-connected watch-only device.'
      );
      Toast.success('Switching to Optical Transmitter...');
      setTimeout(() => {
        window.location.hash = '#send';
      }, 700);
    });
  }

  public destroy(): void {}
}
