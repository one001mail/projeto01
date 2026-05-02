/** Input DTOs for resource-reservations use cases. */
export interface ReserveInputDto {
  readonly namespace: string;
  readonly sessionId: string;
  readonly amount: number;
  readonly ttlSeconds?: number | null;
}

export interface ReleaseInputDto {
  readonly id: string;
}

export interface GetReservationStatusInputDto {
  readonly id: string;
}

export interface ReconcileReservationsInputDto {
  readonly namespace?: string | undefined;
}
