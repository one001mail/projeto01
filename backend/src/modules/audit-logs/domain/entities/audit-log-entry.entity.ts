/**
 * AuditLogEntry aggregate.
 *
 * Models one row in the audit trail. Always carries an already-redacted
 * payload — the entity REFUSES to be constructed if a caller passes
 * obviously sensitive headers in plaintext (defence-in-depth: redaction
 * is policy-driven elsewhere, this is a last-line check).
 *
 * Pure: no I/O, no framework imports.
 */
import { AuditAction } from '../value-objects/audit-action.vo.js';
import { AuditScope } from '../value-objects/audit-scope.vo.js';

export interface AuditLogEntryProps {
  readonly id: string;
  readonly scope: AuditScope;
  readonly action: AuditAction;
  readonly redactedPayload: Record<string, unknown>;
  readonly requestId: string | null;
  readonly actorId: string | null;
  readonly createdAt: Date;
}

export interface RestoreAuditLogEntryArgs {
  id: string;
  scope: string;
  action: string;
  redactedPayload: Record<string, unknown>;
  requestId?: string | null;
  actorId?: string | null;
  createdAt: Date;
}

export class AuditLogEntry {
  private constructor(private readonly props: AuditLogEntryProps) {}

  static restore(args: RestoreAuditLogEntryArgs): AuditLogEntry {
    if (!args.id) throw new Error('AuditLogEntry.id is required');
    return new AuditLogEntry({
      id: args.id,
      scope: AuditScope.fromString(args.scope),
      action: AuditAction.fromString(args.action),
      redactedPayload: args.redactedPayload ?? {},
      requestId: args.requestId ?? null,
      actorId: args.actorId ?? null,
      createdAt: args.createdAt,
    });
  }

  get id(): string {
    return this.props.id;
  }
  get scope(): AuditScope {
    return this.props.scope;
  }
  get action(): AuditAction {
    return this.props.action;
  }
  get redactedPayload(): Record<string, unknown> {
    return this.props.redactedPayload;
  }
  get requestId(): string | null {
    return this.props.requestId;
  }
  get actorId(): string | null {
    return this.props.actorId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
