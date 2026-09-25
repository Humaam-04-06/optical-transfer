/**
 * SpectraBeam - Optical Transmitter (Send Page)
 */

import { FountainEncoder } from '../../core/fountain.ts';
import { packageContainer, packFrame } from '../../core/protocol.ts';
import { SpectraCrypto } from '../../core/crypto.ts';
import { QRGenerator } from '../../core/qr-generator.ts';
import { ChromaBeam } from '../../core/chroma.ts';
import { ProtocolFlags, WireHeader } from '../../core/types.ts';
import { Toast } from '../../ui/toast.ts';
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
  private fileSize = 0;
  private totalK = 0;
  private framesSent = 0;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render(): void {
    this.container.innerHTML = `
      <div class="page-container send-page">
        <div class="page-header">
          <div class="title-group">
            <h2 class="page-title"><span class="title-icon">${Icons.send}</span> Optical Transmitter</h2>
            <p class="page-subtitle">Stream air-gapped data through high-frequency fountain-coded light</p>
          </div>
          <div class="header-badges">
            <span class="status-badge live-badge"><span class="pulse-dot"></span> AIR-GAP ACTIVE</span>
          </div>
        </div>

        <div class="send-layout">
          <!-- Left: Input & Security Controls -->
          <div class="send-sidebar">
            <div class="card glass-panel dropzone-card" id="dropzone">
              <input type="file" id="fileInput" class="file-input-hidden" />
              <div class="dropzone-content" id="dropzoneContent">
                <div class="drop-icon">${Icons.download}</div>
                <h3>Drop files here or <span class="highlight">browse</span></h3>
                <p class="drop-help">Supports any file type up to 64 MB (or paste text below)</p>
              </div>
            </div>

            <div class="card glass-panel text-snippet-card">
              <label for="textSnippet" class="field-label">Or Transmit Text Snippet</label>
              <textarea id="textSnippet" class="cyber-textarea" placeholder="Paste secret keys, seed phrases, notes, or code..." rows="3"></textarea>
              <button id="btnTextStream" class="btn btn-secondary btn-full">
                ${Icons.zap} Load Snippet into Stream
              </button>
            </div>

            <!-- SpectraVault Security Drawer -->
            <div class="card glass-panel security-card">
              <div class="card-header-toggle">
                <div class="header-with-icon">
                  <span class="icon-accent">${Icons.shield}</span>
                  <div>
                    <h4 class="card-heading">SpectraVault™ Encryption</h4>
                    <p class="card-subheading">Hardware-accelerated AES-256-GCM zero-knowledge protection</p>
                  </div>
                </div>
                <label class="switch">
                  <input type="checkbox" id="toggleEncrypt" />
                  <span class="slider"></span>
                </label>
              </div>

              <div id="encryptionControls" class="security-options hidden">
                <div class="form-group">
                  <label for="encPassphrase" class="field-label">Encryption Passphrase</label>
                  <div class="input-with-action">
                    <input type="password" id="encPassphrase" class="cyber-input" placeholder="Enter military-grade passphrase" />
                    <button type="button" id="btnTogglePass" class="btn-icon">${Icons.lock}</button>
                  </div>
                </div>
                <div class="security-feature-row">
                  <label class="checkbox-label">
                    <input type="checkbox" id="toggleAntiSurveillance" />
                    <span>Anti-Shoulder-Surfing Polarity Strobe (Visual Noise)</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Turbo & Optics Settings -->
            <div class="card glass-panel settings-card">
              <h4 class="card-heading">${Icons.settings} Optical Transmission Settings</h4>
              <div class="settings-grid">
                <div class="setting-item">
                  <label for="selectFps">Frame Rate</label>
                  <select id="selectFps" class="cyber-select">
                    <option value="30" selected>30 FPS (Standard)</option>
                    <option value="60">60 FPS (Fast Displays)</option>
                    <option value="120">120 FPS (High-Hz Gaming Displays)</option>
                  </select>
                </div>

                <div class="setting-item">
                  <label for="selectBlockSize">Block Size</label>
                  <select id="selectBlockSize" class="cyber-select">
                    <option value="256">256 B (Phones / Small Lenses)</option>
                    <option value="384" selected>384 B (Optimal Balance)</option>
                    <option value="512">512 B (Monitors / 4K Cameras)</option>
                  </select>
                </div>
              </div>

              <div class="chroma-toggle-container">
                <div class="chroma-text">
                  <span class="chroma-tag">TURBO</span>
                  <strong>ChromaBeam™ RGB Multiplexing</strong>
                  <p class="card-subheading">Triple throughput via Red/Green/Blue optical channels (~1.2 MB/s)</p>
                </div>
                <label class="switch">
                  <input type="checkbox" id="toggleChroma" />
                  <span class="slider slider-chroma"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- Right: Optical Viewport (Canvas Screen) -->
          <div class="send-viewport-col">
            <div class="card glass-panel viewport-card">
              <div class="viewport-header">
                <div class="stream-info" id="streamInfo">
                  <span class="stream-title">STANDBY</span>
                  <span class="stream-meta">Load a file or snippet to begin transmission</span>
                </div>
                <div class="viewport-controls">
                  <button id="btnInvert" class="btn btn-sm btn-outline" title="Invert Screen Polarity">
                    ${Icons.refresh} Invert Colors
                  </button>
                  <button id="btnFullscreen" class="btn btn-sm btn-outline" title="Fullscreen Stream">
                    Fullscreen
                  </button>
                </div>
              </div>

              <div class="canvas-wrapper" id="canvasWrapper">
                <canvas id="qrCanvas" width="600" height="600"></canvas>
                <div id="standbyPlaceholder" class="standby-overlay">
                  <div class="standby-icon">${Icons.beam}</div>
                  <h3>Awaiting Data Payload</h3>
                  <p>Choose a file or enter text on the left to start beaming</p>
                </div>
              </div>

              <!-- Stream Telemetry Footer -->
              <div class="stream-telemetry">
                <div class="telemetry-item">
                  <span class="label">Session ID</span>
                  <span class="value" id="valSession">--</span>
                </div>
                <div class="telemetry-item">
                  <span class="label">K Blocks</span>
                  <span class="value" id="valK">--</span>
                </div>
                <div class="telemetry-item">
                  <span class="label">Frames Sent</span>
                  <span class="value" id="valFrames">0</span>
                </div>
                <div class="telemetry-item">
                  <span class="label">Throughput Target</span>
                  <span class="value" id="valTargetSpeed">--</span>
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
    const dropzone = this.container.querySelector('#dropzone') as HTMLElement;
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
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
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
        Toast.warning('Please enter text to transmit');
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
          ? 'ChromaBeam RGB Tri-Stream Mode Enabled (3x throughput)'
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
      btnInvert.classList.toggle('active', this.isInverted);
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
      <div class="spinner-inline"></div>
      <h3>Reading ${file.name}...</h3>
      <p class="drop-help">${(file.size / 1024).toFixed(1)} KB</p>
    `;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      await this.preparePayload(bytes, file.name, file.type || 'application/octet-stream');
      dropzoneContent.innerHTML = `
        <div class="drop-icon highlight">${Icons.check}</div>
        <h3>Loaded: <strong>${file.name}</strong></h3>
        <p class="drop-help">${(file.size / 1024).toFixed(1)} KB - Click to replace</p>
      `;
    } catch (err: any) {
      Toast.error(`Failed to read file: ${err.message}`);
    }
  }

  private async preparePayload(rawBytes: Uint8Array, fileName: string, mimeType: string): Promise<void> {
    this.stopStream();

    let finalPayload = rawBytes;

    // Check encryption
    if (this.isEncrypted) {
      if (!this.passphrase) {
        Toast.warning('Encryption is enabled but passphrase is empty! Set a passphrase.');
        return;
      }
      finalPayload = await SpectraCrypto.encrypt(rawBytes, this.passphrase);
    }

    // Package into container
    const containerBytes = await packageContainer(finalPayload, fileName, mimeType, true);

    this.fileName = fileName;
    this.fileSize = rawBytes.length;
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
    (this.container.querySelector('#valK') as HTMLElement).textContent = `${this.totalK} blocks`;
    (this.container.querySelector('#valTargetSpeed') as HTMLElement).textContent = `${Math.round((this.blockSize * this.targetFps) / 1024 * (this.isChromaRGB ? 3 : 1))} KB/s`;

    const streamInfo = this.container.querySelector('#streamInfo') as HTMLElement;
    streamInfo.innerHTML = `
      <span class="stream-title streaming-pulse">STREAMING ${this.isEncrypted ? '🔐 ENCRYPTED' : ''} ${this.isChromaRGB ? '🌈 RGB' : ''}</span>
      <span class="stream-meta">${fileName} (${(rawBytes.length / 1024).toFixed(1)} KB)</span>
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
