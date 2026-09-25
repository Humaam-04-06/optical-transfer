/**
 * SpectraBeam - Protocol Wire Format & Container Packaging
 */

import { PROTOCOL_MAGIC_0, PROTOCOL_MAGIC_1, PROTOCOL_VERSION, WireHeader } from './types.ts';

export const HEADER_SIZE = 26;

/** 32-bit FNV-1a hash */
export function fnv1a(data: Uint8Array): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i];
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Packs 26-byte binary header followed by payload into a single Uint8Array frame.
 */
export function packFrame(header: WireHeader, chunk: Uint8Array): Uint8Array {
  const frame = new Uint8Array(HEADER_SIZE + chunk.length);
  const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);

  view.setUint8(0, PROTOCOL_MAGIC_0);
  view.setUint8(1, PROTOCOL_MAGIC_1);
  view.setUint8(2, PROTOCOL_VERSION);
  view.setUint8(3, header.flags);
  view.setUint16(4, header.sessionId, false);
  view.setUint32(6, header.sequenceNumber, false);
  view.setUint16(10, header.k, false);
  view.setUint16(12, header.blockLength, false);
  view.setUint32(14, header.totalLength, false);
  view.setUint32(18, fnv1a(chunk), false);
  view.setUint32(22, header.securityTag, false);

  frame.set(chunk, HEADER_SIZE);
  return frame;
}

/**
 * Unpacks and validates a 26-byte binary header from raw frame bytes.
 */
export function unpackFrame(rawBytes: Uint8Array): { header: WireHeader; chunk: Uint8Array } | null {
  if (rawBytes.length < HEADER_SIZE) return null;

  const view = new DataView(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength);
  const magic0 = view.getUint8(0);
  const magic1 = view.getUint8(1);

  if (magic0 !== PROTOCOL_MAGIC_0) return null;
  // Accept both v3 (0xC3) and v4 (0xC4)
  if (magic1 !== 0xC3 && magic1 !== PROTOCOL_MAGIC_1) return null;

  const version = view.getUint8(2);
  const flags = view.getUint8(3);
  const sessionId = view.getUint16(4, false);
  const sequenceNumber = view.getUint32(6, false);
  const k = view.getUint16(10, false);
  const blockLength = view.getUint16(12, false);
  const totalLength = view.getUint32(14, false);
  const payloadFnv = view.getUint32(18, false);
  const securityTag = view.getUint32(22, false);

  const chunk = rawBytes.subarray(HEADER_SIZE);
  if (fnv1a(chunk) !== payloadFnv) {
    return null; // Corrupted frame
  }

  const header: WireHeader = {
    magic0,
    magic1,
    version,
    flags,
    sessionId,
    sequenceNumber,
    k,
    blockLength,
    totalLength,
    payloadFnv,
    securityTag,
  };

  return { header, chunk };
}

export interface ContainerMetadata {
  name: string;
  type: string;
  sha256: string;
  originalSize: number;
  compressed: boolean;
}

/**
 * Encodes payload with metadata into a self-extracting container.
 */
export async function packageContainer(
  fileBytes: Uint8Array,
  name: string,
  type = 'application/octet-stream',
  enableGzip = true
): Promise<Uint8Array> {
  let payloadBytes = fileBytes;
  let compressed = false;

  // Attempt Gzip compression if CompressionStream is available
  if (enableGzip && typeof CompressionStream !== 'undefined') {
    try {
      const cs = new CompressionStream('gzip');
      const writer = cs.writable.getWriter();
      writer.write(fileBytes as unknown as BufferSource);
      writer.close();
      const compressedBuffer = await new Response(cs.readable).arrayBuffer();
      const compressedArray = new Uint8Array(compressedBuffer);
      if (compressedArray.length < fileBytes.length) {
        payloadBytes = compressedArray;
        compressed = true;
      }
    } catch {
      // Fall back uncompressed if gzip fails
    }
  }

  // Calculate SHA-256 of original file
  const hashBuffer = await crypto.subtle.digest('SHA-256', fileBytes as unknown as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const metaObj: ContainerMetadata = {
    name,
    type,
    sha256,
    originalSize: fileBytes.length,
    compressed,
  };

  const metaJson = JSON.stringify(metaObj);
  const metaBytes = new TextEncoder().encode(metaJson);

  // Layout: [2 bytes: metaLen] [metaBytes] [payloadBytes]
  const container = new Uint8Array(2 + metaBytes.length + payloadBytes.length);
  const view = new DataView(container.buffer, container.byteOffset, container.byteLength);
  view.setUint16(0, metaBytes.length, false);
  container.set(metaBytes, 2);
  container.set(payloadBytes, 2 + metaBytes.length);

  return container;
}

/**
 * Unpacks container back into file bytes and verified metadata.
 */
export async function unpackContainer(containerBytes: Uint8Array): Promise<{ metadata: ContainerMetadata; fileBytes: Uint8Array }> {
  if (containerBytes.length < 2) {
    throw new Error('Container truncated');
  }

  const view = new DataView(containerBytes.buffer, containerBytes.byteOffset, containerBytes.byteLength);
  const metaLen = view.getUint16(0, false);
  if (containerBytes.length < 2 + metaLen) {
    throw new Error('Invalid container metadata length');
  }

  const metaBytes = containerBytes.subarray(2, 2 + metaLen);
  const metaJson = new TextDecoder().decode(metaBytes);
  const metadata: ContainerMetadata = JSON.parse(metaJson);

  let rawPayload = containerBytes.subarray(2 + metaLen);

  if (metadata.compressed && typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(rawPayload as unknown as BufferSource);
    writer.close();
    const decompressed = await new Response(ds.readable).arrayBuffer();
    rawPayload = new Uint8Array(decompressed);
  }

  // Verify SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', rawPayload as unknown as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const calculatedSha = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  if (calculatedSha.toLowerCase() !== metadata.sha256.toLowerCase()) {
    throw new Error(`SHA-256 mismatch! Expected ${metadata.sha256}, got ${calculatedSha}`);
  }

  return { metadata, fileBytes: rawPayload };
}
