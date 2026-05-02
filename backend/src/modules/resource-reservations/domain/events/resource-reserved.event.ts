/** Domain event emitted when a sandbox reservation is created. */
export const RESOURCE_RESERVED_EVENT = 'resource-reservations.reserved' as const;
export type ResourceReservedEventName = typeof RESOURCE_RESERVED_EVENT;

export interface ResourceReservedPayload {
  readonly id: string;
  readonly namespace: string;
  readonly sessionId: string;
  readonly amount: number;
  readonly createdAt: string;
  readonly expiresAt: string | null;
}
