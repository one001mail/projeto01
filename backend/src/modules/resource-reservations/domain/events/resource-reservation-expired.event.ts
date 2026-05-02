/** Domain event emitted when reconcile transitions a reservation to expired. */
export const RESOURCE_RESERVATION_EXPIRED_EVENT = 'resource-reservations.expired' as const;
export type ResourceReservationExpiredEventName = typeof RESOURCE_RESERVATION_EXPIRED_EVENT;

export interface ResourceReservationExpiredPayload {
  readonly id: string;
  readonly namespace: string;
  readonly expiredAt: string;
}
