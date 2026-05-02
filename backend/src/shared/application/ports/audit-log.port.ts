/**
 * Audit-log port.
 *
 * Generic, append-only audit trail. Used by the HTTP `audit-log`
 * middleware and by application services that mutate sensitive state.
 *
 * Privacy contract:
 *   * Callers MUST redact the payload before invoking `record()`.
 *   * The store MUST treat `redactedPayload` as already-safe — no
 *     additional masking is applied at the storage layer.
 *   * Retention is policy-driven outside the schema (see `LOG_RETENTION_DAYS`).
 */
export interface AuditLogEntry {
  /**
   * Logical area producing the entry, e.g. `'http'`, `'learning-sessions'`,
   * `'admin'`. Free-form string but expected to be stable per scope.
   */
  readonly scope: string;

  /**
   * Action being audited within the scope, e.g. `'POST /api/contact-requests'`,
   * `'created'`, `'admin.health.read'`. Stable per-scope grammar.
   */
  readonly action: string;

  /**
   * Already-redacted, JSON-serialisable payload. Callers are responsible
   * for masking PII / secrets before passing it in.
   */
  readonly redactedPayload: Record<string, unknown>;

  /** Correlation id (Fastify `req.id`). Optional but strongly recommended. */
  readonly requestId?: string;

  /** Subject identifier when available. Free-form (user id, api-key id, etc.). */
  readonly actorId?: string;
}

export interface AuditLogRecord extends AuditLogEntry {
  /** Persistent identifier (uuid for PG; sequence for in-memory). */
  readonly id: string;
  /** ISO timestamp when the row was inserted. */
  readonly createdAt: string;
}

export interface AuditLogListQuery {
  /** Maximum rows to return. Implementations must clamp to a safe ceiling. */
  readonly limit?: number;
  /** Offset for pagination. */
  readonly offset?: number;
  /** Optional filter on `scope`. */
  readonly scope?: string;
  /** Optional filter on `action`. */
  readonly action?: string;
}

export interface AuditLogListResult {
  readonly entries: readonly AuditLogRecord[];
  /** Total matching rows ignoring limit/offset. */
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

export interface AuditLogStore {
  /**
   * Appends one entry. Must NOT throw on transient infra failure: callers
   * (HTTP middlewares) cannot afford to break the response. Implementations
   * SHOULD log the error and degrade silently.
   */
  record(entry: AuditLogEntry): Promise<void>;

  /**
   * Reads recent entries, newest first. Used by `GET /api/admin/audit-logs`.
   * Returns a deterministic page of records and the total count for the
   * filter. Caller MUST be authenticated (admin auth middleware).
   */
  list(query?: AuditLogListQuery): Promise<AuditLogListResult>;
}
