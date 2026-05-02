/**
 * Address Token entity — SANDBOX-ONLY.
 *
 * Represents a mock, opaque identifier issued for a learning session.
 * This is NOT a wallet, NOT a blockchain address, NOT derived from a
 * seed, and CANNOT receive funds. It exists solely to illustrate how a
 * real system would mint disposable destination labels.
 */
import { AggregateRoot } from '../../../../shared/domain/aggregate-root.js';
import { makeDomainEvent } from '../../../../shared/domain/domain-event.js';
import { AddressExpiration } from '../value-objects/address-expiration.js';
import { AddressTokenId } from '../value-objects/address-token-id.js';
import { IssuanceContext } from '../value-objects/issuance-context.js';
import { Namespace } from '../value-objects/namespace.js';

export type AddressTokenStatus = 'active' | 'revoked' | 'expired';

export interface AddressTokenProps {
  readonly id: AddressTokenId;
  readonly namespace: Namespace;
  readonly token: string; // mock sbx_* token
  readonly issuance: IssuanceContext;
  readonly status: AddressTokenStatus;
  readonly expiration: AddressExpiration | null;
  readonly createdAt: Date;
}

export class AddressToken extends AggregateRoot {
  private constructor(private props: AddressTokenProps) {
    super(props.id.value);
  }

  static issue(input: {
    id: string;
    namespace: string;
    mockToken: string;
    correlationId?: string | null;
    expiresAt?: Date | null;
    now?: Date;
  }): AddressToken {
    const id = AddressTokenId.of(input.id);
    const namespace = Namespace.of(input.namespace);
    const issuance = IssuanceContext.of(namespace.value, input.correlationId ?? null);
    const expiration = input.expiresAt ? AddressExpiration.at(input.expiresAt) : null;
    const entity = new AddressToken({
      id,
      namespace,
      token: input.mockToken,
      issuance,
      status: 'active',
      expiration,
      createdAt: input.now ?? new Date(),
    });
    const correlationId = issuance.correlationId;
    entity.recordEvent(
      makeDomainEvent({
        eventName: 'address-generator.address-generated',
        aggregateId: id.value,
        ...(correlationId ? { correlationId } : {}),
        payload: {
          addressTokenId: id.value,
          namespace: namespace.value,
          mockSessionId: input.correlationId ?? null,
          mock: true,
          notAWallet: true,
        },
      }),
    );
    return entity;
  }

  static restore(props: AddressTokenProps): AddressToken {
    return new AddressToken(props);
  }

  revoke(): void {
    if (this.props.status !== 'active') return;
    this.props = { ...this.props, status: 'revoked' };
  }

  markExpired(): void {
    if (this.props.status === 'expired') return;
    this.props = { ...this.props, status: 'expired' };
    this.recordEvent(
      makeDomainEvent({
        eventName: 'address-generator.address-expired',
        aggregateId: this.props.id.value,
        payload: { addressTokenId: this.props.id.value, mock: true },
      }),
    );
  }

  get status(): AddressTokenStatus {
    return this.props.status;
  }
  get namespace(): string {
    return this.props.namespace.value;
  }
  get token(): string {
    return this.props.token;
  }
  get expiresAt(): string | null {
    return this.props.expiration?.iso ?? null;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): object {
    return {
      id: this.props.id.value,
      namespace: this.props.namespace.value,
      token: this.props.token,
      status: this.props.status,
      expiresAt: this.expiresAt,
      createdAt: this.props.createdAt.toISOString(),
      mock: true,
      notAWallet: true,
      notABlockchainAddress: true,
    };
  }
}
