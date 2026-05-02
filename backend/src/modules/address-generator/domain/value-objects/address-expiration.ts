/**
 * Address expiration VO.
 */
import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface AddressExpirationProps extends Record<string, unknown> {
  readonly expiresAt: string;
}

export class AddressExpiration extends ValueObject<AddressExpirationProps> {
  static at(date: Date): AddressExpiration {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new Error('AddressExpiration.at: invalid Date');
    }
    return new AddressExpiration({ expiresAt: date.toISOString() });
  }
  get iso(): string {
    return this.props.expiresAt;
  }
  isExpired(now: Date = new Date()): boolean {
    return new Date(this.props.expiresAt).getTime() <= now.getTime();
  }
}
