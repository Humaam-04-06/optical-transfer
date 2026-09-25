/**
 * SpectraBeam - AirEnclave (Cold-Storage & PSBT Bridge Page)
 */

import { Toast } from '../../ui/toast.ts';
import { Icons } from '../../ui/icons.ts';

export class EnclavePage {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render(): void {
    this.container.innerHTML = `
      <div class="page-container enclave-page">
        <div class="page-header">
          <div class="title-group">
            <h2 class="page-title"><span class="title-icon">${Icons.shield}</span> AirEnclave™ Cold Vault</h2>
            <p class="page-subtitle">Air-gapped transaction signing & hardware wallet bridging via light</p>
          </div>
          <div class="header-badges">
            <span class="status-badge cold-badge">COLD-ISOLATED</span>
          </div>
        </div>

        <div class="enclave-grid">
          <!-- Bitcoin PSBT Signer Card -->
          <div class="card glass-panel enclave-card">
            <div class="enclave-card-header">
              <span class="icon-accent">${Icons.zap}</span>
              <div>
                <h3>Bitcoin PSBT Signer (BIP-174)</h3>
                <p>Verify inputs, outputs, and fees offline without network exposure</p>
              </div>
            </div>

            <div class="psbt-demo-box">
              <div class="demo-tag">Sample Air-Gapped PSBT Payload</div>
              <div class="tx-details">
                <div class="tx-row">
                  <span class="tx-label">Sending Amount:</span>
                  <span class="tx-val highlight">1.45800000 BTC</span>
                </div>
                <div class="tx-row">
                  <span class="tx-label">Recipient:</span>
                  <span class="tx-val font-mono">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</span>
                </div>
                <div class="tx-row">
                  <span class="tx-label">Change Address:</span>
                  <span class="tx-val font-mono">bc1q9vza8e5yfgvh799ucl928s20l03fkmwtx6vd9s</span>
                </div>
                <div class="tx-row">
                  <span class="tx-label">Estimated Miner Fee:</span>
                  <span class="tx-val">0.00012400 BTC (14 sat/vB)</span>
                </div>
              </div>

              <div class="audit-status safe">
                ${Icons.check} Security Audit: No address poisoning detected • Sighash All
              </div>

              <div class="enclave-actions">
                <button id="btnSignPSBT" class="btn btn-primary btn-full">
                  ${Icons.shield} Sign Offline & Broadcast Signed PSBT Stream
                </button>
              </div>
            </div>
          </div>

          <!-- Password Vault Air-Gap Sync Card -->
          <div class="card glass-panel enclave-card">
            <div class="enclave-card-header">
              <span class="icon-accent">${Icons.lock}</span>
              <div>
                <h3>Air-Gapped Vault Sync</h3>
                <p>Transfer encrypted KeePass (.kdbx) or Bitwarden vaults</p>
              </div>
            </div>

            <div class="vault-sync-box">
              <p class="vault-help">
                Synchronize your password manager database between offline laptops or phones with guaranteed physical isolation.
              </p>
              <div class="supported-formats">
                <span class="format-pill">KeePass (.kdbx)</span>
                <span class="format-pill">Bitwarden JSON (Encrypted)</span>
                <span class="format-pill">PGP / GPG Armored Keys</span>
                <span class="format-pill">SSH Private Keys</span>
              </div>

              <div class="enclave-actions mt-4">
                <a href="#send" class="btn btn-secondary btn-full">
                  ${Icons.send} Prepare Vault Optical Stream
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const btnSign = this.container.querySelector('#btnSignPSBT') as HTMLButtonElement;
    btnSign?.addEventListener('click', () => {
      Toast.success('Offline Signature Generated! Switching to Optical Transmitter to beam signed transaction.');
      setTimeout(() => {
        window.location.hash = '#send';
      }, 1000);
    });
  }

  public destroy(): void {}
}
