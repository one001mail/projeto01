import type { Clock } from '../../../../shared/application/ports/clock.port.js';
import type { UuidGenerator } from '../../../../shared/application/ports/uuid.port.js';
/**
 * Reserve Resource use case.
 *
 * Validates input, checks sufficiency against the per-namespace cap
 * configured by the caller, persists a `reserved` aggregate, and emits a
 * domain event through the outbox port. NEVER touches real funds.
 */
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import { ResourceReservation } from '../../domain/entities/resource-reservation.entity.js';
import { RESOURCE_RESERVATION_FAILED_EVENT } from '../../domain/events/resource-reservation-failed.event.js';
import { RESOURCE_RESERVED_EVENT } from '../../domain/events/resource-reserved.event.js';
import { ReserveSufficiencyPolicy } from '../../domain/policies/reserve-sufficiency.policy.js';
import type { ResourceReservationRepository } from '../../domain/repositories/resource-reservation.repository.js';
import { AllocationId } from '../../domain/value-objects/allocation-id.vo.js';
import { ReservationAmount } from '../../domain/value-objects/reservation-amount.vo.js';
import type { ReserveInputDto } from '../dto/reserve-input.dto.js';
import type { ResourceReservationDto } from '../dto/resource-reservation.dto.js';
import { ResourceReservationMapper } from '../mappers/resource-reservation.mapper.js';

export type ReserveResourceError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'INSUFFICIENT_ALLOCATION'; message: string }
  | { kind: 'COLLISION'; message: string };

export interface OutboxEventSaver {
  save(event: {
    id: string;
    name: string;
    occurredAt: string;
    payload: unknown;
    aggregateId?: string;
  }): Promise<string>;
}

/** Per-namespace caps; pure config injected by the module composition root. */
export type AllocationCaps = Readonly<Record<string, number>>;

export interface ReserveResourceDeps {
  readonly repo: ResourceReservationRepository;
  readonly clock: Clock;
  readonly uuid: UuidGenerator;
  readonly caps: AllocationCaps;
  readonly defaultCap: number;
  readonly outbox?: OutboxEventSaver;
}

const MAX_TTL_SECONDS = 60 * 60 * 24 * 7;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ReserveResourceUseCase {
  constructor(private readonly deps: ReserveResourceDeps) {}

  async execute(
    input: ReserveInputDto,
  ): Promise<Ok<ResourceReservationDto> | Err<ReserveResourceError>> {
    let namespace: AllocationId;
    try {
      namespace = AllocationId.fromString(input.namespace);
    } catch (e) {
      return err({
        kind: 'INVALID_INPUT',
        message: e instanceof Error ? e.message : 'invalid namespace',
      });
    }
    if (!UUID_RE.test(input.sessionId)) {
      return err({ kind: 'INVALID_INPUT', message: 'sessionId must be a uuid' });
    }
    let amount: ReservationAmount;
    try {
      amount = ReservationAmount.of(input.amount);
    } catch (e) {
      return err({
        kind: 'INVALID_INPUT',
        message: e instanceof Error ? e.message : 'invalid amount',
      });
    }
    if (amount.isZero()) {
      return err({ kind: 'INVALID_INPUT', message: 'amount must be > 0' });
    }

    let expiresAt: Date | null = null;
    if (typeof input.ttlSeconds === 'number') {
      if (
        !Number.isFinite(input.ttlSeconds) ||
        !Number.isInteger(input.ttlSeconds) ||
        input.ttlSeconds < 1 ||
        input.ttlSeconds > MAX_TTL_SECONDS
      ) {
        return err({
          kind: 'INVALID_INPUT',
          message: `ttlSeconds must be 1..${MAX_TTL_SECONDS}`,
        });
      }
      expiresAt = new Date(this.deps.clock.now().getTime() + input.ttlSeconds * 1000);
    }

    const cap = ReservationAmount.of(this.deps.caps[namespace.toString()] ?? this.deps.defaultCap);
    const reservedSum = ReservationAmount.of(
      await this.deps.repo.sumReservedAmount(namespace.toString()),
    );
    const sufficient = ReserveSufficiencyPolicy.isSufficient({
      cap,
      alreadyReserved: reservedSum,
      requested: amount,
    });
    if (!sufficient) {
      // Best-effort failure event — caller still gets a typed error.
      if (this.deps.outbox) {
        try {
          await this.deps.outbox.save({
            id: this.deps.uuid.v4(),
            name: RESOURCE_RESERVATION_FAILED_EVENT,
            occurredAt: this.deps.clock.now().toISOString(),
            payload: {
              namespace: namespace.toString(),
              sessionId: input.sessionId,
              requestedAmount: amount.toNumber(),
              reason: 'INSUFFICIENT_ALLOCATION',
              failedAt: this.deps.clock.now().toISOString(),
            },
          });
        } catch {
          // outbox best-effort — reporting failure must never bubble to caller.
        }
      }
      return err({
        kind: 'INSUFFICIENT_ALLOCATION',
        message: `cap ${cap.toNumber()} reached for namespace '${namespace.toString()}'`,
      });
    }

    const id = this.deps.uuid.v4();
    const now = this.deps.clock.now();
    const aggregate = ResourceReservation.reserve({
      id,
      namespace,
      sessionId: input.sessionId,
      amount,
      createdAt: now,
      expiresAt,
    });
    await this.deps.repo.save(aggregate);

    if (this.deps.outbox) {
      try {
        await this.deps.outbox.save({
          id: this.deps.uuid.v4(),
          name: RESOURCE_RESERVED_EVENT,
          occurredAt: now.toISOString(),
          payload: {
            id,
            namespace: namespace.toString(),
            sessionId: input.sessionId,
            amount: amount.toNumber(),
            createdAt: now.toISOString(),
            expiresAt: expiresAt ? expiresAt.toISOString() : null,
          },
          aggregateId: id,
        });
      } catch {
        // best-effort
      }
    }
    return ok(ResourceReservationMapper.toDto(aggregate));
  }
}
