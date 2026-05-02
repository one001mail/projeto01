/**
 * Issuance context — minimal metadata allowed to be captured alongside
 * a generated mock token. Intentionally tiny (namespace + correlationId)
 * to enforce the minimal-metadata policy.
 */
import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface IssuanceContextProps extends Record<string, unknown> {
  readonly namespace: string;
  readonly correlationId: string | null;
}

export class IssuanceContext extends ValueObject<IssuanceContextProps> {
  static of(namespace: string, correlationId?: string | null): IssuanceContext {
    return new IssuanceContext({
      namespace,
      correlationId: correlationId ?? null,
    });
  }
  get namespace(): string {
    return this.props.namespace;
  }
  get correlationId(): string | null {
    return this.props.correlationId;
  }
}
