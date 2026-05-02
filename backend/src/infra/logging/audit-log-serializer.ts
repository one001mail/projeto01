/**
 * Audit-log serializer.
 *
 * Serializes an audit-log entry into the storage shape (JSON-safe).
 * Redaction is expected to be applied upstream by the middleware/use case;
 * this adapter is intentionally minimal to keep the logic debuggable.
 */
export interface AuditLogInput {
  readonly scope: string;
  readonly action: string;
  readonly payload: unknown;
  readonly requestId?: string | null;
  readonly actorId?: string | null;
  readonly occurredAt?: string;
}

export interface SerializedAuditLog {
  readonly scope: string;
  readonly action: string;
  readonly payload: unknown;
  readonly requestId: string | null;
  readonly actorId: string | null;
  readonly occurredAt: string;
}

export function serializeAuditLog(input: AuditLogInput): SerializedAuditLog {
  return {
    scope: input.scope,
    action: input.action,
    payload: input.payload ?? null,
    requestId: input.requestId ?? null,
    actorId: input.actorId ?? null,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  };
}
