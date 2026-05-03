/**
 * Wallet aggregate root.
 *
 * Represents an operational wallet record. Owns its addresses (managed
 * through WalletAddress entities referencing the wallet id) and is the
 * entry point for lifecycle transitions (created → active → archived).
 *
 * Invariants:
 *   - id is a UUID;
 *   - mode is either 'non_custodial' or 'custodial';
 *   - supported networks is a non-empty set;
 *   - a wallet NEVER carries private key material; the custodial mode
 *     records only a reference to an external KeyManagementProvider.
 */
import { AggregateRoot } from '../../../../shared/domain/aggregate-root.js';
import { makeDomainEvent } from '../../../../shared/domain/domain-event.js';
import type { NetworkKind } from '../value-objects/network.js';
import { Network } from '../value-objects/network.js';
import { WalletId } from '../value-objects/wallet-id.js';

export type WalletMode = 'non_custodial' | 'custodial';
export type WalletStatus = 'active' | 'archived';

export interface WalletProps {
  readonly id: WalletId;
  readonly ownerRef: string;
  readonly mode: WalletMode;
  readonly supportedNetworks: readonly Network[];
  readonly custodyKeyRef: string | null;
  readonly status: WalletStatus;
  readonly label: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WalletCreateInput {
  readonly id: string;
  readonly ownerRef: string;
  readonly mode: WalletMode;
  readonly supportedNetworks: readonly NetworkKind[];
  readonly custodyKeyRef?: string | null;
  readonly label?: string | null;
  readonly now?: Date;
}

export class Wallet extends AggregateRoot {
  private props: WalletProps;

  private constructor(props: WalletProps) {
    super(props.id.value);
    this.props = props;
  }

  static create(input: WalletCreateInput): Wallet {
    const id = WalletId.of(input.id);
    const owner = input.ownerRef.trim();
    if (owner.length === 0 || owner.length > 256) {
      throw new Error('Wallet.ownerRef must be 1..256 chars');
    }
    if (input.mode !== 'non_custodial' && input.mode !== 'custodial') {
      throw new Error("Wallet.mode must be 'non_custodial' or 'custodial'");
    }
    if (!input.supportedNetworks || input.supportedNetworks.length === 0) {
      throw new Error('Wallet.supportedNetworks must not be empty');
    }
    const networks = input.supportedNetworks.map((n) => Network.of(n));
    const custodyKeyRef = input.custodyKeyRef ?? null;
    if (input.mode === 'custodial' && (!custodyKeyRef || custodyKeyRef.length === 0)) {
      throw new Error('Custodial wallet requires a custodyKeyRef (opaque KMS handle)');
    }
    if (input.mode === 'non_custodial' && custodyKeyRef) {
      throw new Error('Non-custodial wallet must NOT carry a custodyKeyRef');
    }

    const now = input.now ?? new Date();
    const label = input.label?.trim() || null;
    if (label !== null && label.length > 100) {
      throw new Error('Wallet.label must be <= 100 chars');
    }

    const entity = new Wallet({
      id,
      ownerRef: owner,
      mode: input.mode,
      supportedNetworks: networks,
      custodyKeyRef,
      status: 'active',
      label,
      createdAt: now,
      updatedAt: now,
    });

    entity.recordEvent(
      makeDomainEvent({
        eventName: 'wallet.created',
        aggregateId: id.value,
        payload: {
          walletId: id.value,
          mode: input.mode,
          ownerRef: owner,
          supportedNetworks: networks.map((n) => n.kind),
        },
      }),
    );
    return entity;
  }

  static restore(props: WalletProps): Wallet {
    return new Wallet(props);
  }

  archive(now: Date = new Date()): void {
    if (this.props.status === 'archived') return;
    this.props = { ...this.props, status: 'archived', updatedAt: now };
  }

  supports(network: Network): boolean {
    return this.props.supportedNetworks.some((n) => n.kind === network.kind);
  }

  get mode(): WalletMode {
    return this.props.mode;
  }
  get ownerRef(): string {
    return this.props.ownerRef;
  }
  get status(): WalletStatus {
    return this.props.status;
  }
  get supportedNetworks(): readonly Network[] {
    return this.props.supportedNetworks;
  }
  get custodyKeyRef(): string | null {
    return this.props.custodyKeyRef;
  }
  get label(): string | null {
    return this.props.label;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  snapshot(): WalletProps {
    return { ...this.props };
  }
}
