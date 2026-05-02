import type { Clock } from '../../../../shared/application/ports/clock.port.js';
import type { UuidGenerator } from '../../../../shared/application/ports/uuid.port.js';
/**
 * Release Resource use case.
 */
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import { RESOURCE_RELEASED_EVENT } from '../../domain/events/resource-released.event.js';
import type { ResourceReservationRepository } from '../../domain/repositories/resource-reservation.repository.js';
import type { ReleaseInputDto } from '../dto/reserve-input.dto.js';
import type { ResourceReservationDto } from '../dto/resource-reservation.dto.js';
import { ResourceReservationMapper } from '../mappers/resource-reservation.mapper.js';
import type { OutboxEventSaver } from './reserve-resource.use-case.js';

export type ReleaseResourceError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'NOT_FOUND'; message: string }
  | { kind: 'INVALID_STATE'; message: string };

export interface ReleaseResourceDeps {
  readonly repo: ResourceReservationRepository;
  readonly clock: Clock;
  readonly uuid: UuidGenerator;
  readonly outbox?: OutboxEventSaver;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ReleaseResourceUseCase {
  constructor(private readonly deps: ReleaseResourceDeps) {}

  async execute(
    input: ReleaseInputDto,
  ): Promise<Ok<ResourceReservationDto> | Err<ReleaseResourceError>> {
    if (!UUID_RE.test(input.id)) {
      return err({ kind: 'INVALID_INPUT', message: 'id must be a uuid' });
    }
    const found = await this.deps.repo.findById(input.id);
    if (!found) {
      return err({ kind: 'NOT_FOUND', message: `reservation '${input.id}' not found` });
    }
    const now = this.deps.clock.now();
    found.refreshStatus(now);
    if (!found.status.canRelease()) {
      return err({
        kind: 'INVALID_STATE',
        message: `cannot release from status '${found.status.toString()}'`,
      });
    }
    found.release(now);
    await this.deps.repo.update(found);

    if (this.deps.outbox) {
      try {
        await this.deps.outbox.save({
          id: this.deps.uuid.v4(),
          name: RESOURCE_RELEASED_EVENT,
          occurredAt: now.toISOString(),
          payload: {
            id: found.id,
            namespace: found.namespace.toString(),
            releasedAt: now.toISOString(),
          },
          aggregateId: found.id,
        });
      } catch {
        // best-effort
      }
    }
    return ok(ResourceReservationMapper.toDto(found));
  }
}
