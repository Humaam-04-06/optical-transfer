/**
 * SpectraBeam - High-Speed WebAssembly QR Decoding Worker
 */

import DecimenCodec, { DecimenModule } from '../vendor/decimen-codec/decimen_codec.js';
import wasmUrl from '../vendor/decimen-codec/decimen_codec.wasm?url';

let readyCodec: Promise<DecimenModule> | null = null;

function getCodec(): Promise<DecimenModule> {
  if (!readyCodec) {
    readyCodec = DecimenCodec({
      locateFile: (path: string) => {
        if (path.endsWith('.wasm')) return wasmUrl;
        return path;
      },
    });
  }
  return readyCodec;
}

const ctx = self as unknown as {
  onmessage: ((e: MessageEvent) => void) | null;
  postMessage(msg: unknown, transfer?: Transferable[]): void;
};

ctx.onmessage = async (e: MessageEvent) => {
  const { id, buf, w, h } = e.data as {
    id: number;
    buf: ArrayBuffer;
    w: number;
    h: number;
  };

  try {
    const zx = await getCodec();
    const u8 = new Uint8Array(buf);
    const totalPixels = w * h;
    const ptr = zx._malloc(totalPixels * 4);
    const symbols: Uint8Array[] = [];

    // Helper to extract valid decoded symbols
    const extractSymbols = (vec: any) => {
      for (let i = 0; i < vec.size(); i++) {
        const r = vec.get(i);
        if (r.valid && r.bytes && r.bytes.length > 0) {
          symbols.push(new Uint8Array(r.bytes));
        }
      }
      vec.delete();
    };

    // 1. Fast color variance detection to check for ChromaBeam RGB multiplexing
    let colorVariance = 0;
    const step = Math.max(4, Math.floor(totalPixels / 120)) * 4;
    let samples = 0;
    for (let i = 0; i < u8.length; i += step) {
      const r = u8[i];
      const g = u8[i + 1];
      const b = u8[i + 2];
      colorVariance += Math.abs(r - g) + Math.abs(g - b);
      samples++;
    }
    const isChromaFrame = samples > 0 && (colorVariance / samples) > 16;

    if (isChromaFrame) {
      // ChromaBeam Mode: Decode Red, Green, and Blue color planes independently
      const channelBuf = new Uint8Array(totalPixels * 4);

      // Scan Red Plane
      for (let i = 0, j = 0; i < u8.length; i += 4, j += 4) {
        const val = u8[i];
        channelBuf[j] = val;
        channelBuf[j + 1] = val;
        channelBuf[j + 2] = val;
        channelBuf[j + 3] = 255;
      }
      zx.HEAPU8.set(channelBuf, ptr);
      const vecR = zx.readFull(ptr, w, h, true, 4, false);
      extractSymbols(vecR);

      // Scan Green Plane
      for (let i = 0, j = 0; i < u8.length; i += 4, j += 4) {
        const val = u8[i + 1];
        channelBuf[j] = val;
        channelBuf[j + 1] = val;
        channelBuf[j + 2] = val;
        channelBuf[j + 3] = 255;
      }
      zx.HEAPU8.set(channelBuf, ptr);
      const vecG = zx.readFull(ptr, w, h, true, 4, false);
      extractSymbols(vecG);

      // Scan Blue Plane
      for (let i = 0, j = 0; i < u8.length; i += 4, j += 4) {
        const val = u8[i + 2];
        channelBuf[j] = val;
        channelBuf[j + 1] = val;
        channelBuf[j + 2] = val;
        channelBuf[j + 3] = 255;
      }
      zx.HEAPU8.set(channelBuf, ptr);
      const vecB = zx.readFull(ptr, w, h, true, 4, false);
      extractSymbols(vecB);
    } else {
      // Standard Monochrome QR Code scan
      zx.HEAPU8.set(u8, ptr);
      const vec = zx.readFull(ptr, w, h, true, 4, false);
      extractSymbols(vec);

      // Fallback: If standard scan yielded no symbols and some color variance exists, check Red plane
      if (symbols.length === 0 && colorVariance > 0) {
        const channelBuf = new Uint8Array(totalPixels * 4);
        for (let i = 0, j = 0; i < u8.length; i += 4, j += 4) {
          const val = u8[i];
          channelBuf[j] = val;
          channelBuf[j + 1] = val;
          channelBuf[j + 2] = val;
          channelBuf[j + 3] = 255;
        }
        zx.HEAPU8.set(channelBuf, ptr);
        const vecFallback = zx.readFull(ptr, w, h, true, 4, false);
        extractSymbols(vecFallback);
      }
    }

    zx._free(ptr);
    ctx.postMessage({ id, symbols });
  } catch (err: any) {
    ctx.postMessage({ id, symbols: [], error: err?.message });
  }
};

// Warm-up ping
void (async () => {
  try {
    await getCodec();
    ctx.postMessage({ id: -1, ready: true });
  } catch {}
})();
