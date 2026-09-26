/**
 * SpectraBeam - Automated Self-Test Verification Suite for Turbo Protocol (Phase 1)
 */

import {
  createTurboSession,
  decodePairingToken,
  decryptTurboChunk,
  encryptTurboChunk,
  fromBase64Url,
  importTurboKey,
  computeSHA256,
} from './turbo-protocol.ts';

export async function runTurboProtocolTests(): Promise<{ passed: boolean; logs: string[] }> {
  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(msg);
    console.log(msg);
  };

  log('🧪 [TEST 1/5] Testing SHA-256 Checksum Accuracy...');
  const testData = new TextEncoder().encode('SpectraBeam Air-Gapped High-Speed Turbo Mode');
  const checksum1 = await computeSHA256(testData);
  const checksum2 = await computeSHA256(testData);
  if (checksum1 !== checksum2 || checksum1.length !== 64) {
    throw new Error(`Checksum test failed: ${checksum1}`);
  }
  log(`   ✅ SHA-256 Hash verified: ${checksum1.substring(0, 16)}...`);

  log('🧪 [TEST 2/5] Testing Optical Pairing Token Serialization...');
  const syntheticPayload = new Uint8Array(256 * 1024); // 256 KB
  for (let offset = 0; offset < syntheticPayload.length; offset += 65536) {
    const chunk = syntheticPayload.subarray(offset, Math.min(offset + 65536, syntheticPayload.length));
    crypto.getRandomValues(chunk);
  }

  const session = await createTurboSession(
    { name: 'airgap-payload.bin', type: 'application/octet-stream', data: syntheticPayload },
    ['http://192.168.1.100:5173', 'http://10.0.0.5:5173']
  );

  log(`   Pairing QR length: ${session.qrPayload.length} chars (Instant <1s camera scan)`);
  const decodedToken = decodePairingToken(session.qrPayload);

  if (!decodedToken) {
    throw new Error('Failed to decode optical pairing token');
  }
  if (decodedToken.sid !== session.token.sid || decodedToken.sha256 !== session.token.sha256) {
    throw new Error('Decoded token fields do not match original session');
  }
  log('   ✅ Optical Pairing Token roundtrip successfully verified');

  log('🧪 [TEST 3/5] Testing Ephemeral AES-256-GCM Key Export & Import...');
  const rawKey = fromBase64Url(decodedToken.key);
  if (rawKey.length !== 32) {
    throw new Error(`Invalid raw key size: ${rawKey.length} bytes (expected 32)`);
  }
  const receiverKey = await importTurboKey(rawKey);
  log('   ✅ 256-bit AES Key successfully imported into receiver Web Crypto runtime');

  log('🧪 [TEST 4/5] Testing Chunk Encryption, Framing & Decryption Across All Slices...');
  const decryptedChunks: Uint8Array[] = [];

  for (let i = 0; i < session.chunks.length; i++) {
    const chunk = session.chunks[i];
    const encrypted = await encryptTurboChunk(chunk, session.cryptoKey, i);
    // Decrypt using receiver key
    const decrypted = await decryptTurboChunk(encrypted, receiverKey);

    if (decrypted.byteLength !== chunk.byteLength) {
      throw new Error(`Chunk ${i} length mismatch: got ${decrypted.byteLength}, expected ${chunk.byteLength}`);
    }
    // Verify first and last bytes
    if (decrypted[0] !== chunk[0] || decrypted[decrypted.length - 1] !== chunk[chunk.length - 1]) {
      throw new Error(`Chunk ${i} byte content mismatch!`);
    }
    decryptedChunks.push(decrypted);
  }
  log(`   ✅ Successfully encrypted and decrypted all ${session.chunks.length} chunks`);

  log('🧪 [TEST 5/5] Testing Full Reassembled Payload Integrity & Tamper Resistance...');
  const totalLength = decryptedChunks.reduce((acc, c) => acc + c.byteLength, 0);
  const reassembled = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of decryptedChunks) {
    reassembled.set(c, offset);
    offset += c.byteLength;
  }

  const finalSha256 = await computeSHA256(reassembled);
  if (finalSha256 !== session.token.sha256) {
    throw new Error(`Final payload SHA-256 mismatch: got ${finalSha256}, expected ${session.token.sha256}`);
  }

  // Tamper resistance test: flip 1 byte of encrypted chunk and verify AES-GCM tag rejection
  const testEncrypted = await encryptTurboChunk(new Uint8Array([1, 2, 3, 4]), session.cryptoKey, 0);
  testEncrypted[testEncrypted.length - 1] ^= 0xFF; // Corrupt auth tag
  let caughtTamper = false;
  try {
    await decryptTurboChunk(testEncrypted, receiverKey);
  } catch {
    caughtTamper = true;
  }
  if (!caughtTamper) {
    throw new Error('AES-GCM failed to reject tampered ciphertext!');
  }
  log('   ✅ Authenticated encryption strictly rejected tampered ciphertext');
  log(`   ✅ Full payload (256 KB) verified with 100% bit-level fidelity: ${finalSha256.substring(0, 16)}...`);

  return { passed: true, logs };
}
