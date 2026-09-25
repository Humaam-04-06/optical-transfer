/**
 * SpectraBeam - Optical Transmitter (Send Page)
 * Playful Geometric Theme Implementation (100% Responsive)
 */

import { FountainEncoder } from '../../core/fountain.ts';
import { packageContainer, packFrame } from '../../core/protocol.ts';
import { SpectraCrypto } from '../../core/crypto.ts';
import { QRGenerator } from '../../core/qr-generator.ts';
import { ChromaBeam } from '../../core/chroma.ts';
import { ProtocolFlags, WireHeader } from '../../core/types.ts';
import { Toast } from '../../ui/toast.ts';
import { Alert } from '../../ui/alert.ts';
import { Icons } from '../../ui/icons.ts';

export class SendPage {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement | null = null;
  private animId: number | null = null;
  private isStreaming = false;

  // Transmission settings
  private targetFps = 30;
  private blockSize = 384;
  private isEncrypted = false;
  private passphrase = '';
  private isChromaRGB = false;
  private isAntiSurveillance = false;
  private isInverted = false;

  // Active encoder state
  private encoder: FountainEncoder | null = null;
  private encoderG: FountainEncoder | null = null;
  private encoderB: FountainEncoder | null = null;
  private sessionId = 0;
  private fileName = '';
  private totalK = 0;
  private framesSent = 0;

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
              <div class="w-10 h-10 rounded-2xl bg-[#8B5CF6] text-white border-2 border-[#1E293B] shadow-pop-sm flex items-center justify-center p-2 flex-shrink-0">
                ${Icons.send}
              </div>
              <h2 class="font-heading font-black text-2xl sm:text-3xl text-[#1E293B]">Optical Transmitter</h2>
            </div>
            <p class="font-body text-sm sm:text-base text-[#64748B] pl-0 sm:pl-13">
              Stream air-gapped data through high-frequency fountain-coded light
            </p>
          </div>

          <div class="flex items-center gap-2 self-start sm:self-auto">
            <span class="badge-pill bg-[#34D399] text-[#1E293B]">
              <span class="w-2 h-2 rounded-full bg-[#1E293B] animate-pulse"></span>
              <span>AIR-GAP ACTIVE</span>
            </span>
          </div>
        </div>

        <!-- 100% Responsive Grid: 5 cols input, 7 cols viewport on desktop, stacked on mobile -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          <!-- ==========================================
               LEFT COLUMN: Upload, Snippet & Controls
               ========================================== -->
          <div class="lg:col-span-5 space-y-6 w-full">
            
            <!-- File Dropzone Sticker Card -->
            <div class="card-sticker group hover:border-[#8B5CF6] transition-all" id="dropzoneCard">
              <input type="file" id="fileInput" class="hidden" />
              <div class="border-2 border-dashed border-[#CBD5E1] group-hover:border-[#8B5CF6] rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors bg-[#FFFDF5] group-hover:bg-[#F5F3FF]" id="dropzoneContent">
                <div class="w-14 h-14 rounded-full bg-[#FBBF24] border-2 border-[#1E293B] shadow-pop-sm flex items-center justify-center mx-auto mb-3.5 group-hover:scale-110 group-hover:-rotate-6 transition-transform">
                  ${Icons.download}
                </div>
                <h3 class="font-heading font-black text-lg text-[#1E293B] mb-1">
                  Drop files here or <span class="text-[#8B5CF6] underline decoration-2">browse</span>
                </h3>
                <p class="font-body text-xs text-[#64748B]">
                  Documents, images, zip, audio or video up to 64 MB
                </p>
              </div>
            </div>

            <!-- Text Snippet Sticker Card -->
            <div class="card-sticker space-y-3">
              <div class="flex items-center justify-between">
                <label for="textSnippet" class="font-heading font-extrabold text-sm text-[#1E293B] uppercase tracking-wide">
                  Or Transmit Text Snippet
                </label>
                <span class="text-[11px] font-mono text-[#94A3B8]">RAW TEXT</span>
              </div>
              <textarea id="textSnippet" class="input-geometric resize-none h-24 text-sm font-mono placeholder:font-sans" placeholder="Paste secret keys, notes, password hashes, or code..."></textarea>
              <button id="btnTextStream" class="btn-candy btn-candy-secondary btn-full">
                ${Icons.zap} Load Snippet into Stream
              </button>
            </div>

