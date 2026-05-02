import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface PoolBalanceProps extends Record<string, unknown> {
  readonly total: number;
  readonly reserved: number;
}

export class PoolBalance extends ValueObject<PoolBalanceProps> {
  static of(total: number, reserved: number): PoolBalance {
    if (!Number.isInteger(total) || total < 0)
      throw new Error('total must be non-negative integer');
    if (!Number.isInteger(reserved) || reserved < 0)
      throw new Error('reserved must be non-negative integer');
    if (reserved > total) throw new Error('reserved cannot exceed total');
    return new PoolBalance({ total, reserved });
  }
  get total(): number {
    return this.props.total;
  }
  get reserved(): number {
    return this.props.reserved;
  }
  get available(): number {
    return this.props.total - this.props.reserved;
  }
}
