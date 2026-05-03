/**
 * Safe public snapshot of a wallet + its addresses.
 *
 * NEVER contains private keys, seed phrases, encrypted secrets, or
 * signing material. Audited by the `SecretRedactionService` on the HTTP
 * boundary as a defense-in-depth measure.
 */
import type { NetworkKind } from '../../domain/value-objects/network.js';

export interface WalletAddressMetadataDto {
  readonly id: string;
  readonly network: NetworkKind;
  readonly asset: string;
  readonly address: string;
  readonly derivationPath: string | null;
  readonly addressIndex: number;
  readonly status: 'active' | 'revoked';
  readonly createdAt: string;
}

export interface WalletMetadataDto {
  readonly id: string;
  readonly ownerRef: string;
  readonly mode: 'non_custodial' | 'custodial';
  readonly supportedNetworks: readonly NetworkKind[];
  readonly status: 'active' | 'archived';
  readonly label: string | null;
  readonly addresses: readonly WalletAddressMetadataDto[];
  readonly createdAt: string;
  readonly updatedAt: string;
}
