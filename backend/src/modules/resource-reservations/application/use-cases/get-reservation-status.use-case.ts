import type { Clock } from '../../../../shared/application/ports/clock.port.js';
/**
 * Get Reservation Status use case.
 */
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { ResourceReservationRepository } from '../../domain/repositories/resource-reservation.repository.js';
import type { GetReservationStatusInputDto } from '../dto/reserve-input.dto.js';
import type { ResourceReservationDto } from '../dto/resource-reservation.dto.js';
import { ResourceReservationMapper } from '../mappers/resource-reservation.mapper.js';

export type GetReservationStatusError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'NOT_FOUND'; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class GetReservationStatusUseCase {
  constructor(
    private readonly repo: ResourceReservationRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: GetReservationStatusInputDto,
  ): Promise<Ok<ResourceReservationDto> | Err<GetReservationStatusError>> {
    if (!UUID_RE.test(input.id)) {
      return err({ kind: 'INVALID_INPUT', message: 'id must be a uuid' });
    }
    const found = await this.repo.findById(input.id);
    if (!found) {
      return err({ kind: 'NOT_FOUND', message: `reservation '${input.id}' not found` });
    }
    found.refreshStatus(this.clock.now());
    return ok(ResourceReservationMapper.toDto(found));
  }
}