            <!-- SpectraVault Encryption Card -->
            <div class="card-sticker card-sticker-yellow space-y-4">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[#FBBF24] border-2 border-[#1E293B] shadow-pop-sm flex items-center justify-center flex-shrink-0">
                    ${Icons.shield}
                  </div>
                  <div>
                    <h4 class="font-heading font-black text-base text-[#1E293B]">SpectraVault™ Encryption</h4>
                    <p class="font-body text-xs text-[#64748B]">AES-256-GCM zero-knowledge protection</p>
                  </div>
                </div>

                <!-- Playful Toggle Switch -->
                <label class="switch">
                  <input type="checkbox" id="toggleEncrypt" />
                  <span class="slider"></span>
                </label>
              </div>

              <!-- Collapsible Passphrase Area -->
              <div id="encryptionControls" class="hidden space-y-3 pt-2 border-t-2 border-[#1E293B]">
                <div>
                  <label for="encPassphrase" class="block font-heading font-bold text-xs text-[#1E293B] uppercase mb-1">
                    Passphrase
                  </label>
                  <div class="relative">
                    <input type="password" id="encPassphrase" class="input-geometric pr-10 text-sm" placeholder="Enter secure passphrase" />
                    <button type="button" id="btnTogglePass" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B]">
                      ${Icons.lock}
                    </button>
                  </div>
                </div>

                <label class="flex items-start gap-2.5 cursor-pointer select-none text-xs font-body text-[#1E293B] pt-1">
                  <input type="checkbox" id="toggleAntiSurveillance" class="mt-0.5 rounded border-2 border-[#1E293B]" />
                  <span>Anti-Shoulder-Surfing Polarity Strobe (Visual Noise Filter)</span>
                </label>
              </div>
            </div>

            <!-- Transmission Settings Card -->
            <div class="card-sticker space-y-4">
              <div class="flex items-center gap-2 border-b-2 border-[#1E293B] pb-2.5">
                <span class="text-[#8B5CF6]">${Icons.settings}</span>
                <h4 class="font-heading font-black text-base text-[#1E293B]">Optics & Speed Settings</h4>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="selectFps" class="block font-heading font-bold text-xs text-[#64748B] uppercase mb-1">Frame Rate</label>
                  <select id="selectFps" class="input-geometric font-heading font-bold text-sm bg-white cursor-pointer">
                    <option value="30" selected>30 FPS (Standard)</option>
                    <option value="60">60 FPS (Fast Displays)</option>
                    <option value="120">120 FPS (High-Hz Gaming)</option>
                  </select>
                </div>

                <div>
                  <label for="selectBlockSize" class="block font-heading font-bold text-xs text-[#64748B] uppercase mb-1">Block Size</label>
                  <select id="selectBlockSize" class="input-geometric font-heading font-bold text-sm bg-white cursor-pointer">
                    <option value="256">256 B (Phones)</option>
                    <option value="384" selected>384 B (Balanced)</option>
                    <option value="512">512 B (Monitors / 4K)</option>
                  </select>
                </div>
              </div>

              <!-- ChromaBeam RGB Turbo Toggle -->
              <div class="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border-2 border-[#1E293B]">
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="badge-pill bg-[#F472B6] text-white text-[9px] py-0.5 px-1.5">TURBO</span>
                    <strong class="font-heading font-black text-sm text-[#1E293B]">ChromaBeam™ RGB</strong>
                  </div>
                  <p class="font-body text-xs text-[#64748B] mt-0.5">3-Channel color multiplexing (~1.2 MB/s)</p>
                </div>
                <label class="switch">
                  <input type="checkbox" id="toggleChroma" />
                  <span class="slider slider-chroma"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- ==========================================
               RIGHT COLUMN: Optical Viewport Canvas
               ========================================== -->
          <div class="lg:col-span-7 space-y-6 w-full">
            <div class="card-sticker shadow-pop-xl bg-white p-4 sm:p-6 space-y-4">
              
              <!-- Viewport Window Top Header -->
              <div class="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1E293B] pb-3">
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1.5">
                    <span class="w-3 h-3 rounded-full bg-[#F472B6] border-2 border-[#1E293B]"></span>
                    <span class="w-3 h-3 rounded-full bg-[#FBBF24] border-2 border-[#1E293B]"></span>
                    <span class="w-3 h-3 rounded-full bg-[#34D399] border-2 border-[#1E293B]"></span>
                  </div>
                  <div class="ml-2 font-heading font-black text-sm text-[#1E293B]" id="streamInfo">
                    <span class="inline-block bg-[#F1F5F9] px-2.5 py-0.5 rounded-full border border-[#CBD5E1] text-xs">
                      STANDBY
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button id="btnInvert" class="btn-candy btn-candy-secondary btn-candy-sm text-xs" title="Invert Screen Polarity">
                    ${Icons.refresh} Invert
                  </button>
                  <button id="btnFullscreen" class="btn-candy btn-candy-secondary btn-candy-sm text-xs" title="Fullscreen Stream">
                    Fullscreen
                  </button>
                </div>
              </div>

