/**
 * AuditLogService.
 *
 * Records a structured, non-secret entry for every sensitive wallet
 * operation. Backed by the application-level audit sink when available
 * (via `app.ctx.auditLog`), and falls back to the Fastify logger. The
 * metadata is passed through `SecretRedactionService` before emission so
 * no secret can ever accidentally land on disk.
 */
import type { FastifyBaseLogger } from 'fastify';
import { isAuditRequired } from '../../domain/policies/audit-required.policy.js';
import { SecretRedactionService } from './secret-redaction.service.js';

export interface AuditLogEntry {
  readonly operation: string;
  readonly actor: string;
  readonly subject: string;
  readonly metadata?: Record<string, unknown>;
}

export interface AuditLogOptions {
  readonly enabled: boolean;
  readonly logger?: FastifyBaseLogger;
}

export class AuditLogService {
  private readonly redactor = new SecretRedactionService();

  constructor(private readonly opts: AuditLogOptions) {}

  async record(entry: AuditLogEntry): Promise<void> {
    if (!this.opts.enabled) return;
    const metadata = this.redactor.redact(entry.metadata ?? {});
    const line = {
      audit: true,
      module: 'wallet',
      operation: entry.operation,
      actor: entry.actor,
      subject: entry.subject,
      required: isAuditRequired(entry.operation),
      metadata,
      observedAt: new Date().toISOString(),
    };
    if (this.opts.logger) {
      this.opts.logger.info(line, 'wallet.audit');
    } else {
      // Biome console-noise is acceptable in fallback path.
      // biome-ignore lint/suspicious/noConsole: audit fallback when no logger present
      console.log(JSON.stringify(line));
    }
  }
}
