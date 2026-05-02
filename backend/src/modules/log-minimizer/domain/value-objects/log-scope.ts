import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface LogScopeProps extends Record<string, unknown> {
  readonly value: string;
}
export class LogScope extends ValueObject<LogScopeProps> {
  static of(value: string): LogScope {
    if (!value) throw new Error('LogScope required');
    return new LogScope({ value });
  }
  get value(): string {
    return this.props.value;
  }
}
