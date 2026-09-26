/**
 * SpectraBeam - High-Speed Air-Gapped Hybrid Turbo Protocol
 * 
 * Defines the binary wire format, optical pairing token serialization,
 * ephemeral AES-256-GCM session cryptography, and chunk framing
 * for 10-50 MB/s offline local transfers.
 */

export const TURBO_PROTOCOL_MAGIC = 0x53505442; // "SPTB" in hex (SpectraBeam Turbo)
export const TURBO_VERSION = 0x01;
export const DEFAULT_TURBO_CHUNK_SIZE = 64 * 1024; // 64 KB per chunk (optimal for network backpressure)

export interface TurboPairingToken {
  protocol: 'spectrabeam-turbo';
  v: number;               // Protocol version (1)
  sid: string;             // Ephemeral session ID (hex)
  fn: string;              // File name
  fs: number;              // File size in bytes
  ft: string;              // MIME type
  sha256: string;          // Full file SHA-256 checksum
  tc: number;              // Total chunks
  cs: number;              // Chunk size in bytes
  key: string;             // 32-byte AES-256 raw key in base64url
  endpoints: string[];     // Local connection endpoints (e.g. ["http://192.168.1.10:5173", ...])
  ts: number;              // Creation timestamp
}

export interface TurboChunkFrame {
  chunkIndex: number;
  totalChunks: number;
  iv: Uint8Array;          // 12-byte AES-GCM IV
  ciphertext: Uint8Array;  // Encrypted chunk + 16-byte GCM tag
}

export interface TurboSession {
  token: TurboPairingToken;
  qrPayload: string;       // Compact string ready for rendering into 1-second QR
  cryptoKey: CryptoKey;
  rawKeyBytes: Uint8Array;
  chunks: Uint8Array[];
}

/**
 * Base64URL Encoding and Decoding utilities (RFC 4648)
 */
export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function fromBase64Url(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Computes SHA-256 hex string for a given Uint8Array buffer
 */
export async function computeSHA256(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as unknown as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates an ephemeral 256-bit AES-GCM CryptoKey and exports its raw bytes
 */
export async function generateTurboKey(): Promise<{ key: CryptoKey; raw: Uint8Array }> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable for optical QR pairing token
    ['encrypt', 'decrypt']
  );
  const rawBuffer = await crypto.subtle.exportKey('raw', key);
  return { key, raw: new Uint8Array(rawBuffer) };
}

/**
 * Imports raw 32-byte key material into an AES-GCM CryptoKey
 */
export async function importTurboKey(rawKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    rawKey as unknown as BufferSource,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a single chunk of data with AES-256-GCM.
 * Prepends a dedicated 12-byte IV to the returned buffer:
 * Output: [12 bytes IV] [Ciphertext + 16-byte Auth Tag]
 */
export async function encryptTurboChunk(
  chunk: Uint8Array,
  key: CryptoKey,
  chunkIndex: number
): Promise<Uint8Array> {
  // Generate high-entropy 12-byte IV with chunkIndex protection
  const iv = crypto.getRandomValues(new Uint8Array(12));
  // Embed chunkIndex into the last 4 bytes of IV to ensure uniqueness per chunk
  const view = new DataView(iv.buffer, iv.byteOffset, iv.byteLength);
  view.setUint32(8, chunkIndex, false);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    chunk as unknown as BufferSource
  );

  const ciphertext = new Uint8Array(ciphertextBuffer);
  const framed = new Uint8Array(12 + ciphertext.length);
  framed.set(iv, 0);
  framed.set(ciphertext, 12);
  return framed;
}

/**
 * Decrypts an encrypted chunk produced by encryptTurboChunk.
 * Expects input: [12 bytes IV] [Ciphertext + 16-byte Auth Tag]
 */
export async function decryptTurboChunk(
  framedChunk: Uint8Array,
  key: CryptoKey
): Promise<Uint8Array> {
  if (framedChunk.length < 28) {
    throw new Error(`Invalid turbo chunk: length ${framedChunk.length} is less than minimum 28 bytes (IV + Tag)`);
  }

  const iv = framedChunk.subarray(0, 12);
  const ciphertext = framedChunk.subarray(12);

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ciphertext as unknown as BufferSource
  );

  return new Uint8Array(plaintextBuffer);
}

/**
 * Encodes a TurboPairingToken into a compact JSON string suitable for 1-second optical QR scanning
 */
export function encodePairingToken(token: TurboPairingToken): string {
  // We prefix with 'SPTB:' for instant scanner protocol identification
  return `SPTB:${JSON.stringify(token)}`;
}

/**
 * Parses and validates an optical QR string into a TurboPairingToken
 */
export function decodePairingToken(rawQr: string): TurboPairingToken | null {
  try {
    let jsonStr = rawQr.trim();
    if (jsonStr.startsWith('SPTB:')) {
      jsonStr = jsonStr.substring(5);
    }
    const parsed = JSON.parse(jsonStr);
    if (
      parsed.protocol === 'spectrabeam-turbo' &&
      typeof parsed.sid === 'string' &&
      typeof parsed.key === 'string' &&
      typeof parsed.fs === 'number' &&
      typeof parsed.tc === 'number'
    ) {
      return parsed as TurboPairingToken;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Splits a full binary file into discrete chunk slices
 */
export function slicePayload(data: Uint8Array, chunkSize = DEFAULT_TURBO_CHUNK_SIZE): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  const total = data.byteLength;
  let offset = 0;
  while (offset < total) {
    const end = Math.min(offset + chunkSize, total);
    chunks.push(data.subarray(offset, end));
    offset = end;
  }
  return chunks;
}

/**
 * Creates a complete Turbo Session from raw file data and candidates
 */
export async function createTurboSession(
  file: { name: string; type: string; data: Uint8Array },
  endpoints: string[] = [],
  chunkSize = DEFAULT_TURBO_CHUNK_SIZE
): Promise<TurboSession> {
  const { key, raw } = await generateTurboKey();
  const sha256 = await computeSHA256(file.data);
  const chunks = slicePayload(file.data, chunkSize);

  // Generate random 8-character hex session ID
  const sidBytes = crypto.getRandomValues(new Uint8Array(4));
  const sid = Array.from(sidBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  const token: TurboPairingToken = {
    protocol: 'spectrabeam-turbo',
    v: TURBO_VERSION,
    sid,
    fn: file.name,
    fs: file.data.byteLength,
    ft: file.type || 'application/octet-stream',
    sha256,
    tc: chunks.length,
    cs: chunkSize,
    key: toBase64Url(raw),
    endpoints,
    ts: Date.now(),
  };

  const qrPayload = encodePairingToken(token);

  return {
    token,
    qrPayload,
    cryptoKey: key,
    rawKeyBytes: raw,
    chunks,
  };
}
