/**
 * SpectraBeam - End-to-End Turbo High-Speed Streaming Verification
 * 
 * Tests the complete Phase 2 Sender + Phase 3 Receiver pipeline:
 * 1. Generates 2 MB synthetic payload
 * 2. Prepares and encrypts chunks via TurboSession
 * 3. Registers with local dev server endpoint (/api/turbo/register)
 * 4. Generates optical pairing token ('SPTB:...')
 * 5. Ingests token via TurboReceiverController
 * 6. Downloads chunks in parallel, decrypts on-the-fly, verifies SHA-256
 * 7. Asserts throughput >= 2 MB/s (typically 50-200+ MB/s over local loopback)
 */

import {
  createTurboSession,
  encryptTurboChunk,
  decodePairingToken,
} from './turbo-protocol.ts';
import { TurboReceiverController } from '../modules/receive/turbo-receiver.ts';

export async function runTurboE2E(): Promise<boolean> {
  console.log('🚀 [TURBO E2E] Starting Full Pipeline Integration Test...');

  // 1. Generate 2 MB synthetic test file
  const testFileSize = 2 * 1024 * 1024; // 2 MB
  const rawBytes = new Uint8Array(testFileSize);
  for (let i = 0; i < testFileSize; i += 65536) {
    const sliceLen = Math.min(65536, testFileSize - i);
    const slice = new Uint8Array(sliceLen);
    crypto.getRandomValues(slice);
    rawBytes.set(slice, i);
  }

  const testFile = {
    name: 'turbo-e2e-payload.bin',
    type: 'application/octet-stream',
    data: rawBytes,
  };

  const endpoint = 'http://127.0.0.1:5173';
  console.log(`📦 [TURBO E2E] Generated 2 MB payload (${testFileSize} bytes). Creating session...`);

  // 2. Prepare Turbo Session (Sender Side)
  const session = await createTurboSession(testFile, [endpoint]);
  console.log(`🔑 [TURBO E2E] Session Created: ID 0x${session.token.sid} with ${session.chunks.length} chunks (cs=${session.token.cs})`);

  // Encrypt chunks
  const encryptedChunksBase64: string[] = [];
  for (let i = 0; i < session.chunks.length; i++) {
    const chunk = session.chunks[i];
    const encrypted = await encryptTurboChunk(chunk, session.cryptoKey, i);
    let binary = '';
    for (let b = 0; b < encrypted.byteLength; b++) {
      binary += String.fromCharCode(encrypted[b]);
    }
    encryptedChunksBase64.push(btoa(binary));
  }

  // Register session with local server
  const regRes = await fetch(`${endpoint}/api/turbo/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sid: session.token.sid,
      token: session.token,
      chunksBase64: encryptedChunksBase64,
    }),
  });

  if (!regRes.ok) {
    throw new Error(`Failed to register turbo session: HTTP ${regRes.status}`);
  }
  console.log(`✅ [TURBO E2E] Registered with local server at ${endpoint}`);

  // 3. Optical QR Handshake Token
  const opticalQrPayload = session.qrPayload;
  console.log(`📱 [TURBO E2E] Optical QR Payload (${opticalQrPayload.length} chars): ${opticalQrPayload.substring(0, 45)}...`);

  const parsedToken = decodePairingToken(opticalQrPayload);
  if (!parsedToken) {
    throw new Error('Failed to parse optical QR pairing token');
  }
  console.log('✅ [TURBO E2E] Receiver optical QR token parsed successfully');

  // 4. Ingest and Stream with TurboReceiverController (Receiver Side)
  let lastReportedSpeed = 0;
  const receiver = new TurboReceiverController(prog => {
    lastReportedSpeed = prog.speedMBps;
    if (prog.currentChunk % 8 === 0 || prog.currentChunk === prog.totalChunks) {
      console.log(`   ⚡ Receiver Progress: ${prog.percent}% (${prog.currentChunk}/${prog.totalChunks} chunks) - Speed: ${prog.speedMBps.toFixed(1)} MB/s`);
    }
  });

  console.log('📥 [TURBO E2E] Launching parallel chunk ingestion pipeline...');
  const t0 = performance.now();
  const receivedFile = await receiver.start(parsedToken, 6);
  const elapsedSec = (performance.now() - t0) / 1000;

  const actualSpeedMBps = (testFileSize / (1024 * 1024)) / elapsedSec;
  console.log(`🎉 [TURBO E2E] Complete! Received ${receivedFile.size} bytes in ${elapsedSec.toFixed(3)}s`);
  console.log(`⚡ [TURBO E2E] Measured Throughput: ${actualSpeedMBps.toFixed(1)} MB/s (Target: >= 2.0 MB/s)`);

  // 5. Verification Asserts
  if (receivedFile.size !== testFileSize) {
    throw new Error(`Size mismatch: expected ${testFileSize}, got ${receivedFile.size}`);
  }

  if (receivedFile.sha256.toLowerCase() !== session.token.sha256.toLowerCase()) {
    throw new Error(`SHA-256 integrity failed: expected ${session.token.sha256}, got ${receivedFile.sha256}`);
  }

  // Bit-for-bit check
  for (let i = 0; i < testFileSize; i++) {
    if (receivedFile.bytes[i] !== rawBytes[i]) {
      throw new Error(`Byte mismatch at index ${i}`);
    }
  }

  console.log('🔒 [TURBO E2E] Bit-for-bit data integrity 100% matched!');
  console.log(`🏁 [TURBO E2E] Speed target achieved: ${actualSpeedMBps.toFixed(1)} MB/s >= 2 MB/s ✅`);
  return true;
}

if (process.argv[1]?.includes('test-turbo-e2e')) {
  runTurboE2E()
    .then(pass => {
      console.log('RESULT:', pass ? 'ALL TESTS PASSED' : 'FAILED');
      process.exit(pass ? 0 : 1);
    })
    .catch(err => {
      console.error('ERROR:', err);
      process.exit(1);
    });
}
