import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface RedactionRuleProps extends Record<string, unknown> {
  readonly path: string;
}
export class RedactionRule extends ValueObject<RedactionRuleProps> {
  static of(path: string): RedactionRule {
    if (!path) throw new Error('RedactionRule.path required');
    return new RedactionRule({ path });
  }
  get path(): string {
    return this.props.path;
  }
}
