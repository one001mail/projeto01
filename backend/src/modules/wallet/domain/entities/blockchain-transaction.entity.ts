/**
 * BlockchainTransaction entity.
 *
 * Records the lifecycle of an on-chain transaction prepared and/or
 * broadcast by this wallet module. The unsigned payload is stored as an
 * opaque hex blob; the signed raw tx is stored only as a reference (we
 * never persist private keys, signing keys, or signing state).
 */
import { AggregateRoot } from '../../../../shared/domain/aggregate-root.js';
import { makeDomainEvent } from '../../../../shared/domain/domain-event.js';
import { Address } from '../value-objects/address.js';
import { AssetSymbol } from '../value-objects/asset-symbol.js';
import { Network } from '../value-objects/network.js';
import { TransactionHash } from '../value-objects/transaction-hash.js';
import { WalletId } from '../value-objects/wallet-id.js';

export type BlockchainTransactionStatus =
  | 'prepared'
  | 'broadcasting'
  | 'broadcasted'
  | 'confirmed'
  | 'failed';

export interface FeeData {
  readonly feeAsset: string;
  readonly feeAmount: string; // decimal string, minor units
  readonly gasLimit?: string | null;
  readonly gasPrice?: string | null;
  readonly maxFeePerGas?: string | null;
  readonly maxPriorityFeePerGas?: string | null;
}

export interface BlockchainTransactionProps {
  readonly id: string;
  readonly walletId: WalletId;
  readonly network: Network;
  readonly fromAddress: Address;
  readonly toAddress: Address;
  readonly asset: AssetSymbol;
  readonly amount: string; // decimal string, minor units
  readonly fee: FeeData;
  readonly status: BlockchainTransactionStatus;
  readonly txHash: TransactionHash | null;
  readonly unsignedPayload: string | null; // hex
  readonly rawSignedRef: string | null; // opaque reference (e.g. digest)
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PrepareInput {
  readonly id: string;
  readonly walletId: string;
  readonly network: string;
  readonly fromAddress: string;
  readonly toAddress: string;
  readonly asset: string;
  readonly amount: string;
  readonly fee: FeeData;
  readonly unsignedPayload: string;
  readonly now?: Date;
}

export class BlockchainTransaction extends AggregateRoot {
  private props: BlockchainTransactionProps;

  private constructor(props: BlockchainTransactionProps) {
    super(props.id);
    this.props = props;
  }

  static prepare(input: PrepareInput): BlockchainTransaction {
    if (!input.id) throw new Error('BlockchainTransaction.id is required');
    const walletId = WalletId.of(input.walletId);
    const network = Network.of(input.network);
    const fromAddress = Address.of(input.fromAddress, network.family);
    const toAddress = Address.of(input.toAddress, network.family);
    const asset = AssetSymbol.of(input.asset);
    if (!/^[0-9]+$/.test(input.amount) || input.amount === '0') {
      throw new Error(
        'BlockchainTransaction.amount must be a positive integer string (minor units)',
      );
    }
    if (!/^[0-9a-fA-F]+$/.test(input.unsignedPayload) || input.unsignedPayload.length === 0) {
      throw new Error('BlockchainTransaction.unsignedPayload must be non-empty hex');
    }
    const now = input.now ?? new Date();
    const entity = new BlockchainTransaction({
      id: input.id,
      walletId,
      network,
      fromAddress,
      toAddress,
      asset,
      amount: input.amount,
      fee: input.fee,
      status: 'prepared',
      txHash: null,
      unsignedPayload: input.unsignedPayload,
      rawSignedRef: null,
      createdAt: now,
      updatedAt: now,
    });
    entity.recordEvent(
      makeDomainEvent({
        eventName: 'wallet.transaction-prepared',
        aggregateId: input.id,
        payload: {
          walletId: walletId.value,
          network: network.kind,
          asset: asset.value,
          amount: input.amount,
        },
      }),
    );
    return entity;
  }

  static restore(props: BlockchainTransactionProps): BlockchainTransaction {
    return new BlockchainTransaction(props);
  }

  markBroadcasting(rawSignedRef: string, now: Date = new Date()): void {
    if (this.props.status !== 'prepared') {
      throw new Error(`Cannot broadcast transaction in status '${this.props.status}'`);
    }
    this.props = { ...this.props, status: 'broadcasting', rawSignedRef, updatedAt: now };
  }

  markBroadcasted(txHash: string, now: Date = new Date()): void {
    const hash = TransactionHash.of(txHash, this.props.network.family);
    this.props = { ...this.props, status: 'broadcasted', txHash: hash, updatedAt: now };
    this.recordEvent(
      makeDomainEvent({
        eventName: 'wallet.transaction-broadcasted',
        aggregateId: this.props.id,
        payload: {
          walletId: this.props.walletId.value,
          network: this.props.network.kind,
          txHash: hash.value,
        },
      }),
    );
  }

  markFailed(now: Date = new Date()): void {
    this.props = { ...this.props, status: 'failed', updatedAt: now };
  }

  markConfirmed(now: Date = new Date()): void {
    this.props = { ...this.props, status: 'confirmed', updatedAt: now };
  }

  get walletId(): string {
    return this.props.walletId.value;
  }
  get network(): Network {
    return this.props.network;
  }
  get fromAddress(): Address {
    return this.props.fromAddress;
  }
  get toAddress(): Address {
    return this.props.toAddress;
  }
  get asset(): AssetSymbol {
    return this.props.asset;
  }
  get amount(): string {
    return this.props.amount;
  }
  get fee(): FeeData {
    return this.props.fee;
  }
  get status(): BlockchainTransactionStatus {
    return this.props.status;
  }
  get txHash(): TransactionHash | null {
    return this.props.txHash;
  }
  get unsignedPayload(): string | null {
    return this.props.unsignedPayload;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  snapshot(): BlockchainTransactionProps {
    return { ...this.props };
  }
}
