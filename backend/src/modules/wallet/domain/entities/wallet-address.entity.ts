/**
 * WalletAddress entity.
 *
 * A public receiving address bound to a wallet + network. Public data only;
 * private keys, seeds, xprivs are NEVER stored on this entity.
 */
import { AggregateRoot } from '../../../../shared/domain/aggregate-root.js';
import { makeDomainEvent } from '../../../../shared/domain/domain-event.js';
import { Address } from '../value-objects/address.js';
import { AssetSymbol } from '../value-objects/asset-symbol.js';
import { ChainId } from '../value-objects/chain-id.js';
import { DerivationPath } from '../value-objects/derivation-path.js';
import { Network } from '../value-objects/network.js';
import { WalletId } from '../value-objects/wallet-id.js';

export type WalletAddressStatus = 'active' | 'revoked';

export interface WalletAddressProps {
  readonly id: string;
  readonly walletId: WalletId;
  readonly network: Network;
  readonly chainId: ChainId | null;
  readonly asset: AssetSymbol;
  readonly address: Address;
  readonly derivationPath: DerivationPath | null;
  readonly addressIndex: number;
  readonly status: WalletAddressStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WalletAddressCreateInput {
  readonly id: string;
  readonly walletId: string;
  readonly network: string;
  readonly chainId?: number | null;
  readonly asset: string;
  readonly address: string;
  readonly derivationPath?: string | null;
  readonly addressIndex: number;
  readonly now?: Date;
}

export class WalletAddress extends AggregateRoot {
  private props: WalletAddressProps;

  private constructor(props: WalletAddressProps) {
    super(props.id);
    this.props = props;
  }

  static create(input: WalletAddressCreateInput): WalletAddress {
    if (!input.id) throw new Error('WalletAddress.id is required');
    const walletId = WalletId.of(input.walletId);
    const network = Network.of(input.network);
    const asset = AssetSymbol.of(input.asset);
    const address = Address.of(input.address, network.family);
    const chainId = input.chainId != null ? ChainId.of(input.chainId) : null;
    const derivationPath = input.derivationPath ? DerivationPath.of(input.derivationPath) : null;

    if (!Number.isInteger(input.addressIndex) || input.addressIndex < 0) {
      throw new Error('WalletAddress.addressIndex must be a non-negative integer');
    }

    const now = input.now ?? new Date();
    const entity = new WalletAddress({
      id: input.id,
      walletId,
      network,
      chainId,
      asset,
      address,
      derivationPath,
      addressIndex: input.addressIndex,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    entity.recordEvent(
      makeDomainEvent({
        eventName: 'wallet.address-generated',
        aggregateId: input.id,
        payload: {
          walletId: walletId.value,
          network: network.kind,
          asset: asset.value,
          address: address.value,
          addressIndex: input.addressIndex,
        },
      }),
    );
    return entity;
  }

  static restore(props: WalletAddressProps): WalletAddress {
    return new WalletAddress(props);
  }

  revoke(now: Date = new Date()): void {
    if (this.props.status === 'revoked') return;
    this.props = { ...this.props, status: 'revoked', updatedAt: now };
  }

  get walletId(): string {
    return this.props.walletId.value;
  }
  get network(): Network {
    return this.props.network;
  }
  get asset(): AssetSymbol {
    return this.props.asset;
  }
  get address(): Address {
    return this.props.address;
  }
  get chainId(): ChainId | null {
    return this.props.chainId;
  }
  get derivationPath(): DerivationPath | null {
    return this.props.derivationPath;
  }
  get addressIndex(): number {
    return this.props.addressIndex;
  }
  get status(): WalletAddressStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  snapshot(): WalletAddressProps {
    return { ...this.props };
  }
}
