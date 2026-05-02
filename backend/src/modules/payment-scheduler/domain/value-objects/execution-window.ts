import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface ExecutionWindowProps extends Record<string, unknown> {
  readonly startIso: string;
  readonly endIso: string;
}
export class ExecutionWindow extends ValueObject<ExecutionWindowProps> {
  static of(start: Date, end: Date): ExecutionWindow {
    if (end.getTime() <= start.getTime()) throw new Error('end must be after start');
    return new ExecutionWindow({ startIso: start.toISOString(), endIso: end.toISOString() });
  }
  get startIso(): string {
    return this.props.startIso;
  }
  get endIso(): string {
    return this.props.endIso;
  }
}
