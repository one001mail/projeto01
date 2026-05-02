import type { Clock } from '../../../../shared/application/ports/clock.port.js';
import type { UuidGenerator } from '../../../../shared/application/ports/uuid.port.js';
/**
 * Reconcile Reservations use case.
 *
 * Sweeps `reserved` rows whose TTL elapsed and transitions them to
 * `expired`. Emits one event per row through the outbox port. Idempotent
 * — second invocation returns 0 once the trail is clean.
 */
import { type Err, type Ok, ok } from '../../../../shared/types/result.js';
import { RESOURCE_RESERVATION_EXPIRED_EVENT } from '../../domain/events/resource-reservation-expired.event.js';
import type { ResourceReservationRepository } from '../../domain/repositories/resource-reservation.repository.js';
import type { ReconcileReservationsInputDto } from '../dto/reserve-input.dto.js';
import type { OutboxEventSaver } from './reserve-resource.use-case.js';

export interface ReconcileReservationsResultDto {
  readonly expired: number;
  readonly executedAt: string;
}

export type ReconcileReservationsError = { kind: 'INVALID_INPUT'; message: string };

export interface ReconcileReservationsDeps {
  readonly repo: ResourceReservationRepository;
  readonly clock: Clock;
  readonly uuid: UuidGenerator;
  readonly batchSize?: number;
  readonly outbox?: OutboxEventSaver;
}

const DEFAULT_BATCH = 100;

export class ReconcileReservationsUseCase {
  constructor(private readonly deps: ReconcileReservationsDeps) {}

  async execute(
    _input: ReconcileReservationsInputDto = {},
  ): Promise<Ok<ReconcileReservationsResultDto> | Err<ReconcileReservationsError>> {
    const now = this.deps.clock.now();
    const limit = this.deps.batchSize ?? DEFAULT_BATCH;
    const expiredCandidates = await this.deps.repo.listExpiredReserved(now, limit);

    let count = 0;
    for (const r of expiredCandidates) {
      r.expire(now);
      await this.deps.repo.update(r);
      count += 1;
      if (this.deps.outbox) {
        try {
          await this.deps.outbox.save({
            id: this.deps.uuid.v4(),
            name: RESOURCE_RESERVATION_EXPIRED_EVENT,
            occurredAt: now.toISOString(),
            payload: {
              id: r.id,
              namespace: r.namespace.toString(),
              expiredAt: now.toISOString(),
            },
            aggregateId: r.id,
          });
        } catch {
          // best-effort
        }
      }
    }

    return ok({ expired: count, executedAt: now.toISOString() });
  }
}