              <!-- High-FPS Canvas Frame (100% Responsive) -->
              <div class="relative w-full max-w-[480px] aspect-square mx-auto bg-black rounded-2xl border-2 border-[#1E293B] shadow-pop overflow-hidden flex items-center justify-center" id="canvasWrapper">
                <canvas id="qrCanvas" width="600" height="600" class="w-full h-full object-contain image-rendering-pixelated"></canvas>
                
                <!-- Awaiting Data Standby Overlay -->
                <div id="standbyPlaceholder" class="absolute inset-0 bg-[#FFFDF5] bg-dot-grid flex flex-col items-center justify-center p-6 text-center z-10">
                  <div class="w-20 h-20 rounded-3xl bg-[#FBBF24] border-2 border-[#1E293B] shadow-pop flex items-center justify-center text-[#1E293B] mb-4 animate-bounce">
                    ${Icons.beam}
                  </div>
                  <h3 class="font-heading font-black text-xl text-[#1E293B] mb-1">Awaiting Data Payload</h3>
                  <p class="font-body text-xs sm:text-sm text-[#64748B] max-w-xs">
                    Drop a file or enter text on the left to start beaming fountain-coded light
                  </p>
                </div>
              </div>

              <!-- Live Stream Telemetry Grid (2 cols on phone, 4 on desktop) -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div class="bg-[#F8FAFC] border-2 border-[#1E293B] rounded-xl p-2.5 text-center shadow-pop-sm">
                  <span class="block text-[10px] font-heading font-bold text-[#64748B] uppercase">Session ID</span>
                  <span class="font-mono font-bold text-xs sm:text-sm text-[#1E293B]" id="valSession">--</span>
                </div>

                <div class="bg-[#F8FAFC] border-2 border-[#1E293B] rounded-xl p-2.5 text-center shadow-pop-sm">
                  <span class="block text-[10px] font-heading font-bold text-[#64748B] uppercase">K Blocks</span>
                  <span class="font-mono font-bold text-xs sm:text-sm text-[#1E293B]" id="valK">--</span>
                </div>

                <div class="bg-[#F8FAFC] border-2 border-[#1E293B] rounded-xl p-2.5 text-center shadow-pop-sm">
                  <span class="block text-[10px] font-heading font-bold text-[#64748B] uppercase">Frames Sent</span>
                  <span class="font-mono font-bold text-xs sm:text-sm text-[#8B5CF6]" id="valFrames">0</span>
                </div>

                <div class="bg-[#F8FAFC] border-2 border-[#1E293B] rounded-xl p-2.5 text-center shadow-pop-sm">
                  <span class="block text-[10px] font-heading font-bold text-[#64748B] uppercase">Target Speed</span>
                  <span class="font-mono font-bold text-xs sm:text-sm text-[#059669]" id="valTargetSpeed">--</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const dropzoneCard = this.container.querySelector('#dropzoneCard') as HTMLElement;
    const fileInput = this.container.querySelector('#fileInput') as HTMLInputElement;
    const btnTextStream = this.container.querySelector('#btnTextStream') as HTMLButtonElement;
    const textSnippet = this.container.querySelector('#textSnippet') as HTMLTextAreaElement;
    const toggleEncrypt = this.container.querySelector('#toggleEncrypt') as HTMLInputElement;
    const encryptionControls = this.container.querySelector('#encryptionControls') as HTMLElement;
    const encPassphrase = this.container.querySelector('#encPassphrase') as HTMLInputElement;
    const btnTogglePass = this.container.querySelector('#btnTogglePass') as HTMLButtonElement;
    const toggleAntiSurveillance = this.container.querySelector('#toggleAntiSurveillance') as HTMLInputElement;
    const toggleChroma = this.container.querySelector('#toggleChroma') as HTMLInputElement;
    const selectFps = this.container.querySelector('#selectFps') as HTMLSelectElement;
    const selectBlockSize = this.container.querySelector('#selectBlockSize') as HTMLSelectElement;
    const btnInvert = this.container.querySelector('#btnInvert') as HTMLButtonElement;
    const btnFullscreen = this.container.querySelector('#btnFullscreen') as HTMLButtonElement;
    this.canvas = this.container.querySelector('#qrCanvas') as HTMLCanvasElement;

