/**
 * SpectraBeam - High-Speed Turbo Receiver Controller
 * 
 * Handles instantaneous optical QR handshake ingestion, candidate endpoint
 * connection racing, parallel encrypted chunk pipeline ingestion, on-the-fly
 * AES-256-GCM hardware decryption, and SHA-256 cryptographic reassembly.
 */

import {
  type TurboPairingToken,
  fromBase64Url,
  importTurboKey,
  decryptTurboChunk,
  computeSHA256,
} from '../../core/turbo-protocol.ts';

export type TurboReceiverState =
  | 'IDLE'
  | 'CONNECTING'
  | 'TRANSFERRING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'ERROR'
  | 'ABORTED';

export interface TurboReceiverProgress {
  state: TurboReceiverState;
  percent: number;
  receivedBytes: number;
  totalBytes: number;
  speedMBps: number;
  currentChunk: number;
  totalChunks: number;
  endpoint: string;
  fileName: string;
  fileType: string;
  errorMessage?: string;
}

export interface TurboReceivedFile {
  name: string;
  type: string;
  size: number;
  sha256: string;
  bytes: Uint8Array;
  durationMs: number;
  averageSpeedMBps: number;
}

export class TurboReceiverController {
  private state: TurboReceiverState = 'IDLE';
  private token: TurboPairingToken | null = null;
  private activeEndpoint = '';
  private abortController: AbortController | null = null;
  private progressCallback: ((prog: TurboReceiverProgress) => void) | null = null;
  private receivedFile: TurboReceivedFile | null = null;

  private startTime = 0;
  private totalReceivedBytes = 0;
  private lastSpeedSampleTime = 0;
  private lastTransferredBytes = 0;
  private currentSpeedMBps = 0;

  constructor(onProgress?: (prog: TurboReceiverProgress) => void) {
    if (onProgress) this.progressCallback = onProgress;
  }

  public getState(): TurboReceiverState {
    return this.state;
  }

  public getReceivedFile(): TurboReceivedFile | null {
    return this.receivedFile;
  }

  /**
   * Tests candidate network endpoints in parallel to find the fastest reachable route
   */
  public async resolveReachableEndpoint(candidates: string[], sid: string, timeoutMs = 2500): Promise<string> {
    const validCandidates = Array.from(
      new Set(
        candidates
          .filter(c => typeof c === 'string' && c.trim().length > 0)
          .map(c => c.trim().replace(/\/+$/, ''))
      )
    );

    // Also include window.location.origin if available
    if (typeof window !== 'undefined' && window.location?.origin && window.location.origin.startsWith('http')) {
      const origin = window.location.origin.replace(/\/+$/, '');
      if (!validCandidates.includes(origin)) {
        validCandidates.push(origin);
      }
    }

    if (validCandidates.length === 0) {
      throw new Error('No candidate network endpoints provided in optical pairing token');
    }

    const testEndpoint = async (ep: string): Promise<string> => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(`${ep}/api/turbo/meta/${sid}`, {
          cache: 'no-store',
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (res.ok) return ep;
        throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }
    };

    try {
      // Race all candidate endpoints simultaneously
      return await Promise.any(validCandidates.map(ep => testEndpoint(ep)));
    } catch {
      // Fallback to first candidate if racing timed out
      return validCandidates[0];
    }
  }

