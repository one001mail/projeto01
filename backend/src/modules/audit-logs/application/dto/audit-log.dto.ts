/**
 * Public DTO surfaced by the audit-logs use cases.
 *
 * Already-redacted, JSON-serialisable shape. The HTTP presenters consume
 * this directly; module-internal concepts (entities, value objects) never
 * cross the application boundary.
 */
export interface AuditLogDto {
  readonly id: string;
  readonly scope: string;
  readonly action: string;
  readonly redactedPayload: Record<string, unknown>;
  readonly requestId: string | null;
  readonly actorId: string | null;
  readonly createdAt: string;
}

export interface AuditLogListResultDto {
  readonly entries: readonly AuditLogDto[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly retrievedAt: string;
}
