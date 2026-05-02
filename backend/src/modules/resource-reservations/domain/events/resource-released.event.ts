/** Domain event emitted when a reservation is released. */
export const RESOURCE_RELEASED_EVENT = 'resource-reservations.released' as const;
export type ResourceReleasedEventName = typeof RESOURCE_RELEASED_EVENT;

export interface ResourceReleasedPayload {
  readonly id: string;
  readonly namespace: string;
  readonly releasedAt: string;
}
