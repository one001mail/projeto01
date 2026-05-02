/**
 * ReservationStatus value object.
 *
 * Lifecycle state: reserved, released, expired, failed. Pure VO with
 * controlled transitions.
 */
const VALUES = ['reserved', 'released', 'expired', 'failed'] as const;
export type ReservationStatusValue = (typeof VALUES)[number];

export class ReservationStatus {
  private constructor(private readonly v: ReservationStatusValue) {}

  static reserved(): ReservationStatus {
    return new ReservationStatus('reserved');
  }
  static released(): ReservationStatus {
    return new ReservationStatus('released');
  }
  static expired(): ReservationStatus {
    return new ReservationStatus('expired');
  }
  static failed(): ReservationStatus {
    return new ReservationStatus('failed');
  }
  static fromString(v: string): ReservationStatus {
    if (!(VALUES as readonly string[]).includes(v)) {
      throw new Error(`Invalid ReservationStatus '${v}'`);
    }
    return new ReservationStatus(v as ReservationStatusValue);
  }
  toString(): ReservationStatusValue {
    return this.v;
  }
  isReserved(): boolean {
    return this.v === 'reserved';
  }
  isReleased(): boolean {
    return this.v === 'released';
  }
  isExpired(): boolean {
    return this.v === 'expired';
  }
  isFailed(): boolean {
    return this.v === 'failed';
  }
  canRelease(): boolean {
    return this.v === 'reserved';
  }
  canExpire(): boolean {
    return this.v === 'reserved';
  }
}