    // Dropzone interactions
    dropzoneCard.addEventListener('click', () => fileInput.click());
    dropzoneCard.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzoneCard.classList.add('border-[#8B5CF6]', 'bg-[#F5F3FF]');
    });
    dropzoneCard.addEventListener('dragleave', () => {
      dropzoneCard.classList.remove('border-[#8B5CF6]', 'bg-[#F5F3FF]');
    });
    dropzoneCard.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzoneCard.classList.remove('border-[#8B5CF6]', 'bg-[#F5F3FF]');
      if (e.dataTransfer?.files.length) {
        this.processFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) {
        this.processFile(fileInput.files[0]);
      }
    });

    // Snippet transmission
    btnTextStream.addEventListener('click', () => {
      const text = textSnippet.value.trim();
      if (!text) {
        Alert.warning('Empty Snippet', 'Please enter some text, code, or secret notes to transmit.');
        return;
      }
      const bytes = new TextEncoder().encode(text);
      this.preparePayload(bytes, 'snippet.txt', 'text/plain');
    });

    // Encryption toggle
    toggleEncrypt.addEventListener('change', () => {
      this.isEncrypted = toggleEncrypt.checked;
      encryptionControls.classList.toggle('hidden', !this.isEncrypted);
    });

    btnTogglePass.addEventListener('click', () => {
      encPassphrase.type = encPassphrase.type === 'password' ? 'text' : 'password';
    });

    encPassphrase.addEventListener('input', () => {
      this.passphrase = encPassphrase.value;
    });

    toggleAntiSurveillance.addEventListener('change', () => {
      this.isAntiSurveillance = toggleAntiSurveillance.checked;
    });

    toggleChroma.addEventListener('change', () => {
      this.isChromaRGB = toggleChroma.checked;
      Toast.show(
        this.isChromaRGB
          ? 'ChromaBeam™ RGB Tri-Stream Mode Activated (3x throughput)'
          : 'Standard Monochrome Mode Active',
        'info'
      );
    });

    selectFps.addEventListener('change', () => {
      this.targetFps = parseInt(selectFps.value, 10);
    });

    selectBlockSize.addEventListener('change', () => {
      this.blockSize = parseInt(selectBlockSize.value, 10);
    });

    btnInvert.addEventListener('click', () => {
      this.isInverted = !this.isInverted;
      btnInvert.classList.toggle('btn-candy-pink', this.isInverted);
    });

    btnFullscreen.addEventListener('click', () => {
      const wrapper = this.container.querySelector('#canvasWrapper') as HTMLElement;
      if (!document.fullscreenElement) {
        wrapper.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  private async processFile(file: File): Promise<void> {
    const dropzoneContent = this.container.querySelector('#dropzoneContent') as HTMLElement;
    dropzoneContent.innerHTML = `
      <div class="w-12 h-12 rounded-full border-4 border-[#8B5CF6] border-t-transparent animate-spin mx-auto mb-3"></div>
      <h3 class="font-heading font-black text-base text-[#1E293B]">Reading ${file.name}...</h3>
      <p class="font-body text-xs text-[#64748B]">${(file.size / 1024).toFixed(1)} KB</p>
    `;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      await this.preparePayload(bytes, file.name, file.type || 'application/octet-stream');
      dropzoneContent.innerHTML = `
        <div class="w-12 h-12 rounded-full bg-[#34D399] border-2 border-[#1E293B] shadow-pop-sm flex items-center justify-center mx-auto mb-3">
          ${Icons.check}
        </div>
        <h3 class="font-heading font-black text-base text-[#1E293B]">Loaded: <strong>${file.name}</strong></h3>
        <p class="font-body text-xs text-[#64748B]">${(file.size / 1024).toFixed(1)} KB • Click to replace</p>
      `;
    } catch (err: any) {
      Alert.warning('File Read Error', `Failed to read file: ${err.message}`);
    }
  }

  private async preparePayload(rawBytes: Uint8Array, fileName: string, mimeType: string): Promise<void> {
    this.stopStream();

    let finalPayload = rawBytes;

    // Check encryption
    if (this.isEncrypted) {
      if (!this.passphrase) {
        Alert.warning('Passphrase Required', 'SpectraVault encryption is toggled ON but the passphrase field is empty! Please enter a passphrase.');
        return;
      }
      finalPayload = await SpectraCrypto.encrypt(rawBytes, this.passphrase);
    }

    // Package into container
    const containerBytes = await packageContainer(finalPayload, fileName, mimeType, true);

    this.fileName = fileName;
    this.sessionId = Math.floor(Math.random() * 65535);

    // Initialize fountain encoder(s)
    this.encoder = new FountainEncoder(containerBytes, this.blockSize);
    this.totalK = this.encoder.K;

    if (this.isChromaRGB) {
      this.encoderG = new FountainEncoder(containerBytes, this.blockSize);
      this.encoderB = new FountainEncoder(containerBytes, this.blockSize);
      this.encoderG.reset(1000);
      this.encoderB.reset(2000);
    } else {
      this.encoderG = null;
      this.encoderB = null;
    }

    // Update UI telemetry
    (this.container.querySelector('#valSession') as HTMLElement).textContent = `0x${this.sessionId.toString(16).toUpperCase()}`;
    (this.container.querySelector('#valK') as HTMLElement).textContent = `${this.totalK}`;
    (this.container.querySelector('#valTargetSpeed') as HTMLElement).textContent = `${Math.round((this.blockSize * this.targetFps) / 1024 * (this.isChromaRGB ? 3 : 1))} KB/s`;

    const streamInfo = this.container.querySelector('#streamInfo') as HTMLElement;
    streamInfo.innerHTML = `
      <div class="flex items-center gap-1.5">
        <span class="inline-block bg-[#34D399] text-[#1E293B] px-2.5 py-0.5 rounded-full border border-[#1E293B] text-xs font-heading font-black">
          STREAMING ${this.isEncrypted ? '🔐' : ''} ${this.isChromaRGB ? '🌈' : ''}
        </span>
        <span class="text-xs text-[#64748B] font-mono">${fileName} (${(rawBytes.length / 1024).toFixed(1)} KB)</span>
      </div>
    `;

    // Hide placeholder
    (this.container.querySelector('#standbyPlaceholder') as HTMLElement).style.display = 'none';

    Toast.success(`Transmitting "${fileName}" via optical fountain stream`);
    this.startStream();
  }

  private startStream(): void {
    if (!this.canvas || !this.encoder) return;
    this.isStreaming = true;
    this.framesSent = 0;

    let lastFrameTime = performance.now();
    const frameInterval = 1000 / this.targetFps;

    const loop = (currentTime: number) => {
      if (!this.isStreaming || !this.encoder || !this.canvas) return;

      const delta = currentTime - lastFrameTime;
      if (delta >= frameInterval) {
        lastFrameTime = currentTime - (delta % frameInterval);

        if (this.isChromaRGB && this.encoderG && this.encoderB) {
          // ChromaBeam 3-Channel RGB Mode
          const pktR = this.encoder.nextPacket();
          const pktG = this.encoderG.nextPacket();
          const pktB = this.encoderB.nextPacket();

          const headerR: WireHeader = {
            magic0: 0xD1, magic1: 0xC4, version: 4,
            flags: (this.isEncrypted ? ProtocolFlags.ENCRYPTED : 0) | ProtocolFlags.CHROMA_RGB,
            sessionId: this.sessionId, sequenceNumber: pktR.seq, k: this.totalK,
            blockLength: this.blockSize, totalLength: this.encoder.totalLength,
            payloadFnv: 0, securityTag: 0
          };

          const frameR = packFrame(headerR, pktR.data);
          const frameG = packFrame({ ...headerR, sequenceNumber: pktG.seq }, pktG.data);
          const frameB = packFrame({ ...headerR, sequenceNumber: pktB.seq }, pktB.data);

          const matR = QRGenerator.generateMatrix(frameR);
          const matG = QRGenerator.generateMatrix(frameG);
          const matB = QRGenerator.generateMatrix(frameB);

          ChromaBeam.renderRGBFrame(matR, matG, matB, this.canvas);
          this.framesSent += 3;
        } else {
          // Standard Single-Channel Monochrome Mode
          const pkt = this.encoder.nextPacket();
          const header: WireHeader = {
            magic0: 0xD1, magic1: 0xC4, version: 4,
            flags: this.isEncrypted ? ProtocolFlags.ENCRYPTED : 0,
            sessionId: this.sessionId, sequenceNumber: pkt.seq, k: this.totalK,
            blockLength: this.blockSize, totalLength: this.encoder.totalLength,
            payloadFnv: 0, securityTag: 0
          };

          const frameBytes = packFrame(header, pkt.data);
          const matrix = QRGenerator.generateMatrix(frameBytes);

          QRGenerator.renderToCanvas(matrix, this.canvas, this.isInverted, this.isAntiSurveillance);
          this.framesSent++;
        }

        const framesEl = this.container.querySelector('#valFrames');
        if (framesEl) framesEl.textContent = `${this.framesSent}`;
      }

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  public stopStream(): void {
    this.isStreaming = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  public destroy(): void {
    this.stopStream();
  }
}
