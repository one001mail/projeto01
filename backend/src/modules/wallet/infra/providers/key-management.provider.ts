/**
 * KeyManagementProvider port.
 *
 * Abstracts every operation that touches private-key material. The port
 * returns only PUBLIC data (addresses, public keys, signatures) — raw
 * private keys, seed phrases, and signing state never cross this
 * boundary. In production the concrete implementation is an HSM / KMS /
 * regulated custody provider; `LocalEncryptedKeyManagementProvider` is a
 * development-only fallback.
 */
export interface DeriveKeyInput {
  readonly walletId: string;
  readonly custodyKeyRef: string;
  readonly family: 'ethereum' | 'bitcoin';
  readonly addressIndex: number;
}

export interface DerivedPublicMaterial {
  readonly publicKeyHex: string;
  readonly address: string;
}

export interface SignDigestInput {
  readonly custodyKeyRef: string;
  readonly addressIndex: number;
  readonly digest: string; // hex
}

export interface SignResult {
  readonly signatureHex: string;
}

export interface KeyManagementProvider {
  readonly kind: string;
  /** Create a fresh keypair; returns opaque reference handle + public material. */
  createKeypair(input: { family: 'ethereum' | 'bitcoin' }): Promise<{
    custodyKeyRef: string;
    public: DerivedPublicMaterial;
  }>;
  /** Derive the next public material at an index without exposing private keys. */
  derivePublic(input: DeriveKeyInput): Promise<DerivedPublicMaterial>;
  /** Sign a digest entirely inside the KMS boundary. */
  signDigest(input: SignDigestInput): Promise<SignResult>;
}
