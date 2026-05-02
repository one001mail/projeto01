/** Domain-level errors for the resource-reservations module. */
export class ReservationNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`ResourceReservation '${id}' not found`);
    this.name = 'ReservationNotFoundError';
  }
}

export class InsufficientAllocationError extends Error {
  constructor(
    public readonly namespace: string,
    public readonly requested: number,
  ) {
    super(`Insufficient simulated allocation in namespace '${namespace}' for amount ${requested}`);
    this.name = 'InsufficientAllocationError';
  }
}

export class ReservationInvalidStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReservationInvalidStateError';
  }
}
