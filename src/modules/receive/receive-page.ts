/**
 * SpectraBeam - Optical Receiver (Receive Page)
 */

import confetti from 'canvas-confetti';
import { FountainDecoder } from '../../core/fountain.ts';
import { unpackFrame, unpackContainer, ContainerMetadata } from '../../core/protocol.ts';
import { SpectraCrypto } from '../../core/crypto.ts';
import { DecodeWorkerPool } from '../../workers/worker-pool.ts';
import { ProtocolFlags } from '../../core/types.ts';
import { Toast } from '../../ui/toast.ts';
import { Icons } from '../../ui/icons.ts';

export class ReceivePage {
  private container: HTMLElement;
  private videoEl: HTMLVideoElement | null = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private workerPool: DecodeWorkerPool | null = null;

  private mediaStream: MediaStream | null = null;
  private isScanning = false;
  private facingMode: 'environment' | 'user' = 'environment';
  private torchEnabled = false;

  // Decoding session state
  private activeSessionId: number | null = null;
  private decoder: FountainDecoder | null = null;
  private isEncryptedSession = false;
  private framesCount = 0;
  private bytesDecoded = 0;
  private startTime = 0;

  // Completed transfer result
  private completedFile: { metadata: ContainerMetadata; bytes: Uint8Array; rawCiphertext?: Uint8Array } | null = null;
  private activeBlobUrl: string | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render(): void {
    this.container.innerHTML = `
      <div class="page-container receive-page">
        <div class="page-header">
          <div class="title-group">
            <h2 class="page-title"><span class="title-icon">${Icons.camera}</span> Optical Receiver</h2>
            <p class="page-subtitle">Capture fountain-coded light stream with camera viewfinder</p>
          </div>
          <div class="header-badges">
            <span class="status-badge live-badge" id="cameraStatusBadge">
              <span class="pulse-dot"></span> CAMERA ACTIVE
            </span>
          </div>
        </div>

        <div class="receive-layout">
          <!-- Left: Camera Viewfinder & Alignment HUD -->
          <div class="viewfinder-col">
            <div class="card glass-panel viewfinder-card">
              <div class="viewfinder-wrapper" id="viewfinderWrapper">
                <video id="cameraVideo" autoplay playsinline muted></video>

                <!-- Reticle Overlay -->
                <div class="reticle-hud">
                  <div class="reticle-corner top-left"></div>
                  <div class="reticle-corner top-right"></div>
                  <div class="reticle-corner bottom-left"></div>
                  <div class="reticle-corner bottom-right"></div>
                  <div class="reticle-crosshair"></div>
                  <div class="reticle-scanline"></div>
                  <div class="reticle-text" id="reticleHint">Align camera to sending QR stream</div>
                </div>
              </div>

              <!-- Camera Controls Bar -->
              <div class="camera-toolbar">
                <button id="btnSwitchCamera" class="btn btn-sm btn-outline">
                  ${Icons.refresh} Switch Camera
                </button>
                <button id="btnToggleTorch" class="btn btn-sm btn-outline">
                  ${Icons.torch} Torch
                </button>
                <button id="btnResetReceiver" class="btn btn-sm btn-outline">
                  Reset Stream
                </button>
              </div>

              <!-- Real-time HUD Telemetry -->
              <div class="telemetry-grid">
                <div class="telemetry-card">
                  <span class="hud-label">Goodput Speed</span>
                  <span class="hud-value highlight" id="hudSpeed">0.0 KB/s</span>
                </div>
                <div class="telemetry-card">
                  <span class="hud-label">Blocks Recovered</span>
                  <span class="hud-value" id="hudBlocks">0 / 0</span>
                </div>
                <div class="telemetry-card">
                  <span class="hud-label">Fountain Completion</span>
                  <span class="hud-value" id="hudPercent">0%</span>
                </div>
                <div class="telemetry-card">
                  <span class="hud-label">Frames Captured</span>
                  <span class="hud-value" id="hudFrames">0</span>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="hud-progress-container">
                <div class="hud-progress-bar" id="hudProgressBar" style="width: 0%"></div>
              </div>
            </div>
          </div>

          <!-- Right: Reception Status & Completed File Hub -->
          <div class="receive-sidebar">
            <div class="card glass-panel transfer-status-card" id="transferStatusCard">
              <h3 class="panel-heading">${Icons.activity} Transfer Telemetry</h3>

              <div id="receptionStandby" class="reception-standby">
                <div class="standby-pulse-icon">${Icons.beam}</div>
                <h4>Listening for Light Waves...</h4>
                <p>Hold camera steadily in front of the sending screen.</p>
              </div>

              <!-- Decryption Passphrase Prompt (Hidden until encrypted payload finishes) -->
              <div id="decryptPrompt" class="decrypt-prompt hidden">
                <div class="decrypt-header">
                  <span class="icon-accent">${Icons.lock}</span>
                  <div>
                    <h4>SpectraVault Encrypted</h4>
                    <p>Enter the sender's passphrase to decrypt</p>
                  </div>
                </div>
                <div class="form-group">
                  <input type="password" id="rxPassphrase" class="cyber-input" placeholder="Passphrase" />
                </div>
                <button id="btnDecryptNow" class="btn btn-primary btn-full">
                  ${Icons.shield} Unlock & Decrypt Payload
                </button>
              </div>

              <!-- Completed File Result View (Hidden until complete) -->
              <div id="resultViewer" class="result-viewer hidden">
                <div class="result-header">
                  <div class="badge-success-row">
                    <span class="badge-success">${Icons.check} RECEIVED & VERIFIED</span>
                  </div>
                  <h3 id="resFileName" class="result-filename">document.pdf</h3>
                  <div class="result-meta">
                    <span id="resFileSize">0 KB</span> • <span id="resFileSha" class="sha-tag">SHA-256 OK</span>
                  </div>
                </div>

                <!-- In-Browser Media Preview -->
                <div id="mediaPreviewContainer" class="media-preview-container"></div>

                <div class="result-actions">
                  <a id="btnDownload" class="btn btn-primary btn-full" download>
                    ${Icons.download} Save File to Device
                  </a>
                  <button id="btnBurn" class="btn btn-danger btn-full">
                    ${Icons.flame} Burn-After-Reading (Wipe RAM)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.initCamera();
  }

  private bindEvents(): void {
    const btnSwitchCamera = this.container.querySelector('#btnSwitchCamera') as HTMLButtonElement;
    const btnToggleTorch = this.container.querySelector('#btnToggleTorch') as HTMLButtonElement;
    const btnResetReceiver = this.container.querySelector('#btnResetReceiver') as HTMLButtonElement;
    const btnDecryptNow = this.container.querySelector('#btnDecryptNow') as HTMLButtonElement;
    const btnBurn = this.container.querySelector('#btnBurn') as HTMLButtonElement;
    this.videoEl = this.container.querySelector('#cameraVideo') as HTMLVideoElement;

    btnSwitchCamera.addEventListener('click', () => {
      this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
      this.initCamera();
    });

    btnToggleTorch.addEventListener('click', () => {
      this.toggleTorch();
    });

    btnResetReceiver.addEventListener('click', () => {
      this.resetTransfer();
      Toast.show('Stream tracker reset', 'info');
    });

    btnDecryptNow.addEventListener('click', () => {
      this.attemptDecryption();
    });

    btnBurn.addEventListener('click', () => {
      this.burnPayload();
    });
  }

  private async initCamera(): Promise<void> {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: this.facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.videoEl) {
        this.videoEl.srcObject = this.mediaStream;
        await this.videoEl.play();
      }

      this.startScanning();
    } catch (err: any) {
      Toast.error(`Camera access error: ${err.message}`);
    }
  }

  private async toggleTorch(): Promise<void> {
    if (!this.mediaStream) return;
    const track = this.mediaStream.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        this.torchEnabled = !this.torchEnabled;
        await (track as any).applyConstraints({
          advanced: [{ torch: this.torchEnabled }],
        });
        Toast.show(this.torchEnabled ? 'Torch ON' : 'Torch OFF', 'info');
      } else {
        Toast.warning('Hardware torch not supported on this device');
      }
    } catch (err: any) {
      Toast.error(`Torch toggle failed: ${err.message}`);
    }
  }

  private startScanning(): void {
    if (this.isScanning) return;
    this.isScanning = true;

    if (!this.workerPool) {
      this.workerPool = new DecodeWorkerPool(2);
    }

    if (!this.offscreenCanvas) {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    }

    const scanFrame = () => {
      if (!this.isScanning || !this.videoEl || !this.offscreenCanvas || !this.offscreenCtx || !this.workerPool) return;

      if (this.videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const vw = this.videoEl.videoWidth;
        const vh = this.videoEl.videoHeight;

        if (vw > 0 && vh > 0) {
          // Scale to max 640px for rapid WASM decode
          const targetW = Math.min(640, vw);
          const targetH = Math.floor((targetW / vw) * vh);

          if (this.offscreenCanvas.width !== targetW || this.offscreenCanvas.height !== targetH) {
            this.offscreenCanvas.width = targetW;
            this.offscreenCanvas.height = targetH;
          }

          this.offscreenCtx.drawImage(this.videoEl, 0, 0, targetW, targetH);
          const imgData = this.offscreenCtx.getImageData(0, 0, targetW, targetH);

          // Submit to worker pool
          this.workerPool.decodeFrame(imgData, (symbols) => {
            for (const sym of symbols) {
              this.handleSymbol(sym);
            }
          });
        }
      }

      requestAnimationFrame(scanFrame);
    };

    requestAnimationFrame(scanFrame);
  }

  private handleSymbol(rawBytes: Uint8Array): void {
    const unpacked = unpackFrame(rawBytes);
    if (!unpacked) return;

    const { header, chunk } = unpacked;

    // Check if session changed or starting fresh
    if (this.activeSessionId !== header.sessionId) {
      this.activeSessionId = header.sessionId;
      this.decoder = new FountainDecoder(header.k, header.blockLength, header.totalLength);
      this.isEncryptedSession = (header.flags & ProtocolFlags.ENCRYPTED) !== 0;
      this.framesCount = 0;
      this.bytesDecoded = 0;
      this.startTime = performance.now();

      const reticleHint = this.container.querySelector('#reticleHint');
      if (reticleHint) {
        reticleHint.textContent = `Locked on Session 0x${header.sessionId.toString(16).toUpperCase()} (${header.k} blocks)`;
      }
    }

    if (!this.decoder || this.decoder.isComplete()) return;

    this.framesCount++;
    this.bytesDecoded += chunk.length;

    const { isComplete, newlySolved } = this.decoder.addPacket(header.sequenceNumber, chunk);
    const progress = this.decoder.getProgress();

    // Update Telemetry
    const elapsedSec = (performance.now() - this.startTime) / 1000;
    const speedKBps = elapsedSec > 0 ? (this.bytesDecoded / 1024) / elapsedSec : 0;

    const hudSpeed = this.container.querySelector('#hudSpeed');
    const hudBlocks = this.container.querySelector('#hudBlocks');
    const hudPercent = this.container.querySelector('#hudPercent');
    const hudFrames = this.container.querySelector('#hudFrames');
    const hudProgressBar = this.container.querySelector('#hudProgressBar') as HTMLElement;

    if (hudSpeed) hudSpeed.textContent = `${speedKBps.toFixed(1)} KB/s`;
    if (hudBlocks) hudBlocks.textContent = `${progress.solved} / ${progress.K}`;
    if (hudPercent) hudPercent.textContent = `${progress.percentage}%`;
    if (hudFrames) hudFrames.textContent = `${this.framesCount}`;
    if (hudProgressBar) hudProgressBar.style.width = `${progress.percentage}%`;

    if (isComplete) {
      this.onStreamCompleted();
    }
  }

  private async onStreamCompleted(): Promise<void> {
    if (!this.decoder) return;

    try {
      const reconstructedBytes = this.decoder.reconstruct();

      // Confetti burst!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (this.isEncryptedSession) {
        // Show Decrypt Passphrase Prompt
        (this.container.querySelector('#receptionStandby') as HTMLElement).classList.add('hidden');
        (this.container.querySelector('#decryptPrompt') as HTMLElement).classList.remove('hidden');
        // Store raw ciphertext until user enters password
        this.completedFile = {
          metadata: { name: 'Encrypted Stream', type: 'application/octet-stream', sha256: '', originalSize: reconstructedBytes.length, compressed: false },
          bytes: reconstructedBytes,
          rawCiphertext: reconstructedBytes,
        };
        Toast.show('Fountain stream fully captured! Enter passphrase to decrypt.', 'info');
      } else {
        // Unpack container directly
        const { metadata, fileBytes } = await unpackContainer(reconstructedBytes);
        this.completedFile = { metadata, bytes: fileBytes };
        this.displayCompletedFile();
      }
    } catch (err: any) {
      Toast.error(`Reconstruction error: ${err.message}`);
    }
  }

  private async attemptDecryption(): Promise<void> {
    const rxPassphrase = (this.container.querySelector('#rxPassphrase') as HTMLInputElement).value;
    if (!rxPassphrase) {
      Toast.warning('Please enter the encryption passphrase');
      return;
    }

    if (!this.completedFile?.rawCiphertext) return;

    try {
      // Decrypt container
      const decryptedContainerBytes = await SpectraCrypto.decrypt(this.completedFile.rawCiphertext, rxPassphrase);
      const { metadata, fileBytes } = await unpackContainer(decryptedContainerBytes);

      this.completedFile = { metadata, bytes: fileBytes };
      (this.container.querySelector('#decryptPrompt') as HTMLElement).classList.add('hidden');
      this.displayCompletedFile();
      Toast.success('Decryption and SHA-256 verification successful!');
    } catch (err: any) {
      Toast.error('Decryption failed! Incorrect passphrase or corrupted payload.');
    }
  }

  private displayCompletedFile(): void {
    if (!this.completedFile) return;

    (this.container.querySelector('#receptionStandby') as HTMLElement).classList.add('hidden');
    const resultViewer = this.container.querySelector('#resultViewer') as HTMLElement;
    resultViewer.classList.remove('hidden');

    const meta = this.completedFile.metadata;
    (this.container.querySelector('#resFileName') as HTMLElement).textContent = meta.name;
    (this.container.querySelector('#resFileSize') as HTMLElement).textContent = `${(this.completedFile.bytes.length / 1024).toFixed(1)} KB`;
    (this.container.querySelector('#resFileSha') as HTMLElement).textContent = `SHA: ${meta.sha256.substring(0, 8)}... (VALID)`;

    // Create Blob URL for download & preview
    const blob = new Blob([this.completedFile.bytes as any], { type: meta.type });
    this.activeBlobUrl = URL.createObjectURL(blob);

    const btnDownload = this.container.querySelector('#btnDownload') as HTMLAnchorElement;
    btnDownload.href = this.activeBlobUrl;
    btnDownload.download = meta.name;

    // Render in-browser preview if media/text
    const previewContainer = this.container.querySelector('#mediaPreviewContainer') as HTMLElement;
    previewContainer.innerHTML = '';

    if (meta.type.startsWith('image/')) {
      previewContainer.innerHTML = `<img src="${this.activeBlobUrl}" class="preview-img" alt="Received image" />`;
    } else if (meta.type.startsWith('video/')) {
      previewContainer.innerHTML = `<video src="${this.activeBlobUrl}" controls class="preview-video"></video>`;
    } else if (meta.type.startsWith('audio/')) {
      previewContainer.innerHTML = `<audio src="${this.activeBlobUrl}" controls class="preview-audio"></audio>`;
    } else if (meta.type.startsWith('text/') || meta.name.endsWith('.txt')) {
      const text = new TextDecoder().decode(this.completedFile.bytes.subarray(0, 2048));
      previewContainer.innerHTML = `<pre class="preview-text">${text}</pre>`;
    }
  }

  private burnPayload(): void {
    if (this.activeBlobUrl) {
      URL.revokeObjectURL(this.activeBlobUrl);
      this.activeBlobUrl = null;
    }

    if (this.completedFile) {
      this.completedFile.bytes.fill(0); // Zero out buffer in RAM
      this.completedFile = null;
    }

    this.resetTransfer();
    Toast.show('RAM purged. All payload traces burned.', 'warning');
  }

  private resetTransfer(): void {
    this.activeSessionId = null;
    this.decoder = null;
    this.completedFile = null;
    this.framesCount = 0;
    this.bytesDecoded = 0;

    (this.container.querySelector('#hudSpeed') as HTMLElement).textContent = '0.0 KB/s';
    (this.container.querySelector('#hudBlocks') as HTMLElement).textContent = '0 / 0';
    (this.container.querySelector('#hudPercent') as HTMLElement).textContent = '0%';
    (this.container.querySelector('#hudFrames') as HTMLElement).textContent = '0';
    (this.container.querySelector('#hudProgressBar') as HTMLElement).style.width = '0%';

    (this.container.querySelector('#resultViewer') as HTMLElement).classList.add('hidden');
    (this.container.querySelector('#decryptPrompt') as HTMLElement).classList.add('hidden');
    (this.container.querySelector('#receptionStandby') as HTMLElement).classList.remove('hidden');
  }

  public destroy(): void {
    this.isScanning = false;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.workerPool) {
      this.workerPool.terminate();
      this.workerPool = null;
    }
    if (this.activeBlobUrl) {
      URL.revokeObjectURL(this.activeBlobUrl);
    }
  }
}
