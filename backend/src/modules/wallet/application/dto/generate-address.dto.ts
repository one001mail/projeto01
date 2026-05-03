/**
 * DTO input for GenerateAddressUseCase.
 */
import type { NetworkKind } from '../../domain/value-objects/network.js';

export interface GenerateAddressDto {
  readonly walletId: string;
  readonly network: NetworkKind;
  readonly asset?: string | null;
}

export interface GenerateAddressResultDto {
  readonly id: string;
  readonly walletId: string;
  readonly network: NetworkKind;
  readonly asset: string;
  readonly address: string;
  readonly addressIndex: number;
  readonly derivationPath: string | null;
  readonly createdAt: string;
}
