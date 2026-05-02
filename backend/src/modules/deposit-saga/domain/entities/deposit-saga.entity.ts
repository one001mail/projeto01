/**
 * Deposit Saga entity — SANDBOX ONLY.
 *
 * Orchestrates MOCK educational state transitions between:
 *   STARTED -> ACCEPTED -> ROUTED -> COMPLETED
 *                                 \-> FAILED (compensated)
 *
 * No real deposits, no custody, no payment routing, no money movement.
 */
import {
  type DomainEventEnvelope,
  makeDomainEvent,
} from '../../../../shared/domain/domain-event.js';

export type SagaStatus = 'STARTED' | 'ACCEPTED' | 'ROUTED' | 'COMPLETED' | 'FAILED';

const ALLOWED_TRANSITIONS: Record<SagaStatus, readonly SagaStatus[]> = {
  STARTED: ['ACCEPTED', 'FAILED'],
  ACCEPTED: ['ROUTED', 'FAILED'],
  ROUTED: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: [],
};

export interface DepositSagaProps {
  readonly id: string;
  readonly mockSessionId: string;
  status: SagaStatus;
  readonly createdAt: Date;
  events: DomainEventEnvelope[];
}

export class DepositSaga {
  private constructor(private props: DepositSagaProps) {}

  static start(input: { id: string; mockSessionId: string; now?: Date }): DepositSaga {
    const saga = new DepositSaga({
      id: input.id,
      mockSessionId: input.mockSessionId,
      status: 'STARTED',
      createdAt: input.now ?? new Date(),
      events: [],
    });
    saga.record('deposit-saga.started', { sagaId: input.id, mockSessionId: input.mockSessionId });
    return saga;
  }

  advance(target: SagaStatus): void {
    const allowed = ALLOWED_TRANSITIONS[this.props.status] ?? [];
    if (!allowed.includes(target)) {
      throw new Error(`Invalid saga transition: ${this.props.status} -> ${target}`);
    }
    this.props.status = target;
    if (target === 'ACCEPTED') this.record('deposit-saga.accepted', { sagaId: this.props.id });
    if (target === 'ROUTED') this.record('deposit-saga.routed', { sagaId: this.props.id });
    if (target === 'COMPLETED') this.record('deposit-saga.completed', { sagaId: this.props.id });
    if (target === 'FAILED') this.record('deposit-saga.failed', { sagaId: this.props.id });
  }

  compensate(reason: string): void {
    if (this.props.status === 'COMPLETED' || this.props.status === 'FAILED') return;
    this.props.status = 'FAILED';
    this.record('deposit-saga.failed', { sagaId: this.props.id, reason });
  }

  pullEvents(): readonly DomainEventEnvelope[] {
    const out = this.props.events;
    this.props.events = [];
    return out;
  }

  private record(name: string, p: Record<string, unknown>): void {
    this.props.events.push(
      makeDomainEvent({
        eventName: name,
        aggregateId: this.props.id,
        payload: { ...p, mock: true },
      }),
    );
  }

  get id(): string {
    return this.props.id;
  }
  get status(): SagaStatus {
    return this.props.status;
  }
  get mockSessionId(): string {
    return this.props.mockSessionId;
  }
}
