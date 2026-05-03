import type { WalletAddress } from '../../domain/entities/wallet-address.entity.js';
import type { Wallet } from '../../domain/entities/wallet.entity.js';
import type { NetworkKind } from '../../domain/value-objects/network.js';
import type { CreateWalletResultDto } from '../dto/create-wallet.dto.js';
import type { WalletMetadataDto } from '../dto/wallet-metadata.dto.js';
import { toWalletAddressDto } from './wallet-address.mapper.js';

export function toCreateWalletResultDto(wallet: Wallet): CreateWalletResultDto {
  return {
    id: wallet.id,
    ownerRef: wallet.ownerRef,
    mode: wallet.mode,
    supportedNetworks: wallet.supportedNetworks.map((n) => n.kind) as readonly NetworkKind[],
    status: wallet.status,
    createdAt: wallet.createdAt.toISOString(),
  };
}

export function toWalletMetadataDto(
  wallet: Wallet,
  addresses: readonly WalletAddress[],
): WalletMetadataDto {
  return {
    id: wallet.id,
    ownerRef: wallet.ownerRef,
    mode: wallet.mode,
    supportedNetworks: wallet.supportedNetworks.map((n) => n.kind) as readonly NetworkKind[],
    status: wallet.status,
    label: wallet.label,
    addresses: addresses.map(toWalletAddressDto),
    createdAt: wallet.createdAt.toISOString(),
    updatedAt: wallet.updatedAt.toISOString(),
  };
}
