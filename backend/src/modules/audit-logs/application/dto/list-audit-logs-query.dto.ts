/**
 * Input contract for `list-audit-logs.use-case`. Caller is responsible for
 * decoding the HTTP query string; the use case enforces clamps via the
 * domain criteria.
 */
export interface ListAuditLogsQueryDto {
  readonly limit?: number | undefined;
  readonly offset?: number | undefined;
  readonly scope?: string | undefined;
  readonly action?: string | undefined;
}
