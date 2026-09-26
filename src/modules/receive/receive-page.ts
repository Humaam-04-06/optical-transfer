/**
 * SpectraBeam - Optical Receiver (Receive Page)
 * Playful Geometric Theme Implementation (100% Fluid & Responsive)
 */

import confetti from 'canvas-confetti';
import { FountainDecoder } from '../../core/fountain.ts';
import { unpackFrame, unpackContainer, ContainerMetadata } from '../../core/protocol.ts';
import { SpectraCrypto } from '../../core/crypto.ts';
import { DecodeWorkerPool } from '../../workers/worker-pool.ts';
import { ProtocolFlags } from '../../core/types.ts';
import { Toast } from '../../ui/toast.ts';
import { Alert } from '../../ui/alert.ts';
import { Icons } from '../../ui/icons.ts';
import { SoundFX } from '../../ui/audio.ts';
import { TurboReceiverController, TurboReceiverProgress } from './turbo-receiver.ts';
import { decodePairingToken, type TurboPairingToken } from '../../core/turbo-protocol.ts';

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

  // Turbo Hybrid Engine state
  private turboReceiver: TurboReceiverController | null = null;
  private isTurboActive = false;

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
    const isMuted = SoundFX.isMuted();

    this.container.innerHTML = `
      <div class="space-y-6 sm:space-y-8 animate-pop-in">
        
        <!-- Page Title Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1E293B] pb-5">
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-[#34D399] text-[#1E293B] border-2 border-[#1E293B] shadow-pop-sm flex items-center justify-center p-2 flex-shrink-0">
                ${Icons.camera}
              </div>
              <h2 class="font-heading font-black text-2xl sm:text-3xl text-[#1E293B]">Optical Receiver</h2>
            </div>
            <p class="font-body text-sm sm:text-base text-[#64748B] pl-0 sm:pl-13">
              Capture fountain-coded light stream with camera viewfinder and multi-threaded WASM decoder
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <button id="btnToggleSound" class="btn-candy btn-candy-secondary btn-candy-sm text-xs gap-1.5" title="Toggle audio chime">
              <span id="soundIcon">${isMuted ? Icons.volumeMute : Icons.volume}</span>
              <span id="soundLabel">${isMuted ? 'Muted' : 'Sound On'}</span>
            </button>
            <span class="badge-pill bg-[#34D399] text-[#1E293B]">
              <span class="w-2 h-2 rounded-full bg-[#1E293B] animate-pulse"></span>
              <span id="sensorStatusText">SENSOR ACTIVE</span>
            </span>
          </div>
        </div>

        <!-- 100% Fluid Responsive Layout: 7 cols Viewfinder, 5 cols Telemetry & File Hub -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          <!-- ==========================================
               LEFT COLUMN: Camera Viewfinder & Reticle HUD
               ========================================== -->
          <div class="lg:col-span-7 space-y-6 w-full">
            <div class="card-sticker shadow-pop-xl bg-white p-4 sm:p-6 space-y-4">
              
              <!-- Viewfinder Window Top Header -->
              <div class="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1E293B] pb-3">
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1.5">
                    <span class="w-3 h-3 rounded-full bg-[#34D399] border-2 border-[#1E293B]"></span>
                    <span class="w-3 h-3 rounded-full bg-[#FBBF24] border-2 border-[#1E293B]"></span>
                    <span class="w-3 h-3 rounded-full bg-[#F472B6] border-2 border-[#1E293B]"></span>
                  </div>
                  <span class="font-heading font-black text-xs sm:text-sm text-[#1E293B] ml-2">
                    WASM Optical Scanner
                  </span>
                </div>

                <div class="flex items-center gap-2 text-xs font-mono font-bold text-[#64748B]">
                  <span id="cameraResolution">Waiting...</span>
                </div>
              </div>

              <!-- High-Performance Camera Frame (100% Responsive) -->
              <div class="relative w-full aspect-[4/3] sm:aspect-video bg-[#0F172A] rounded-2xl border-2 border-[#1E293B] shadow-pop overflow-hidden flex items-center justify-center" id="viewfinderWrapper">
                <video id="cameraVideo" autoplay playsinline muted class="w-full h-full object-cover"></video>

                <!-- Reticle HUD Overlay with Playful Geometric Corners & Scanning Laser -->
                <div class="reticle-hud" id="reticleOverlay">
                  <div class="reticle-target">
                    <div class="reticle-bracket reticle-bracket-tl"></div>
                    <div class="reticle-bracket reticle-bracket-tr"></div>
                    <div class="reticle-bracket reticle-bracket-bl"></div>
                    <div class="reticle-bracket reticle-bracket-br"></div>
                    <div class="reticle-laser"></div>
                  </div>
                  <div class="mt-4 px-3 py-1 rounded-full bg-[#1E293B]/80 text-[#34D399] border border-[#34D399] text-[11px] sm:text-xs font-mono font-bold tracking-wide shadow-md" id="reticleHint">
                    Align camera to sending screen QR stream
                  </div>
                </div>

                <!-- Camera Permission / Off Standby Overlay -->
                <div id="cameraStandbyPlaceholder" class="hidden absolute inset-0 bg-[#FFFDF5] bg-dot-grid flex-col items-center justify-center p-6 text-center z-30">
                  <div class="w-16 h-16 rounded-2xl bg-[#FBBF24] border-2 border-[#1E293B] shadow-pop flex items-center justify-center text-[#1E293B] mb-3">
                    ${Icons.camera}
                  </div>
                  <h3 class="font-heading font-black text-lg text-[#1E293B] mb-1">Camera Access Required</h3>
                  <p class="font-body text-xs text-[#64748B] max-w-xs mb-4">
                    Please allow camera permissions or upload a QR image/video frame to decode
                  </p>
                  <button id="btnRetryCamera" class="btn-candy btn-candy-sm">
                    ${Icons.refresh} Request Camera
                  </button>
                </div>
              </div>

              <!-- Camera Controls Bar -->
              <div class="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <div class="flex flex-wrap items-center gap-2">
                  <button id="btnSwitchCamera" class="btn-candy btn-candy-secondary btn-candy-sm text-xs gap-1.5" title="Switch between Front and Back Camera">
                    ${Icons.refresh} <span>Switch Cam</span>
                  </button>
                  <button id="btnToggleTorch" class="btn-candy btn-candy-secondary btn-candy-sm text-xs gap-1.5" title="Toggle Hardware Flashlight">
                    ${Icons.torch} <span>Torch</span>
                  </button>
                  <button id="btnResetReceiver" class="btn-candy btn-candy-secondary btn-candy-sm text-xs gap-1.5" title="Reset Current Decoder State">
                    ${Icons.close} <span>Reset</span>
                  </button>
                </div>

                <!-- Fallback Image Scanner (Great for testing without a second camera!) -->
                <div>
                  <input type="file" id="scanFileInput" accept="image/*" class="hidden" />
                  <button id="btnScanFile" class="btn-candy btn-candy-mint btn-candy-sm text-xs gap-1.5" title="Scan QR from static image file">
                    ${Icons.upload} <span>Scan Image</span>
                  </button>
                </div>
              </div>

              <!-- Real-time HUD Telemetry Grid (2 cols mobile, 4 cols desktop) -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div class="bg-[#F8FAFC] border-2 border-[#1E293B] rounded-xl p-2.5 text-center shadow-pop-sm">
                  <span class="block text-[10px] font-heading font-bold text-[#64748B] uppercase">Goodput</span>
                  <span class="font-mono font-bold text-xs sm:text-base text-[#059669]" id="hudSpeed">0.0 KB/s</span>
                </div>

                <div class="bg-[#F8FAFC] border-2 border-[#1E293B] rounded-xl p-2.5 text-center shadow-pop-sm">
                  <span class="block text-[10px] font-heading font-bold text-[#64748B] uppercase">Blocks</span>
                  <span class="font-mono font-bold text-xs sm:text-base text-[#1E293B]" id="hudBlocks">0 / 0</span>
                </div>

                <div class="bg-[#F8FAFC] border-2 border-[#1E293B] rounded-xl p-2.5 text-center shadow-pop-sm">
                  <span class="block text-[10px] font-heading font-bold text-[#64748B] uppercase">Fountain Solved</span>
                  <span class="font-mono font-bold text-xs sm:text-base text-[#8B5CF6]" id="hudPercent">0%</span>
                </div>

                <div class="bg-[#F8FAFC] border-2 border-[#1E293B] rounded-xl p-2.5 text-center shadow-pop-sm">
                  <span class="block text-[10px] font-heading font-bold text-[#64748B] uppercase">Frames Decoded</span>
                  <span class="font-mono font-bold text-xs sm:text-base text-[#1E293B]" id="hudFrames">0</span>
                </div>
              </div>

              <!-- Candy Striped Fountain Progress Bar -->
              <div class="space-y-1.5 pt-1">
                <div class="flex items-center justify-between text-xs font-heading font-bold text-[#1E293B]">
                  <span>Reconstruction Progress</span>
                  <span id="hudProgressText">Waiting for transmission...</span>
                </div>
                <div class="w-full h-4 bg-[#F1F5F9] border-2 border-[#1E293B] rounded-full overflow-hidden p-0.5 shadow-pop-sm">
                  <div id="hudProgressBar" class="h-full bg-[#34D399] candy-progress-striped rounded-full transition-all duration-200" style="width: 0%"></div>
                </div>
              </div>

            </div>
          </div>

          <!-- ==========================================
               RIGHT COLUMN: Telemetry & Completed File Hub
               ========================================== -->
          <div class="lg:col-span-5 space-y-6 w-full">
            <div class="card-sticker shadow-pop-lg bg-white p-5 sm:p-6 space-y-5" id="transferStatusCard">
              
              <div class="flex items-center justify-between border-b-2 border-[#1E293B] pb-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-[#FBBF24] border-2 border-[#1E293B] shadow-pop-sm flex items-center justify-center text-[#1E293B]">
                    ${Icons.activity}
                  </div>
                  <h3 class="font-heading font-black text-base text-[#1E293B]">Transfer Telemetry</h3>
                </div>
                <span class="badge-pill bg-[#F1F5F9] text-[#1E293B] text-[10px]" id="badgeSessionStatus">
                  STANDBY
                </span>
              </div>

              <!-- Standby State -->
              <div id="receptionStandby" class="py-8 px-4 text-center space-y-3">
                <div class="w-16 h-16 rounded-full bg-[#FFFDF5] border-2 border-[#1E293B] shadow-pop flex items-center justify-center text-[#8B5CF6] mx-auto animate-bounce">
                  ${Icons.beam}
                </div>
                <h4 class="font-heading font-black text-lg text-[#1E293B]">Listening for Optical Stream</h4>
                <p class="font-body text-xs sm:text-sm text-[#64748B] max-w-xs mx-auto">
                  Hold camera steadily in front of transmitter screen. Automatically detects optical fountain QR streams OR 1-second Turbo pairing codes (10–50 MB/s).
                </p>
              </div>

              <!-- Turbo Transfer Live Dashboard Card -->
              <div id="turboTransferCard" class="hidden space-y-4 pt-2">
                <div class="p-4 rounded-2xl bg-[#ECFDF5] border-2 border-[#1E293B] shadow-pop-sm space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="badge-pill bg-[#34D399] text-[#1E293B] text-[10px] font-black">
                      ⚡ TURBO HYBRID STREAM
                    </span>
                    <span id="turboEndpointBadge" class="font-mono text-[10px] text-[#065F46] font-bold truncate max-w-[140px]">
                      Local Direct
                    </span>
                  </div>
                  <div class="space-y-1">
                    <h3 id="turboFileName" class="font-heading font-black text-base text-[#1E293B] truncate">
                      file.bin
                    </h3>
                    <div class="flex items-center justify-between text-xs font-mono text-[#64748B]">
                      <span id="turboTransferBytes">0 MB / 0 MB</span>
                      <span id="turboSpeedometer" class="font-bold text-[#059669]">0.0 MB/s</span>
                    </div>
                  </div>
                  <div class="w-full h-3 bg-white border-2 border-[#1E293B] rounded-full overflow-hidden p-0.5 shadow-pop-sm">
                    <div id="turboProgressBar" class="h-full bg-[#34D399] candy-progress-striped rounded-full transition-all duration-150" style="width: 0%"></div>
                  </div>
                  <div class="flex items-center gap-1.5 text-[11px] font-mono text-[#065F46]">
                    <span class="w-2 h-2 rounded-full bg-[#059669] animate-ping"></span>
                    <span id="turboStatusHint">AES-256-GCM Direct Ephemeral Stream</span>
                  </div>
                </div>
              </div>

              <!-- Decryption Passphrase Prompt (Displays when an encrypted stream is captured) -->
              <div id="decryptPrompt" class="hidden space-y-4 pt-2">
                <div class="p-4 rounded-2xl bg-[#FEF3C7] border-2 border-[#1E293B] shadow-pop-sm space-y-2">
                  <div class="flex items-center gap-2 text-[#B45309]">
                    ${Icons.lock}
                    <h4 class="font-heading font-black text-sm text-[#1E293B]">SpectraVault™ Encrypted Stream</h4>
                  </div>
                  <p class="font-body text-xs text-[#78350F]">
                    All fountain blocks successfully reconstructed! Please enter the sender's passphrase to decrypt the payload.
                  </p>
                </div>

                <div class="space-y-2">
                  <label for="rxPassphrase" class="block font-heading font-bold text-xs text-[#1E293B] uppercase">
                    Passphrase
                  </label>
                  <input type="password" id="rxPassphrase" class="input-geometric text-sm" placeholder="Enter passphrase to decrypt" />
                </div>

                <button id="btnDecryptNow" class="btn-candy btn-candy-secondary btn-full">
                  ${Icons.shield} Unlock & Decrypt Payload
                </button>
              </div>

              <!-- Completed File Result View (Displays when fully decrypted & verified) -->
              <div id="resultViewer" class="hidden space-y-4 pt-2">
                <div class="p-4 rounded-2xl bg-[#ECFDF5] border-2 border-[#1E293B] shadow-pop-sm space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full bg-[#34D399] border border-[#1E293B] flex items-center justify-center text-[#1E293B] p-0.5">
                      ${Icons.check}
                    </span>
                    <span class="font-heading font-extrabold text-xs text-[#065F46] uppercase tracking-wider">
                      RECONSTRUCTION VERIFIED
                    </span>
                  </div>
                  <h3 id="resFileName" class="font-heading font-black text-lg text-[#1E293B] break-all">
                    document.pdf
                  </h3>
                  <div class="flex flex-wrap items-center gap-2 text-xs font-mono text-[#64748B]">
                    <span id="resFileSize" class="font-bold text-[#1E293B]">0 KB</span>
                    <span>•</span>
                    <span id="resFileSha" class="bg-white px-2 py-0.5 rounded border border-[#CBD5E1] text-[11px] truncate max-w-[180px]">
                      SHA-256 OK
                    </span>
                  </div>
                </div>

                <!-- In-Browser Media Preview Box -->
                <div id="mediaPreviewContainer" class="rounded-2xl border-2 border-[#1E293B] overflow-hidden bg-[#F8FAFC] max-h-56 flex items-center justify-center p-2 empty:hidden"></div>

                <!-- Action Buttons: Download & Burn-After-Reading -->
                <div class="space-y-2.5 pt-1">
                  <a id="btnDownload" class="btn-candy btn-full" download>
                    ${Icons.download} Save File to Device
                  </a>

                  <button id="btnBurn" class="btn-candy btn-candy-pink btn-full">
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
    const btnRetryCamera = this.container.querySelector('#btnRetryCamera') as HTMLButtonElement;
    const btnScanFile = this.container.querySelector('#btnScanFile') as HTMLButtonElement;
    const scanFileInput = this.container.querySelector('#scanFileInput') as HTMLInputElement;
    const btnToggleSound = this.container.querySelector('#btnToggleSound') as HTMLButtonElement;
    const btnDecryptNow = this.container.querySelector('#btnDecryptNow') as HTMLButtonElement;
    const btnBurn = this.container.querySelector('#btnBurn') as HTMLButtonElement;
    this.videoEl = this.container.querySelector('#cameraVideo') as HTMLVideoElement;

    // Camera switches
    btnSwitchCamera.addEventListener('click', () => {
      this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
      this.initCamera();
    });

    btnToggleTorch.addEventListener('click', () => {
      this.toggleTorch();
    });

    btnResetReceiver.addEventListener('click', () => {
      this.resetTransfer();
      Toast.show('Optical receiver stream reset', 'info');
    });

    if (btnRetryCamera) {
      btnRetryCamera.addEventListener('click', () => {
        this.initCamera();
      });
    }

    // Static image scan fallback
    btnScanFile.addEventListener('click', () => {
      scanFileInput.click();
    });

    scanFileInput.addEventListener('change', () => {
      if (scanFileInput.files?.length) {
        this.processImageFile(scanFileInput.files[0]);
      }
    });

    // Sound toggle
    btnToggleSound.addEventListener('click', () => {
      const isMuted = SoundFX.toggleMute();
      const soundIcon = this.container.querySelector('#soundIcon');
      const soundLabel = this.container.querySelector('#soundLabel');
      if (soundIcon) soundIcon.innerHTML = isMuted ? Icons.volumeMute : Icons.volume;
      if (soundLabel) soundLabel.textContent = isMuted ? 'Muted' : 'Sound On';
      Toast.show(isMuted ? 'Audio feedback muted' : 'Audio chime enabled', 'info');
    });

    // Decryption button
    btnDecryptNow.addEventListener('click', () => {
      this.attemptDecryption();
    });

    // Burn button with SweetAlert2 confirmation
    btnBurn.addEventListener('click', async () => {
      const confirmed = await Alert.confirm(
        'Burn Payload from RAM?',
        'This will zero out all memory buffers and destroy the decrypted file in browser memory. This cannot be undone.'
      );
      if (confirmed) {
        this.burnPayload();
      }
    });
  }

  private async initCamera(): Promise<void> {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    const placeholder = this.container.querySelector('#cameraStandbyPlaceholder') as HTMLElement;
    const resEl = this.container.querySelector('#cameraResolution');

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
        if (placeholder) placeholder.classList.add('hidden');
        if (resEl) resEl.textContent = `${this.videoEl.videoWidth || 1280}x${this.videoEl.videoHeight || 720}`;
      }

      this.startScanning();
    } catch (err: any) {
      if (placeholder) placeholder.classList.remove('hidden');
      if (resEl) resEl.textContent = 'Camera Inactive';
      Toast.show(`Camera access error: ${err.message}`, 'error');
    }
  }

  private async toggleTorch(): Promise<void> {
    if (!this.mediaStream) {
      Toast.warning('Camera stream not active');
      return;
    }
    const track = this.mediaStream.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        this.torchEnabled = !this.torchEnabled;
        await (track as any).applyConstraints({
          advanced: [{ torch: this.torchEnabled }],
        });
        Toast.show(this.torchEnabled ? 'Torch Activated' : 'Torch Deactivated', 'info');
      } else {
        Toast.warning('Hardware torch not supported on this camera');
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

          // Submit to WASM worker pool
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

  /**
   * Allows decoding an uploaded QR frame image file directly
   */
  private async processImageFile(file: File): Promise<void> {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        if (!this.workerPool) {
          this.workerPool = new DecodeWorkerPool(2);
        }
        this.workerPool.decodeFrame(imgData, (symbols) => {
          if (symbols.length > 0) {
            Toast.success(`Decoded ${symbols.length} symbol(s) from image`);
            for (const sym of symbols) {
              this.handleSymbol(sym);
            }
          } else {
            Toast.warning('No valid QR fountain symbol found in image');
          }
        });
      }
      URL.revokeObjectURL(img.src);
    };
  }

  private handleSymbol(rawBytes: Uint8Array): void {
    // 1. Check for Turbo Optical Pairing QR Handshake ("SPTB:...")
    let possibleTurboText: string | null = null;
    if (
      rawBytes.length >= 5 &&
      rawBytes[0] === 0x53 &&
      rawBytes[1] === 0x50 &&
      rawBytes[2] === 0x54 &&
      rawBytes[3] === 0x42 &&
      rawBytes[4] === 0x3a
    ) {
      try {
        possibleTurboText = new TextDecoder().decode(rawBytes);
      } catch {
        possibleTurboText = null;
      }
    } else {
      try {
        const text = new TextDecoder('utf-8', { fatal: false }).decode(rawBytes);
        if (text.startsWith('SPTB:')) {
          possibleTurboText = text;
        }
      } catch {}
    }

    if (possibleTurboText) {
      const token = decodePairingToken(possibleTurboText);
      if (token) {
        this.handleTurboPairing(token);
        return;
      }
    }

    // If Turbo is currently active, ignore standard fountain symbols
    if (this.isTurboActive) return;

    // 2. Standard Optical Fountain Code Frame Decoding
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

      const isChroma = (header.flags & ProtocolFlags.CHROMA_RGB) !== 0;
      const reticleHint = this.container.querySelector('#reticleHint');
      const badgeSessionStatus = this.container.querySelector('#badgeSessionStatus');
      if (reticleHint) {
        reticleHint.textContent = `Locked: 0x${header.sessionId.toString(16).toUpperCase()} (${header.k} blocks) ${isChroma ? '🌈 [ChromaBeam 3X]' : ''}`;
      }
      if (badgeSessionStatus) {
        badgeSessionStatus.textContent = isChroma ? '🌈 CHROMABEAM 3X' : `RECEIVING (${header.k} BLOCKS)`;
        badgeSessionStatus.className = isChroma
          ? 'badge-pill bg-[#F472B6] text-white text-[10px] animate-pulse font-black'
          : 'badge-pill bg-[#34D399] text-[#1E293B] text-[10px] animate-pulse';
      }
    }

    if (!this.decoder || this.decoder.isComplete()) return;

    this.framesCount++;
    this.bytesDecoded += chunk.length;

    const { isComplete, newlySolved } = this.decoder.addPacket(header.sequenceNumber, chunk);
    const progress = this.decoder.getProgress();

    if (newlySolved > 0) {
      SoundFX.playPacketTick();
    }

    // Update Telemetry
    const elapsedSec = (performance.now() - this.startTime) / 1000;
    const speedKBps = elapsedSec > 0 ? this.bytesDecoded / 1024 / elapsedSec : 0;

    const hudSpeed = this.container.querySelector('#hudSpeed');
    const hudBlocks = this.container.querySelector('#hudBlocks');
    const hudPercent = this.container.querySelector('#hudPercent');
    const hudFrames = this.container.querySelector('#hudFrames');
    const hudProgressBar = this.container.querySelector('#hudProgressBar') as HTMLElement;
    const hudProgressText = this.container.querySelector('#hudProgressText');

    if (hudSpeed) hudSpeed.textContent = `${speedKBps.toFixed(1)} KB/s`;
    if (hudBlocks) hudBlocks.textContent = `${progress.solved} / ${progress.K}`;
    if (hudPercent) hudPercent.textContent = `${progress.percentage}%`;
    if (hudFrames) hudFrames.textContent = `${this.framesCount}`;
    if (hudProgressBar) hudProgressBar.style.width = `${progress.percentage}%`;
    if (hudProgressText) hudProgressText.textContent = `${progress.solved} of ${progress.K} blocks reconstructed (${progress.percentage}%)`;

    if (isComplete) {
      this.onStreamCompleted();
    }
  }

  /**
   * Handles instantaneous optical handshake for High-Speed Turbo Stream (10-50 MB/s)
   */
  private async handleTurboPairing(token: TurboPairingToken): Promise<void> {
    if (this.isTurboActive || this.turboReceiver) return;
    this.isTurboActive = true;

    SoundFX.playPacketTick();
    const sizeMB = (token.fs / (1024 * 1024)).toFixed(1);
    Toast.success(`⚡ Turbo Handshake Locked: "${token.fn}" (${sizeMB} MB)`);

    const reticleHint = this.container.querySelector('#reticleHint');
    const badgeSessionStatus = this.container.querySelector('#badgeSessionStatus');
    const receptionStandby = this.container.querySelector('#receptionStandby') as HTMLElement;
    const turboTransferCard = this.container.querySelector('#turboTransferCard') as HTMLElement;
    const turboFileName = this.container.querySelector('#turboFileName');
    const turboEndpointBadge = this.container.querySelector('#turboEndpointBadge');

    if (reticleHint) reticleHint.textContent = `⚡ Turbo Stream: ${token.fn} (${sizeMB} MB)`;
    if (badgeSessionStatus) {
      badgeSessionStatus.textContent = '⚡ TURBO ACTIVE';
      badgeSessionStatus.className = 'badge-pill bg-[#34D399] text-[#1E293B] text-[10px] animate-pulse font-black';
    }

    if (receptionStandby) receptionStandby.classList.add('hidden');
    if (turboTransferCard) turboTransferCard.classList.remove('hidden');
    if (turboFileName) turboFileName.textContent = token.fn;
    if (turboEndpointBadge && token.endpoints && token.endpoints.length > 0) {
      turboEndpointBadge.textContent = token.endpoints[0].replace(/^https?:\/\//, '');
    }

    this.turboReceiver = new TurboReceiverController((prog: TurboReceiverProgress) => {
      this.renderTurboProgress(prog);
    });

    try {
      const result = await this.turboReceiver.start(token);

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
      });
      SoundFX.playSuccessFanfare();

      this.completedFile = {
        metadata: {
          name: result.name,
          type: result.type,
          sha256: result.sha256,
          originalSize: result.size,
          compressed: false,
        },
        bytes: result.bytes,
      };

      if (badgeSessionStatus) {
        badgeSessionStatus.textContent = `⚡ TURBO VERIFIED (${result.averageSpeedMBps.toFixed(1)} MB/s)`;
        badgeSessionStatus.className = 'badge-pill bg-[#8B5CF6] text-white text-[10px] font-black';
      }

      this.displayCompletedFile();
      Toast.success(`⚡ Transfer verified at ${result.averageSpeedMBps.toFixed(1)} MB/s!`);
    } catch (err: any) {
      if (this.turboReceiver?.getState() === 'ABORTED') return;
      SoundFX.playError();
      Alert.warning('Turbo Stream Error', `Failed to receive payload: ${err.message}`);
      this.resetTransfer();
    }
  }

  private renderTurboProgress(prog: TurboReceiverProgress): void {
    const hudSpeed = this.container.querySelector('#hudSpeed');
    const hudBlocks = this.container.querySelector('#hudBlocks');
    const hudPercent = this.container.querySelector('#hudPercent');
    const hudFrames = this.container.querySelector('#hudFrames');
    const hudProgressBar = this.container.querySelector('#hudProgressBar') as HTMLElement;
    const hudProgressText = this.container.querySelector('#hudProgressText');

    const turboTransferBytes = this.container.querySelector('#turboTransferBytes');
    const turboSpeedometer = this.container.querySelector('#turboSpeedometer');
    const turboProgressBar = this.container.querySelector('#turboProgressBar') as HTMLElement;
    const turboStatusHint = this.container.querySelector('#turboStatusHint');

    const receivedMB = (prog.receivedBytes / (1024 * 1024)).toFixed(1);
    const totalMB = (prog.totalBytes / (1024 * 1024)).toFixed(1);

    if (hudSpeed) hudSpeed.textContent = `${prog.speedMBps.toFixed(1)} MB/s`;
    if (hudBlocks) hudBlocks.textContent = `${prog.currentChunk} / ${prog.totalChunks}`;
    if (hudPercent) hudPercent.textContent = `${prog.percent}%`;
    if (hudFrames) hudFrames.textContent = `${prog.currentChunk}`;
    if (hudProgressBar) hudProgressBar.style.width = `${prog.percent}%`;
    if (hudProgressText) {
      if (prog.state === 'CONNECTING') {
        hudProgressText.textContent = 'Connecting to local high-speed pipeline...';
      } else if (prog.state === 'VERIFYING') {
        hudProgressText.textContent = 'Verifying SHA-256 cryptographic checksum...';
      } else {
        hudProgressText.textContent = `Turbo stream: ${receivedMB} MB of ${totalMB} MB (${prog.percent}%)`;
      }
    }

    if (turboTransferBytes) turboTransferBytes.textContent = `${receivedMB} MB / ${totalMB} MB`;
    if (turboSpeedometer) turboSpeedometer.textContent = `${prog.speedMBps.toFixed(1)} MB/s`;
    if (turboProgressBar) turboProgressBar.style.width = `${prog.percent}%`;
    if (turboStatusHint) {
      if (prog.state === 'CONNECTING') {
        turboStatusHint.textContent = `Connecting to ${prog.endpoint}...`;
      } else if (prog.state === 'VERIFYING') {
        turboStatusHint.textContent = 'Verifying AES-256-GCM integrity & SHA-256 hash...';
      } else if (prog.state === 'COMPLETED') {
        turboStatusHint.textContent = 'All chunks decrypted and cryptographically verified!';
      } else {
        turboStatusHint.textContent = `Direct stream active (${prog.endpoint})`;
      }
    }
  }

  private async onStreamCompleted(): Promise<void> {
    if (!this.decoder) return;

    try {
      const reconstructedBytes = this.decoder.reconstruct();

      // Confetti burst!
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });

      // Play joyful fanfare chord
      SoundFX.playSuccessFanfare();

      const badgeSessionStatus = this.container.querySelector('#badgeSessionStatus');
      if (badgeSessionStatus) {
        badgeSessionStatus.textContent = 'STREAM COMPLETE';
        badgeSessionStatus.className = 'badge-pill bg-[#8B5CF6] text-white text-[10px]';
      }

      if (this.isEncryptedSession) {
        // Show Decrypt Passphrase Prompt
        (this.container.querySelector('#receptionStandby') as HTMLElement).classList.add('hidden');
        (this.container.querySelector('#decryptPrompt') as HTMLElement).classList.remove('hidden');

        this.completedFile = {
          metadata: {
            name: 'Encrypted Stream',
            type: 'application/octet-stream',
            sha256: '',
            originalSize: reconstructedBytes.length,
            compressed: false,
          },
          bytes: reconstructedBytes,
          rawCiphertext: reconstructedBytes,
        };

        Toast.show('Fountain stream captured! Enter passphrase to decrypt.', 'info');

        // Automatically prompt with SweetAlert2 for convenience
        const pass = await Alert.promptPassphrase();
        if (pass) {
          const passInput = this.container.querySelector('#rxPassphrase') as HTMLInputElement;
          if (passInput) passInput.value = pass;
          await this.attemptDecryption();
        }
      } else {
        // Unpack container directly
        const { metadata, fileBytes } = await unpackContainer(reconstructedBytes);
        this.completedFile = { metadata, bytes: fileBytes };
        this.displayCompletedFile();
        Toast.success('Fountain stream verified and reconstructed!');
      }
    } catch (err: any) {
      SoundFX.playError();
      Alert.warning('Reconstruction Error', `Failed to unpack stream: ${err.message}`);
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
      // Decrypt container with AES-256-GCM + PBKDF2
      const decryptedContainerBytes = await SpectraCrypto.decrypt(this.completedFile.rawCiphertext, rxPassphrase);
      const { metadata, fileBytes } = await unpackContainer(decryptedContainerBytes);

      this.completedFile = { metadata, bytes: fileBytes };
      (this.container.querySelector('#decryptPrompt') as HTMLElement).classList.add('hidden');
      this.displayCompletedFile();

      SoundFX.playSuccessFanfare();
      Toast.success('Decryption and SHA-256 integrity verification successful!');
    } catch (err: any) {
      SoundFX.playError();
      Alert.warning('Decryption Failed', 'Incorrect passphrase or corrupted optical payload.');
    }
  }

  private displayCompletedFile(): void {
    if (!this.completedFile) return;

    (this.container.querySelector('#receptionStandby') as HTMLElement).classList.add('hidden');
    (this.container.querySelector('#decryptPrompt') as HTMLElement).classList.add('hidden');
    const turboTransferCard = this.container.querySelector('#turboTransferCard') as HTMLElement;
    if (turboTransferCard) turboTransferCard.classList.add('hidden');

    const resultViewer = this.container.querySelector('#resultViewer') as HTMLElement;
    resultViewer.classList.remove('hidden');

    const meta = this.completedFile.metadata;
    const sizeText = this.completedFile.bytes.length >= 1024 * 1024
      ? `${(this.completedFile.bytes.length / (1024 * 1024)).toFixed(2)} MB`
      : `${(this.completedFile.bytes.length / 1024).toFixed(1)} KB`;

    (this.container.querySelector('#resFileName') as HTMLElement).textContent = meta.name;
    (this.container.querySelector('#resFileSize') as HTMLElement).textContent = sizeText;
    (this.container.querySelector('#resFileSha') as HTMLElement).textContent = `SHA: ${meta.sha256.substring(0, 10)}...`;

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
      previewContainer.innerHTML = `<img src="${this.activeBlobUrl}" class="max-h-48 rounded-xl object-contain border border-[#CBD5E1]" alt="Received image" />`;
    } else if (meta.type.startsWith('video/')) {
      previewContainer.innerHTML = `<video src="${this.activeBlobUrl}" controls class="max-h-48 rounded-xl object-contain w-full"></video>`;
    } else if (meta.type.startsWith('audio/')) {
      previewContainer.innerHTML = `<audio src="${this.activeBlobUrl}" controls class="w-full my-2"></audio>`;
    } else if (meta.type.startsWith('text/') || meta.name.endsWith('.txt') || meta.name.endsWith('.json') || meta.name.endsWith('.md')) {
      const text = new TextDecoder().decode(this.completedFile.bytes.subarray(0, 2048));
      previewContainer.innerHTML = `<pre class="p-3 bg-white border border-[#CBD5E1] rounded-xl text-xs font-mono text-[#1E293B] overflow-x-auto max-h-40 w-full select-all">${text}</pre>`;
    }
  }

  private burnPayload(): void {
    if (this.activeBlobUrl) {
      URL.revokeObjectURL(this.activeBlobUrl);
      this.activeBlobUrl = null;
    }

    if (this.turboReceiver) {
      this.turboReceiver.burn();
      this.turboReceiver = null;
    }
    this.isTurboActive = false;

    if (this.completedFile) {
      this.completedFile.bytes.fill(0); // Zero out buffer in RAM
      if (this.completedFile.rawCiphertext) {
        this.completedFile.rawCiphertext.fill(0);
      }
      this.completedFile = null;
    }

    this.resetTransfer();
    Toast.show('RAM zeroed out. All payload traces destroyed.', 'info');
  }

  private resetTransfer(): void {
    if (this.turboReceiver) {
      this.turboReceiver.abort();
      this.turboReceiver = null;
    }
    this.isTurboActive = false;

    this.activeSessionId = null;
    this.decoder = null;
    this.completedFile = null;
    this.framesCount = 0;
    this.bytesDecoded = 0;

    const hudSpeed = this.container.querySelector('#hudSpeed');
    const hudBlocks = this.container.querySelector('#hudBlocks');
    const hudPercent = this.container.querySelector('#hudPercent');
    const hudFrames = this.container.querySelector('#hudFrames');
    const hudProgressBar = this.container.querySelector('#hudProgressBar') as HTMLElement;
    const hudProgressText = this.container.querySelector('#hudProgressText');
    const reticleHint = this.container.querySelector('#reticleHint');
    const badgeSessionStatus = this.container.querySelector('#badgeSessionStatus');
    const turboTransferCard = this.container.querySelector('#turboTransferCard') as HTMLElement;

    if (hudSpeed) hudSpeed.textContent = '0.0 KB/s';
    if (hudBlocks) hudBlocks.textContent = '0 / 0';
    if (hudPercent) hudPercent.textContent = '0%';
    if (hudFrames) hudFrames.textContent = '0';
    if (hudProgressBar) hudProgressBar.style.width = '0%';
    if (hudProgressText) hudProgressText.textContent = 'Waiting for transmission...';
    if (reticleHint) reticleHint.textContent = 'Align camera to sending screen QR stream';
    if (badgeSessionStatus) {
      badgeSessionStatus.textContent = 'STANDBY';
      badgeSessionStatus.className = 'badge-pill bg-[#F1F5F9] text-[#1E293B] text-[10px]';
    }

    if (turboTransferCard) turboTransferCard.classList.add('hidden');
    (this.container.querySelector('#resultViewer') as HTMLElement).classList.add('hidden');
    (this.container.querySelector('#decryptPrompt') as HTMLElement).classList.add('hidden');
    (this.container.querySelector('#receptionStandby') as HTMLElement).classList.remove('hidden');
  }

  public destroy(): void {
    this.isScanning = false;
    if (this.turboReceiver) {
      this.turboReceiver.abort();
      this.turboReceiver = null;
    }
    this.isTurboActive = false;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
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
