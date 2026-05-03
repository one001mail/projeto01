import type { WalletAddress } from '../../domain/entities/wallet-address.entity.js';
import type { NetworkKind } from '../../domain/value-objects/network.js';
import type { GenerateAddressResultDto } from '../dto/generate-address.dto.js';
import type { WalletAddressMetadataDto } from '../dto/wallet-metadata.dto.js';

export function toWalletAddressDto(entity: WalletAddress): WalletAddressMetadataDto {
  return {
    id: entity.id,
    network: entity.network.kind as NetworkKind,
    asset: entity.asset.value,
    address: entity.address.value,
    derivationPath: entity.derivationPath?.value ?? null,
    addressIndex: entity.addressIndex,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
  };
}

export function toGenerateAddressResultDto(entity: WalletAddress): GenerateAddressResultDto {
  return {
    id: entity.id,
    walletId: entity.walletId,
    network: entity.network.kind as NetworkKind,
    asset: entity.asset.value,
    address: entity.address.value,
    addressIndex: entity.addressIndex,
    derivationPath: entity.derivationPath?.value ?? null,
    createdAt: entity.createdAt.toISOString(),
  };
}
