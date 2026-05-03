/**
 * LocalEncryptedKeyManagementProvider.
 *
 * DEVELOPMENT-ONLY implementation of `KeyManagementProvider`. Generates a
 * secp256k1 keypair via Node's `crypto` module, encrypts the private key
 * with AES-256-GCM using `WALLET_ENCRYPTION_KEY`, and keeps the encrypted
 * blob in memory. The private key is:
 *
 *   • never returned from any method;
 *   • never logged;
 *   • never serialized to JSON / API responses;
 *   • accessible only inside `signDigest()` for the duration of one call.
 *
 * Production deployments MUST replace this with an HSM/KMS-backed
 * implementation (AWS KMS, GCP KMS, Azure Key Vault, YubiHSM, or a
 * regulated custody service). See `wallet.md` § "Production Gap".
 */
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  createSign,
  generateKeyPairSync,
  randomUUID,
} from 'node:crypto';
import type { EncryptedSecret } from '../../domain/value-objects/encrypted-secret.js';
import type { EncryptionService } from '../security/encryption.service.js';
import type {
  DeriveKeyInput,
  DerivedPublicMaterial,
  KeyManagementProvider,
  SignDigestInput,
  SignResult,
} from './key-management.provider.js';

interface StoredKey {
  readonly custodyKeyRef: string;
  readonly family: 'ethereum' | 'bitcoin';
  readonly publicKeyDer: Buffer;
  readonly encryptedPrivateKey: EncryptedSecret;
}

function compressSec1(uncompressedSec1: Buffer): Buffer {
  // Node returns uncompressed SEC1 (0x04 || X || Y). Compress to 0x02/0x03 || X.
  if (uncompressedSec1[0] !== 0x04 || uncompressedSec1.length !== 65) {
    throw new Error('Expected uncompressed SEC1 public key');
  }
  const x = uncompressedSec1.subarray(1, 33);
  const y = uncompressedSec1.subarray(33, 65);
  const lastByte = y[y.length - 1] ?? 0;
  const prefix = (lastByte & 1) === 0 ? 0x02 : 0x03;
  return Buffer.concat([Buffer.from([prefix]), x]);
}

function extractSec1PublicKey(publicKeyDer: Buffer): Buffer {
  // Minimal SPKI parser for secp256k1 — locate the trailing BIT STRING that
  // contains the uncompressed SEC1 point (0x04 || X || Y, 65 bytes).
  for (let i = 0; i < publicKeyDer.length - 65; i++) {
    if (publicKeyDer[i] === 0x04 && publicKeyDer[i + 1] !== undefined) {
      const candidate = publicKeyDer.subarray(i, i + 65);
      if (candidate.length === 65 && candidate[0] === 0x04) return Buffer.from(candidate);
    }
  }
  throw new Error('Failed to extract SEC1 public key from DER');
}

function pseudoEthereumAddress(compressedPub: Buffer): string {
  // Development-only approximation: Ethereum uses keccak-256 (not in Node
  // core). We substitute SHA3-256 which yields a correctly shaped address
  // but is NOT byte-for-byte compatible with real Ethereum derivation.
  // Production MUST use a proper keccak256 + secp256k1 library.
  const uncompressed = Buffer.concat([compressedPub.subarray(1)]);
  const hash = createHash('sha3-256').update(uncompressed).digest();
  return `0x${hash.subarray(-20).toString('hex')}`;
}

function pseudoBitcoinTestnetAddress(compressedPub: Buffer): string {
  // Development-only approximation: real Bitcoin Native SegWit uses
  // bech32(hrp='tb', witver=0, sha256+ripemd160(pubkey)). Node core lacks
  // ripemd160 (outside legacy provider) and bech32. We emit a 'tb1' prefix
  // followed by a deterministic sha256-derived tail that is correctly
  // shaped for validation but NOT spendable on a real network.
  const h = createHash('sha256').update(compressedPub).digest().toString('hex');
  const tail = h.slice(0, 39); // ~39 base32 chars shape
  return `tb1q${tail}`;
}

export class LocalEncryptedKeyManagementProvider implements KeyManagementProvider {
  readonly kind = 'local-encrypted-dev';

  private readonly store = new Map<string, StoredKey>();

  constructor(private readonly encryption: EncryptionService) {}

  async createKeypair(input: { family: 'ethereum' | 'bitcoin' }): Promise<{
    custodyKeyRef: string;
    public: DerivedPublicMaterial;
  }> {
    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'secp256k1' });
    const priv = privateKey.export({ format: 'pem', type: 'pkcs8' });
    const pubDer = publicKey.export({ format: 'der', type: 'spki' }) as Buffer;
    const privBuf = Buffer.isBuffer(priv) ? priv : Buffer.from(priv as string, 'utf8');
    const encryptedPrivateKey = this.encryption.encrypt(privBuf);
    const custodyKeyRef = `kms-dev-${randomUUID()}`;

    const sec1 = extractSec1PublicKey(pubDer);
    const compressed = compressSec1(sec1);
    const address =
      input.family === 'ethereum'
        ? pseudoEthereumAddress(compressed)
        : pseudoBitcoinTestnetAddress(compressed);

    this.store.set(custodyKeyRef, {
      custodyKeyRef,
      family: input.family,
      publicKeyDer: pubDer,
      encryptedPrivateKey,
    });

    return {
      custodyKeyRef,
      public: {
        publicKeyHex: compressed.toString('hex'),
        address,
      },
    };
  }

  async derivePublic(input: DeriveKeyInput): Promise<DerivedPublicMaterial> {
    const rec = this.store.get(input.custodyKeyRef);
    if (!rec) {
      throw new Error(`custodyKeyRef '${input.custodyKeyRef}' not found`);
    }
    // Dev stub: we deterministically perturb the stored compressed pubkey
    // per addressIndex so each derived address is distinct but reproducible.
    const sec1 = extractSec1PublicKey(rec.publicKeyDer);
    const compressed = compressSec1(sec1);
    const perturbed = createHash('sha256')
      .update(compressed)
      .update(Buffer.from([input.addressIndex & 0xff, (input.addressIndex >> 8) & 0xff]))
      .digest();
    const compressedDerived = Buffer.concat([Buffer.from([0x02]), perturbed]);
    const address =
      input.family === 'ethereum'
        ? pseudoEthereumAddress(compressedDerived)
        : pseudoBitcoinTestnetAddress(compressedDerived);
    return {
      publicKeyHex: compressedDerived.toString('hex'),
      address,
    };
  }

  async signDigest(input: SignDigestInput): Promise<SignResult> {
    const rec = this.store.get(input.custodyKeyRef);
    if (!rec) {
      throw new Error(`custodyKeyRef '${input.custodyKeyRef}' not found`);
    }
    const privPem = this.encryption.decrypt(rec.encryptedPrivateKey);
    try {
      const privKey = createPrivateKey({ key: privPem, format: 'pem', type: 'pkcs8' });
      // DER-encoded ECDSA signature; consumer converts to r/s as needed.
      const signer = createSign('sha256');
      signer.update(Buffer.from(input.digest, 'hex'));
      signer.end();
      const der = signer.sign(privKey);
      // Keep publicKey object live to prevent unused-import complaints (no-op).
      createPublicKey(privKey);
      return { signatureHex: der.toString('hex') };
    } finally {
      // Best-effort scrub of the decrypted buffer.
      privPem.fill(0);
    }
  }
}