  /**
   * Starts high-speed ingestion and real-time decryption of the session payload
   */
  public async start(token: TurboPairingToken, concurrency = 6): Promise<TurboReceivedFile> {
    this.token = token;
    this.abortController = new AbortController();
    this.totalReceivedBytes = 0;
    this.lastTransferredBytes = 0;
    this.currentSpeedMBps = 0;

    this.updateProgress('CONNECTING', 0, 0, 0);

    try {
      // 1. Resolve active endpoint
      const endpoint = await this.resolveReachableEndpoint(token.endpoints || [], token.sid);
      this.activeEndpoint = endpoint;

      // 2. Import ephemeral AES-256-GCM key
      const rawKeyBytes = fromBase64Url(token.key);
      const cryptoKey = await importTurboKey(rawKeyBytes);

      // 3. Prepare chunk allocation table
      const totalChunks = token.tc;
      const decryptedChunks = new Array<Uint8Array>(totalChunks);
      let nextChunkIndex = 0;
      let completedChunks = 0;

      this.startTime = performance.now();
      this.lastSpeedSampleTime = performance.now();
      this.updateProgress('TRANSFERRING', 0, 0, 0);

      // 4. Parallel chunk ingestion worker loop
      const worker = async () => {
        while (nextChunkIndex < totalChunks) {
          if (this.abortController?.signal.aborted) {
            throw new Error('Transfer aborted by user');
          }

          const chunkIdx = nextChunkIndex++;
          let framedChunk: Uint8Array | null = null;

          // Attempt chunk download with retry
          for (let attempt = 0; attempt < 3; attempt++) {
            if (this.abortController?.signal.aborted) break;
            try {
              const res = await fetch(`${endpoint}/api/turbo/chunk/${token.sid}/${chunkIdx}`, {
                cache: 'no-store',
                signal: this.abortController?.signal,
              });

              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const buffer = await res.arrayBuffer();
              framedChunk = new Uint8Array(buffer);
              break;
            } catch (err: any) {
              if (this.abortController?.signal.aborted) throw err;
              if (attempt === 2) {
                throw new Error(`Failed to fetch chunk ${chunkIdx} after 3 attempts: ${err.message}`);
              }
              await new Promise(r => setTimeout(r, 120 * (attempt + 1)));
            }
          }

          if (!framedChunk) {
            throw new Error(`Chunk ${chunkIdx} returned empty payload`);
          }

          // Hardware decrypt chunk with AES-256-GCM
          const plaintext = await decryptTurboChunk(framedChunk, cryptoKey);
          decryptedChunks[chunkIdx] = plaintext;

          completedChunks++;
          this.totalReceivedBytes += plaintext.byteLength;

          // Update real-time speed calculation
          const now = performance.now();
          const elapsedDelta = (now - this.lastSpeedSampleTime) / 1000;
          if (elapsedDelta >= 0.25 || completedChunks === totalChunks) {
            const bytesDelta = this.totalReceivedBytes - this.lastTransferredBytes;
            this.currentSpeedMBps = Math.max(0, (bytesDelta / (1024 * 1024)) / elapsedDelta);
            this.lastSpeedSampleTime = now;
            this.lastTransferredBytes = this.totalReceivedBytes;
          }

          const percent = Math.min(100, Math.round((completedChunks / totalChunks) * 100));
          this.updateProgress('TRANSFERRING', percent, this.totalReceivedBytes, completedChunks);
        }
      };

      // Launch concurrent download pipelines
      const workerCount = Math.max(1, Math.min(concurrency, totalChunks));
      await Promise.all(Array.from({ length: workerCount }, () => worker()));

      // 5. Verification Phase: Cryptographic SHA-256 Reassembly
      this.updateProgress('VERIFYING', 100, this.totalReceivedBytes, totalChunks);

      const assembledBytes = new Uint8Array(token.fs);
      let byteOffset = 0;
      for (let i = 0; i < totalChunks; i++) {
        const chunk = decryptedChunks[i];
        if (!chunk) {
          throw new Error(`Corrupted pipeline: chunk ${i} is missing`);
        }
        assembledBytes.set(chunk, byteOffset);
        byteOffset += chunk.byteLength;
      }

      const calculatedSha = await computeSHA256(assembledBytes);
      if (calculatedSha.toLowerCase() !== token.sha256.toLowerCase()) {
        throw new Error(
          `Cryptographic integrity error: SHA-256 checksum mismatch (expected ${token.sha256}, got ${calculatedSha})`
        );
      }

      // Notify local sender of completion
      try {
        await fetch(`${endpoint}/api/turbo/complete/${token.sid}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(1500),
        });
      } catch {
        // Non-fatal notification
      }

      const totalDuration = performance.now() - this.startTime;
      const averageSpeedMBps = totalDuration > 0
        ? (token.fs / (1024 * 1024)) / (totalDuration / 1000)
        : 0;

      const receivedFile: TurboReceivedFile = {
        name: token.fn,
        type: token.ft,
        size: token.fs,
        sha256: calculatedSha,
        bytes: assembledBytes,
        durationMs: totalDuration,
        averageSpeedMBps,
      };

      this.receivedFile = receivedFile;
      this.currentSpeedMBps = averageSpeedMBps;
      this.updateProgress('COMPLETED', 100, token.fs, totalChunks);

      return receivedFile;
    } catch (err: any) {
      const isAborted = this.abortController?.signal.aborted;
      const finalState = isAborted ? 'ABORTED' : 'ERROR';
      this.updateProgress(finalState, 0, this.totalReceivedBytes, 0, err.message);
      throw err;
    }
  }

  public abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.state = 'ABORTED';
  }

  /**
   * Secure zero-fill wipe of in-memory decrypted buffers
   */
  public burn(): void {
    if (this.receivedFile) {
      this.receivedFile.bytes.fill(0);
      this.receivedFile = null;
    }
    this.token = null;
    this.activeEndpoint = '';
    this.state = 'IDLE';
  }

  private updateProgress(
    state: TurboReceiverState,
    percent: number,
    receivedBytes: number,
    currentChunk: number,
    errorMessage?: string
  ): void {
    this.state = state;
    if (this.progressCallback && this.token) {
      this.progressCallback({
        state,
        percent,
        receivedBytes,
        totalBytes: this.token.fs,
        speedMBps: this.currentSpeedMBps,
        currentChunk,
        totalChunks: this.token.tc,
        endpoint: this.activeEndpoint,
        fileName: this.token.fn,
        fileType: this.token.ft,
        errorMessage,
      });
    }
  }
}
