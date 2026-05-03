/**
 * EncryptionService (AES-256-GCM).
 *
 * Thin, auditable wrapper around Node's crypto module for symmetric
 * encryption of secret blobs. Used exclusively inside the
 * `LocalEncryptedKeyManagementProvider` for DEVELOPMENT environments.
 * Production systems MUST route all key operations through an HSM or a
 * regulated custody provider — this class is NOT a substitute.
 *
 * The raw key is never logged; only its sha256 fingerprint (first 8 hex
 * chars) is surfaced on EncryptedSecret envelopes.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { EncryptedSecret } from '../../domain/value-objects/encrypted-secret.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LEN = 12;

function normalizeKey(rawKey: string): Buffer {
  // Accept base64, hex, or raw utf8; always derive a 32-byte key via sha256.
  return createHash('sha256').update(rawKey, 'utf8').digest();
}

function fingerprint(keyBuf: Buffer): string {
  return createHash('sha256').update(keyBuf).digest('hex').slice(0, 8);
}

export class EncryptionService {
  private readonly keyBuf: Buffer;
  private readonly fp: string;

  constructor(rawKey: string) {
    if (!rawKey || rawKey.length < 32) {
      throw new Error('EncryptionService requires a key >= 32 chars');
    }
    this.keyBuf = normalizeKey(rawKey);
    this.fp = fingerprint(this.keyBuf);
  }

  get keyFingerprint(): string {
    return this.fp;
  }

  encrypt(plaintext: Buffer): EncryptedSecret {
    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv(ALGORITHM, this.keyBuf, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return EncryptedSecret.of({
      algorithm: ALGORITHM,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      keyFingerprint: this.fp,
    });
  }

  decrypt(secret: EncryptedSecret): Buffer {
    const env = secret.unsafeEnvelope();
    if (env.algorithm !== ALGORITHM) {
      throw new Error(`Unsupported encryption algorithm '${env.algorithm}'`);
    }
    if (env.keyFingerprint !== this.fp) {
      throw new Error('Key fingerprint mismatch: wrong WALLET_ENCRYPTION_KEY');
    }
    const decipher = createDecipheriv(ALGORITHM, this.keyBuf, Buffer.from(env.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(env.authTag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(env.ciphertext, 'base64')),
      decipher.final(),
    ]);
  }
}
