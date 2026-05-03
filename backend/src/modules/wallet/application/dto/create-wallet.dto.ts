/**
 * DTO input for CreateWalletUseCase.
 */
import type { NetworkKind } from '../../domain/value-objects/network.js';

export interface CreateWalletDto {
  readonly ownerRef: string;
  readonly mode?: 'non_custodial' | 'custodial';
  readonly supportedNetworks: readonly NetworkKind[];
  /** Opaque KMS/custody handle for custodial mode. */
  readonly custodyKeyRef?: string | null;
  readonly label?: string | null;
  /** Optional BIP-32 extended PUBLIC key for non-custodial address derivation. */
  readonly xpub?: string | null;
}

export interface CreateWalletResultDto {
  readonly id: string;
  readonly ownerRef: string;
  readonly mode: 'non_custodial' | 'custodial';
  readonly supportedNetworks: readonly NetworkKind[];
  readonly status: 'active' | 'archived';
  readonly createdAt: string;
}
