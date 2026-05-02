/**
 * ResourceReservation aggregate.
 *
 * Sandbox simulation. NEVER blocks real funds, NEVER transfers value.
 * The aggregate enforces lifecycle transitions through `ReservationStatus`
 * and surfaces a constant disclaimer in DTOs (mapper layer).
 */
import { ReservationExpirationPolicy } from '../policies/reservation-expiration.policy.js';
import type { AllocationId } from '../value-objects/allocation-id.vo.js';
import type { ReservationAmount } from '../value-objects/reservation-amount.vo.js';
import { ReservationStatus } from '../value-objects/reservation-status.vo.js';

export interface ResourceReservationProps {
  readonly id: string;
  readonly namespace: AllocationId;
  readonly sessionId: string;
  readonly amount: ReservationAmount;
  status: ReservationStatus;
  readonly createdAt: Date;
  releasedAt: Date | null;
  readonly expiresAt: Date | null;
}

export interface CreateReservationArgs {
  readonly id: string;
  readonly namespace: AllocationId;
  readonly sessionId: string;
  readonly amount: ReservationAmount;
  readonly createdAt: Date;
  readonly expiresAt?: Date | null;
}

export interface RestoreReservationArgs {
  readonly id: string;
  readonly namespace: AllocationId;
  readonly sessionId: string;
  readonly amount: ReservationAmount;
  readonly status: 'reserved' | 'released' | 'expired' | 'failed';
  readonly createdAt: Date;
  readonly releasedAt: Date | null;
  readonly expiresAt: Date | null;
}

export class ResourceReservation {
  private constructor(private props: ResourceReservationProps) {}

  static reserve(args: CreateReservationArgs): ResourceReservation {
    return new ResourceReservation({
      id: args.id,
      namespace: args.namespace,
      sessionId: args.sessionId,
      amount: args.amount,
      status: ReservationStatus.reserved(),
      createdAt: args.createdAt,
      releasedAt: null,
      expiresAt: args.expiresAt ?? null,
    });
  }

  static restore(args: RestoreReservationArgs): ResourceReservation {
    return new ResourceReservation({
      id: args.id,
      namespace: args.namespace,
      sessionId: args.sessionId,
      amount: args.amount,
      status: ReservationStatus.fromString(args.status),
      createdAt: args.createdAt,
      releasedAt: args.releasedAt,
      expiresAt: args.expiresAt,
    });
  }

  get id(): string {
    return this.props.id;
  }
  get namespace(): AllocationId {
    return this.props.namespace;
  }
  get sessionId(): string {
    return this.props.sessionId;
  }
  get amount(): ReservationAmount {
    return this.props.amount;
  }
  get status(): ReservationStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get releasedAt(): Date | null {
    return this.props.releasedAt;
  }
  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }

  refreshStatus(now: Date): void {
    if (
      this.props.status.isReserved() &&
      ReservationExpirationPolicy.isExpired(this.props.expiresAt, now)
    ) {
      this.props.status = ReservationStatus.expired();
      if (!this.props.releasedAt) this.props.releasedAt = now;
    }
  }

  release(now: Date): void {
    if (!this.props.status.canRelease()) {
      throw new Error(
        `ResourceReservation ${this.props.id}: cannot release from status '${this.props.status.toString()}'`,
      );
    }
    this.props.status = ReservationStatus.released();
    this.props.releasedAt = now;
  }

  expire(now: Date): void {
    if (!this.props.status.canExpire()) {
      throw new Error(
        `ResourceReservation ${this.props.id}: cannot expire from status '${this.props.status.toString()}'`,
      );
    }
    this.props.status = ReservationStatus.expired();
    this.props.releasedAt = now;
  }
}
