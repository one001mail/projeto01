/**
 * Scheduled Payment entity — SANDBOX-ONLY.
 *
 * Represents a MOCK scheduled educational event. No real payout, no
 * payment broadcast, no wallet integration, no funds transfer.
 */
import {
  type DomainEventEnvelope,
  makeDomainEvent,
} from '../../../../shared/domain/domain-event.js';

export type ScheduledPaymentStatus = 'scheduled' | 'released' | 'failed';

export interface ScheduledPaymentProps {
  readonly id: string;
  readonly mockSessionId: string;
  readonly amount: number;
  readonly scheduledAt: Date;
  readonly delaySeconds: number;
  readonly priority: number;
  status: ScheduledPaymentStatus;
  events: DomainEventEnvelope[];
}

export class ScheduledPayment {
  private constructor(private props: ScheduledPaymentProps) {}

  static schedule(input: {
    id: string;
    mockSessionId: string;
    amount: number;
    delaySeconds: number;
    priority?: number;
    now?: Date;
  }): ScheduledPayment {
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new Error('amount must be positive integer');
    }
    if (!Number.isInteger(input.delaySeconds) || input.delaySeconds < 0) {
      throw new Error('delaySeconds must be non-negative integer');
    }
    const now = input.now ?? new Date();
    const scheduledAt = new Date(now.getTime() + input.delaySeconds * 1000);
    const p = new ScheduledPayment({
      id: input.id,
      mockSessionId: input.mockSessionId,
      amount: input.amount,
      scheduledAt,
      delaySeconds: input.delaySeconds,
      priority: input.priority ?? 0,
      status: 'scheduled',
      events: [],
    });
    p.props.events.push(
      makeDomainEvent({
        eventName: 'payment-scheduler.payment-scheduled',
        aggregateId: p.id,
        payload: {
          paymentId: p.id,
          mockSessionId: p.mockSessionId,
          amount: p.amount,
          scheduledAt: scheduledAt.toISOString(),
          mock: true,
          notAPayout: true,
        },
      }),
    );
    return p;
  }

  release(now: Date = new Date()): void {
    if (this.props.status !== 'scheduled') return;
    if (now.getTime() < this.props.scheduledAt.getTime()) {
      throw new Error('payment not due yet');
    }
    this.props.status = 'released';
    this.props.events.push(
      makeDomainEvent({
        eventName: 'payment-scheduler.payment-released',
        aggregateId: this.id,
        payload: { paymentId: this.id, mockSessionId: this.mockSessionId, mock: true },
      }),
    );
  }

  fail(reason: string): void {
    this.props.status = 'failed';
    this.props.events.push(
      makeDomainEvent({
        eventName: 'payment-scheduler.payment-failed',
        aggregateId: this.id,
        payload: { paymentId: this.id, reason, mock: true },
      }),
    );
  }

  pullEvents(): readonly DomainEventEnvelope[] {
    const out = this.props.events;
    this.props.events = [];
    return out;
  }

  get id(): string {
    return this.props.id;
  }
  get status(): ScheduledPaymentStatus {
    return this.props.status;
  }
  get mockSessionId(): string {
    return this.props.mockSessionId;
  }
  get amount(): number {
    return this.props.amount;
  }
  get scheduledAt(): Date {
    return this.props.scheduledAt;
  }
}
