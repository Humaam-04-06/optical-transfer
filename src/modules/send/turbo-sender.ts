/**
 * SpectraBeam - High-Speed Turbo Sender Controller
 * 
 * Handles ephemeral AES-256-GCM encryption of local file chunks,
 * registers local offline streaming endpoints, renders the high-contrast
 * optical pairing QR code, and tracks real-time transfer throughput.
 */

import QRCode from 'qrcode';
import {
  createTurboSession,
  encryptTurboChunk,
  TurboSession,
  TurboPairingToken,
} from '../../core/turbo-protocol.ts';

export type TurboSenderState =
  | 'IDLE'
  | 'PREPARING'
  | 'READY_PAIRING'
  | 'TRANSFERRING'
  | 'COMPLETED'
  | 'ERROR';

export interface TurboSenderProgress {
  state: TurboSenderState;
  percent: number;
  sentBytes: number;
  totalBytes: number;
  speedMBps: number;
  activeReceiver?: string;
  errorMessage?: string;
}

export class TurboSenderController {
  private session: TurboSession | null = null;
  private state: TurboSenderState = 'IDLE';
  private progressCallback: ((prog: TurboSenderProgress) => void) | null = null;
  private pollInterval: any = null;
  private startTime = 0;
  private lastTransferredBytes = 0;
  private lastSpeedSampleTime = 0;
  private currentSpeedMBps = 0;

  constructor(onProgress?: (prog: TurboSenderProgress) => void) {
    if (onProgress) this.progressCallback = onProgress;
  }

  public getState(): TurboSenderState {
    return this.state;
  }

  public getSession(): TurboSession | null {
    return this.session;
  }

  /**
   * Discovers local IPv4 network endpoints for direct mobile communication
   */
  public async discoverLocalEndpoints(): Promise<string[]> {
    const endpoints: string[] = [];
    try {
      const res = await fetch('/api/turbo/ips', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const port = data.port || 5173;
        for (const ip of data.ips || []) {
          endpoints.push(`http://${ip}:${port}`);
        }
      }
    } catch {
      // Fallback to current browser origin if discovery endpoint is unreachable
    }

    if (endpoints.length === 0 && window.location.origin.startsWith('http')) {
      endpoints.push(window.location.origin);
    }
    return endpoints;
  }

  /**
   * Prepares and encrypts a file for High-Speed Turbo Streaming
   */
  public async prepareFile(file: { name: string; type: string; data: Uint8Array }): Promise<TurboSession> {
    this.updateState('PREPARING', 0, 0, file.data.byteLength);

    try {
      const endpoints = await this.discoverLocalEndpoints();
      const session = await createTurboSession(file, endpoints);
      this.session = session;

      // Encrypt all chunk slices with ephemeral AES-256-GCM key
      const encryptedChunksBase64: string[] = [];
      const total = session.chunks.length;

      for (let i = 0; i < total; i++) {
        const chunk = session.chunks[i];
        const encrypted = await encryptTurboChunk(chunk, session.cryptoKey, i);
        
        // Convert to base64 for transmission registration
        let binary = '';
        for (let b = 0; b < encrypted.byteLength; b++) {
          binary += String.fromCharCode(encrypted[b]);
        }
        encryptedChunksBase64.push(btoa(binary));

        const percent = Math.round(((i + 1) / total) * 100);
        this.updateState('PREPARING', percent, (i + 1) * session.token.cs, session.token.fs);
      }

      // Register session with the local offline server
      const regRes = await fetch('/api/turbo/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sid: session.token.sid,
          token: session.token,
          chunksBase64: encryptedChunksBase64,
        }),
      });

      if (!regRes.ok) {
        throw new Error(`Failed to register turbo session with local server (HTTP ${regRes.status})`);
      }

      this.updateState('READY_PAIRING', 0, 0, session.token.fs);
      this.startMonitoring();
      return session;
    } catch (err: any) {
      this.updateState('ERROR', 0, 0, file.data.byteLength, err.message);
      throw err;
    }
  }

  /**
   * Renders the Optical Handshake Pairing QR onto the destination canvas
   */
  public async renderPairingQr(canvas: HTMLCanvasElement): Promise<void> {
    if (!this.session) {
      throw new Error('No active turbo session to render');
    }

    const payload = this.session.qrPayload;
    await QRCode.toCanvas(canvas, payload, {
      errorCorrectionLevel: 'L',
      margin: 2,
      scale: 8,
      color: {
        dark: '#1E293B',
        light: '#FFFFFF',
      },
    });
  }

  /**
   * Monitors active receiver download progress via local server metadata
   */
  private startMonitoring(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.lastSpeedSampleTime = performance.now();
    this.lastTransferredBytes = 0;

    this.pollInterval = setInterval(async () => {
      if (!this.session) return;
      try {
        const res = await fetch(`/api/turbo/meta/${this.session.token.sid}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          // Active session pinged by mobile receiver
          if (this.state === 'READY_PAIRING') {
            this.startTime = performance.now();
            this.updateState('TRANSFERRING', 5, 0, this.session.token.fs);
          }
        }
      } catch {
        // Local polling error
      }
    }, 1000);
  }

  private updateState(
    state: TurboSenderState,
    percent: number,
    sentBytes: number,
    totalBytes: number,
    errorMessage?: string
  ): void {
    this.state = state;
    if (this.progressCallback) {
      this.progressCallback({
        state,
        percent,
        sentBytes,
        totalBytes,
        speedMBps: this.currentSpeedMBps,
        errorMessage,
      });
    }
  }

  public destroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.session = null;
    this.state = 'IDLE';
  }
}
