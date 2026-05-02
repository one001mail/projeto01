/** Domain event emitted when a reserve attempt fails (insufficient quota, etc). */
export const RESOURCE_RESERVATION_FAILED_EVENT = 'resource-reservations.failed' as const;
export type ResourceReservationFailedEventName = typeof RESOURCE_RESERVATION_FAILED_EVENT;

export interface ResourceReservationFailedPayload {
  readonly namespace: string;
  readonly sessionId: string;
  readonly requestedAmount: number;
  readonly reason: 'INSUFFICIENT_ALLOCATION' | 'INVALID_INPUT' | 'COLLISION';
  readonly failedAt: string;
}
