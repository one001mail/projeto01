/**
 * Domain-level error for missing audit rows. Application code maps this to
 * `Result.err({ kind: 'NOT_FOUND' })`; the HTTP layer translates to 404.
 */
export class AuditLogNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Audit log entry '${id}' was not found`);
    this.name = 'AuditLogNotFoundError';
  }
}
