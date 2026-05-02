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

export interface AuditLogStore {
  /**
   * Appends one entry. Must NOT throw on transient infra failure: callers
   * (HTTP middlewares) cannot afford to break the response. Implementations
   * SHOULD log the error and degrade silently.
   */
  record(entry: AuditLogEntry): Promise<void>;
}
