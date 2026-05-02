import { SANDBOX_RESERVATION_DISCLAIMER } from '../../domain/policies/sandbox-reservation.policy.js';

/** Public DTO for resource-reservations use cases. */
export interface ResourceReservationDto {
  readonly id: string;
  readonly namespace: string;
  readonly sessionId: string;
  readonly amount: number;
  readonly status: 'reserved' | 'released' | 'expired' | 'failed';
  readonly createdAt: string;
  readonly releasedAt: string | null;
  readonly expiresAt: string | null;
  readonly disclaimer: string;
}

export const RESOURCE_RESERVATION_DISCLAIMER = SANDBOX_RESERVATION_DISCLAIMER;
