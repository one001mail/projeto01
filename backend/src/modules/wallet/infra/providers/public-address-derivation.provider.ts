/**
 * DefaultPublicAddressDerivationProvider.
 *
 * Concrete implementation of the `PublicAddressDeriverPort` used by
 * `GenerateAddressUseCase`. Decides which backing source to use:
 *
 *   - If a custodyKeyRef is present AND a KeyManagementProvider is wired,
 *     delegate derivation to the KMS (private keys stay inside KMS).
 *   - Otherwise generate a non-custodial random public key locally. The
 *     corresponding private material is IMMEDIATELY discarded — this
 *     module intentionally never keeps it.
 *
 * DEVELOPMENT CAVEAT: the non-custodial path uses the same pseudo-address
 * derivation as `LocalEncryptedKeyManagementProvider`. Production
 * deployments MUST replace this with a proper BIP-32/44/84 + keccak256 /
 * bech32 pipeline (e.g. @scure/bip32, ethers.js, bitcoinjs-lib) where
 * derivation happens from a customer-supplied xpub.
 */
import { createHash, generateKeyPairSync } from 'node:crypto';
import type { NetworkFamily, NetworkKind } from '../../domain/value-objects/network.js';
import type { KeyManagementProvider } from './key-management.provider.js';

export interface PublicAddressDerivationOptions {
  readonly keyManagement: KeyManagementProvider | null;
  readonly mainnetEnabled: boolean;
}

export interface DeriveNextInput {
  readonly walletId: string;
  readonly network: NetworkKind;
  readonly family: NetworkFamily;
  readonly addressIndex: number;
  readonly custodyKeyRef: string | null;
}

function extractSec1(pubDer: Buffer): Buffer {
  for (let i = 0; i < pubDer.length - 65; i++) {
    if (pubDer[i] === 0x04) {
      const candidate = pubDer.subarray(i, i + 65);
      if (candidate.length === 65 && candidate[0] === 0x04) return Buffer.from(candidate);
    }
  }
  throw new Error('Failed to extract SEC1 public key');
}

function compress(sec1: Buffer): Buffer {
  const x = sec1.subarray(1, 33);
  const y = sec1.subarray(33, 65);
  const lastByte = y[y.length - 1] ?? 0;
  const prefix = (lastByte & 1) === 0 ? 0x02 : 0x03;
  return Buffer.concat([Buffer.from([prefix]), x]);
}

function pseudoEthereumAddress(compressedPub: Buffer, chainKind: NetworkKind): string {
  const hash = createHash('sha3-256').update(compressedPub.subarray(1)).digest();
  // chainKind is kept in the mix to differentiate sepolia vs mainnet at dev time.
  const salted = createHash('sha256').update(hash).update(chainKind).digest();
  return `0x${salted.subarray(-20).toString('hex')}`;
}

function pseudoBitcoinAddress(compressedPub: Buffer, network: NetworkKind): string {
  const hash = createHash('sha256').update(compressedPub).digest().toString('hex');
  const prefix = network === 'bitcoin-mainnet' ? 'bc1q' : 'tb1q';
  return `${prefix}${hash.slice(0, 39)}`;
}

export class DefaultPublicAddressDerivationProvider {
  constructor(private readonly opts: PublicAddressDerivationOptions) {}

  async deriveNext(input: DeriveNextInput): Promise<{ address: string; chainId: number | null }> {
    if (input.custodyKeyRef && this.opts.keyManagement) {
      const mat = await this.opts.keyManagement.derivePublic({
        walletId: input.walletId,
        custodyKeyRef: input.custodyKeyRef,
        family: input.family,
        addressIndex: input.addressIndex,
      });
      return { address: mat.address, chainId: chainIdFor(input.network) };
    }

    // Non-custodial path: generate a throwaway keypair, publish address only.
    const { publicKey, privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'secp256k1',
    });
    // privateKey is intentionally discarded; the backend never retains it.
    void privateKey;
    const pubDer = publicKey.export({ format: 'der', type: 'spki' }) as Buffer;
    const compressed = compress(extractSec1(pubDer));
    const address =
      input.family === 'ethereum'
        ? pseudoEthereumAddress(compressed, input.network)
        : pseudoBitcoinAddress(compressed, input.network);
    return { address, chainId: chainIdFor(input.network) };
  }
}

function chainIdFor(network: NetworkKind): number | null {
  switch (network) {
    case 'ethereum-sepolia':
      return 11155111;
    case 'ethereum-mainnet':
      return 1;
    case 'bitcoin-testnet':
    case 'bitcoin-mainnet':
      return null;
  }
}
