/**
 * SpectraBeam - SpectraVault WebCrypto Security Engine
 * 
 * Hardware-accelerated zero-knowledge AES-256-GCM encryption,
 * PBKDF2 key derivation, and ephemeral ECDH handshake.
 */

export class SpectraCrypto {
  /**
   * Derives a 256-bit AES-GCM CryptoKey from a user passphrase and salt.
   */
  public static async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as unknown as BufferSource,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts plaintext bytes using AES-256-GCM with a random 12-byte IV.
   * Returns: [16 bytes: Salt] [12 bytes: IV] [Ciphertext + 16-byte Auth Tag]
   */
  public static async encrypt(data: Uint8Array, passphrase: string): Promise<Uint8Array> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(passphrase, salt);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      data as unknown as BufferSource
    );

    const ciphertext = new Uint8Array(ciphertextBuffer);
    const combined = new Uint8Array(16 + 12 + ciphertext.length);
    combined.set(salt, 0);
    combined.set(iv, 16);
    combined.set(ciphertext, 28);

    return combined;
  }

  /**
   * Decrypts AES-256-GCM ciphertext created by encrypt().
   */
  public static async decrypt(encryptedPayload: Uint8Array, passphrase: string): Promise<Uint8Array> {
    if (encryptedPayload.length < 28 + 16) {
      throw new Error('Encrypted payload too short (truncated)');
    }

    const salt = encryptedPayload.subarray(0, 16);
    const iv = encryptedPayload.subarray(16, 28);
    const ciphertext = encryptedPayload.subarray(28);

    const key = await this.deriveKey(passphrase, salt);

    const plaintextBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      ciphertext as unknown as BufferSource
    );

    return new Uint8Array(plaintextBuffer);
  }

  /**
   * Generates an ephemeral ECDH (P-256) keypair for two-way optical handshake.
   */
  public static async generateEphemeralKeyPair(): Promise<CryptoKeyPair> {
    return crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );
  }

  /**
   * Exports an ECDH public key as raw bytes for optical QR exchange.
   */
  public static async exportPublicKey(publicKey: CryptoKey): Promise<Uint8Array> {
    const raw = await crypto.subtle.exportKey('raw', publicKey);
    return new Uint8Array(raw);
  }

  /**
   * Computes SHA-256 hexadecimal string of arbitrary bytes.
   */
  public static async sha256Hex(data: Uint8Array): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', data as unknown as BufferSource);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
