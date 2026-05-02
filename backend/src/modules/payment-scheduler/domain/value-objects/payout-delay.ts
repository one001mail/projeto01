import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface PayoutDelayProps extends Record<string, unknown> {
  readonly seconds: number;
}
export class PayoutDelay extends ValueObject<PayoutDelayProps> {
  static ofSeconds(seconds: number): PayoutDelay {
    if (!Number.isInteger(seconds) || seconds < 0)
      throw new Error('seconds must be non-negative integer');
    return new PayoutDelay({ seconds });
  }
  get seconds(): number {
    return this.props.seconds;
  }
}
