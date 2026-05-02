import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface BlockHeightProps extends Record<string, unknown> {
  readonly value: number;
}

export class BlockHeight extends ValueObject<BlockHeightProps> {
  static of(value: number): BlockHeight {
    if (!Number.isInteger(value) || value < 0)
      throw new Error('BlockHeight must be non-negative integer');
    return new BlockHeight({ value });
  }
  get value(): number {
    return this.props.value;
  }
}
