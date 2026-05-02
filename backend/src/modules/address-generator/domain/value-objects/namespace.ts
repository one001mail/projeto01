/**
 * Namespace VO — logical partition for mock address tokens.
 */
import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface NamespaceProps extends Record<string, unknown> {
  readonly value: string;
}

const NAMESPACE_RE = /^[a-z0-9][a-z0-9_-]{1,48}$/;

export class Namespace extends ValueObject<NamespaceProps> {
  static of(value: string): Namespace {
    const trimmed = value.trim().toLowerCase();
    if (!NAMESPACE_RE.test(trimmed)) {
      throw new Error('Namespace must match /^[a-z0-9][a-z0-9_-]{1,48}$/');
    }
    return new Namespace({ value: trimmed });
  }
  get value(): string {
    return this.props.value;
  }
}
