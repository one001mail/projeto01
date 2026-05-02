/**
 * Pool reservation entity — SANDBOX.
 */
export interface PoolReservationProps {
  readonly id: string;
  readonly poolId: string;
  readonly amount: number;
  status: 'reserved' | 'released';
  readonly createdAt: Date;
}

export class PoolReservation {
  private constructor(private props: PoolReservationProps) {}

  static create(input: {
    id: string;
    poolId: string;
    amount: number;
    now?: Date;
  }): PoolReservation {
    return new PoolReservation({
      id: input.id,
      poolId: input.poolId,
      amount: input.amount,
      status: 'reserved',
      createdAt: input.now ?? new Date(),
    });
  }

  release(): void {
    this.props.status = 'released';
  }

  get id(): string {
    return this.props.id;
  }
  get poolId(): string {
    return this.props.poolId;
  }
  get amount(): number {
    return this.props.amount;
  }
  get status(): 'reserved' | 'released' {
    return this.props.status;
  }
}
