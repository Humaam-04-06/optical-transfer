/**
 * SpectraBeam Optical Transfer - Core Types & Protocol Constants
 */

export const PROTOCOL_MAGIC_0 = 0xD1;
export const PROTOCOL_MAGIC_1 = 0xC4; // v4 extended wire format identifier
export const PROTOCOL_VERSION = 0x04;

export enum ProtocolFlags {
  ENCRYPTED = 1 << 0,       // Bit 0: AES-256-GCM payload
  CHROMA_RGB = 1 << 1,      // Bit 1: RGB 3-channel multiplexed frame
  GZIP_COMPRESSED = 1 << 2, // Bit 2: Compressed container
  COLD_ENCLAVE = 1 << 3,    // Bit 3: Crypto PSBT / Vault payload
}

export interface WireHeader {
  magic0: number;
  magic1: number;
  version: number;
  flags: number;
  sessionId: number;
  sequenceNumber: number;
  k: number;             // Total number of original blocks
  blockLength: number;   // Length of each slice in bytes
  totalLength: number;   // Full unpadded payload length
  payloadFnv: number;    // FNV-1a checksum of the chunk
  securityTag: number;   // Ephemeral key or salt hash (0 if unencrypted)
}

export interface FountainPacket {
  header: WireHeader;
  blockIndices: number[]; // Derived deterministically from sequenceNumber
  data: Uint8Array;
}

export interface TransferPayload {
  name: string;
  type: string;
  data: Uint8Array;
  sha256: string;
  isEncrypted?: boolean;
}

export interface DecoderProgress {
  sessionId: number;
  receivedFrames: number;
  uniqueBlocksRecovered: number;
  totalBlocksK: number;
  bytesReceived: number;
  goodputKBps: number;
  estimatedRemainingFrames: number;
  isComplete: boolean;
}

export interface SecurityConfig {
  enabled: boolean;
  passphrase?: string;
  ephemeralKey?: CryptoKeyPair;
  burnAfterReading?: boolean;
  antiSurveillanceStrobe?: boolean;
}

export type PageRoute = 'home' | 'send' | 'receive' | 'enclave' | 'benchmark';
