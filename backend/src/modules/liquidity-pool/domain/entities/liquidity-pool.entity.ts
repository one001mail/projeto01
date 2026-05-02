/**
 * Liquidity Pool entity — SANDBOX ONLY.
 *
 * Models MOCK resource allocation. No real liquidity, no spendable asset
 * accounting, no wallet balances. Amounts are abstract integer "slots".
 */
import {
  type DomainEventEnvelope,
  makeDomainEvent,
} from '../../../../shared/domain/domain-event.js';

export interface LiquidityPoolProps {
  readonly id: string;
  readonly namespace: string;
  total: number;
  reserved: number;
  events: DomainEventEnvelope[];
}

export class LiquidityPool {
  private constructor(private props: LiquidityPoolProps) {}

  static create(input: { id: string; namespace: string; total: number }): LiquidityPool {
    if (!Number.isInteger(input.total) || input.total < 0) {
      throw new Error('total must be non-negative integer');
    }
    return new LiquidityPool({
      id: input.id,
      namespace: input.namespace,
      total: input.total,
      reserved: 0,
      events: [],
    });
  }

  reserve(amount: number, reservationId: string): DomainEventEnvelope {
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error('amount must be positive integer');
    const available = this.props.total - this.props.reserved;
    if (amount > available) throw new Error('insufficient mock liquidity');
    this.props.reserved += amount;
    const ev = makeDomainEvent({
      eventName: 'liquidity-pool.liquidity-reserved',
      aggregateId: this.props.id,
      payload: {
        poolId: this.props.id,
        reservationId,
        amount,
        namespace: this.props.namespace,
        mock: true,
      },
    });
    this.props.events.push(ev);
    return ev;
  }

  release(amount: number, reservationId: string): DomainEventEnvelope {
    if (amount > this.props.reserved) throw new Error('release exceeds reserved');
    this.props.reserved -= amount;
    const ev = makeDomainEvent({
      eventName: 'liquidity-pool.liquidity-released',
      aggregateId: this.props.id,
      payload: {
        poolId: this.props.id,
        reservationId,
        amount,
        namespace: this.props.namespace,
        mock: true,
      },
    });
    this.props.events.push(ev);
    return ev;
  }

  pullEvents(): readonly DomainEventEnvelope[] {
    const out = this.props.events;
    this.props.events = [];
    return out;
  }

  get id(): string {
    return this.props.id;
  }
  get namespace(): string {
    return this.props.namespace;
  }
  get total(): number {
    return this.props.total;
  }
  get reserved(): number {
    return this.props.reserved;
  }
  get available(): number {
    return this.props.total - this.props.reserved;
  }
}
