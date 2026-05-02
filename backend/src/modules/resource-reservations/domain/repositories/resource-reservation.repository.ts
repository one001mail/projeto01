/**
 * ResourceReservationRepository PORT.
 */
import type { ResourceReservation } from '../entities/resource-reservation.entity.js';

export interface ResourceReservationRepository {
  save(reservation: ResourceReservation): Promise<void>;
  update(reservation: ResourceReservation): Promise<void>;
  findById(id: string): Promise<ResourceReservation | null>;
  /** Sum of `amount` for `status = 'reserved'` in a namespace. */
  sumReservedAmount(namespace: string): Promise<number>;
  listExpiredReserved(now: Date, limit: number): Promise<readonly ResourceReservation[]>;
}
