/**
 * EncryptedSecret VO.
 *
 * An opaque wrapper around an already-encrypted blob. This type is the
 * ONLY way secret material is allowed to cross domain boundaries: by
 * construction there is no accessor that returns plaintext, and the
 * toJSON() override emits a fixed marker so logs and API responses never
 * leak the ciphertext.
 *
 * Actual encryption/decryption happens behind the
 * `EncryptionService` in `infra/security/`.
 */
import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface EncryptedSecretProps extends Record<string, unknown> {
  readonly algorithm: string; // e.g. 'aes-256-gcm'
  readonly iv: string; // base64
  readonly authTag: string; // base64
  readonly ciphertext: string; // base64
  readonly keyFingerprint: string; // first 8 hex of sha256(key)
}

export class EncryptedSecret extends ValueObject<EncryptedSecretProps> {
  static of(props: EncryptedSecretProps): EncryptedSecret {
    if (
      !props.algorithm ||
      !props.iv ||
      !props.authTag ||
      !props.ciphertext ||
      !props.keyFingerprint
    ) {
      throw new Error(
        'EncryptedSecret requires algorithm, iv, authTag, ciphertext, keyFingerprint',
      );
    }
    return new EncryptedSecret({ ...props });
  }

  /** Intentionally: no plaintext accessor. Decryption goes through EncryptionService. */
  get algorithm(): string {
    return this.props.algorithm;
  }
  get keyFingerprint(): string {
    return this.props.keyFingerprint;
  }

  /** Raw envelope for the repository only. */
  unsafeEnvelope(): EncryptedSecretProps {
    return { ...this.props };
  }

  /** Safe representation — never leaks ciphertext. */
  override toJSON(): Readonly<EncryptedSecretProps> {
    return {
      algorithm: this.props.algorithm,
      iv: '<redacted>',
      authTag: '<redacted>',
      ciphertext: '<redacted>',
      keyFingerprint: this.props.keyFingerprint,
    };
  }
}
