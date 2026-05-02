/**
 * Log Policy entity.
 *
 * Holds a retention window and a set of redaction rules. Pure.
 */
export interface LogPolicyProps {
  readonly id: string;
  readonly retentionDays: number;
  readonly redactPaths: readonly string[];
  readonly scope: string;
}

export class LogPolicy {
  private constructor(private readonly props: LogPolicyProps) {}

  static create(input: {
    id: string;
    retentionDays: number;
    redactPaths: readonly string[];
    scope: string;
  }): LogPolicy {
    if (!Number.isInteger(input.retentionDays) || input.retentionDays < 0) {
      throw new Error('retentionDays must be non-negative integer');
    }
    return new LogPolicy(input);
  }

  get retentionDays(): number {
    return this.props.retentionDays;
  }
  get redactPaths(): readonly string[] {
    return this.props.redactPaths;
  }
  get scope(): string {
    return this.props.scope;
  }
  get id(): string {
    return this.props.id;
  }
}
