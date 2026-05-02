/** ResourceReservation -> DTO mapping. Pure. */
import type { ResourceReservation } from '../../domain/entities/resource-reservation.entity.js';
import {
  RESOURCE_RESERVATION_DISCLAIMER,
  type ResourceReservationDto,
} from '../dto/resource-reservation.dto.js';

export const ResourceReservationMapper = {
  toDto(r: ResourceReservation): ResourceReservationDto {
    return {
      id: r.id,
      namespace: r.namespace.toString(),
      sessionId: r.sessionId,
      amount: r.amount.toNumber(),
      status: r.status.toString(),
      createdAt: r.createdAt.toISOString(),
      releasedAt: r.releasedAt ? r.releasedAt.toISOString() : null,
      expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
      disclaimer: RESOURCE_RESERVATION_DISCLAIMER,
    };
  },
} as const;
