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
    const ptr = zx._malloc(w * h * 4);
    zx.HEAPU8.set(new Uint8Array(buf), ptr);

    const vec = zx.readFull(ptr, w, h, true, 4, false);
    const symbols: Uint8Array[] = [];

    for (let i = 0; i < vec.size(); i++) {
      const r = vec.get(i);
      if (r.valid && r.bytes && r.bytes.length > 0) {
        symbols.push(new Uint8Array(r.bytes));
      }
    }
    vec.delete();
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
