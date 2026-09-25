/**
 * SpectraBeam - Multi-Threaded Web Worker Pool for Camera Decode Stream
 */

export class DecodeWorkerPool {
  private workers: Worker[] = [];
  private busy: boolean[] = [];
  private nextJobId = 0;
  private pendingCallbacks = new Map<number, (symbols: Uint8Array[]) => void>();

  constructor(poolSize = Math.max(2, Math.min(4, navigator.hardwareConcurrency || 2))) {
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(new URL('./decode-worker.ts', import.meta.url), {
        type: 'module',
      });

      const workerIndex = i;
      this.busy[workerIndex] = false;

      worker.onmessage = (e: MessageEvent) => {
        const { id, symbols } = e.data;
        if (id === -1) {
          // Warmup ping
          return;
        }

        this.busy[workerIndex] = false;
        const cb = this.pendingCallbacks.get(id);
        if (cb) {
          this.pendingCallbacks.delete(id);
          cb(symbols || []);
        }
      };

      this.workers.push(worker);
    }
  }

  /**
   * Submits a frame for decoding. If all workers are occupied, returns false immediately
   * (fountain coding comfortably absorbs frame drops without stalls).
   */
  public decodeFrame(
    imgData: ImageData,
    onResult: (symbols: Uint8Array[]) => void
  ): boolean {
    const freeIdx = this.busy.findIndex(b => !b);
    if (freeIdx === -1) {
      return false; // Workers busy, drop frame
    }

    const id = ++this.nextJobId;
    this.busy[freeIdx] = true;
    this.pendingCallbacks.set(id, onResult);

    // Transfer pixel buffer to worker without cloning overhead
    const buf = imgData.data.buffer.slice(0);
    this.workers[freeIdx].postMessage(
      {
        id,
        buf,
        w: imgData.width,
        h: imgData.height,
      },
      [buf]
    );

    return true;
  }

  public terminate(): void {
    for (const w of this.workers) {
      w.terminate();
    }
    this.workers = [];
    this.busy = [];
    this.pendingCallbacks.clear();
  }
}
