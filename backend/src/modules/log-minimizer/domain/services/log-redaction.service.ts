/**
 * Log redaction service — privacy-by-design.
 *
 * NOT anti-forensic. This only enforces data-minimization (masking fields
 * like email, auth tokens). It does not delete logs for the purpose of
 * hiding activity — cleanup is driven by the retention window.
 *
 * Pure domain service. The redaction strategy is injected from the
 * application layer so the `shared/application/redaction.ts` helper stays
 * outside the domain boundary.
 */
export type Redactor = (payload: unknown, paths: readonly string[]) => unknown;

export class LogRedactionService {
  constructor(private readonly redactor: Redactor) {}

  redact(payload: unknown, paths: readonly string[]): unknown {
    return this.redactor(payload, paths);
  }
}
