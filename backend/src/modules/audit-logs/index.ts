/**
 * audit-logs module composition root.
 *
 * Read-and-lifecycle module on top of the `audit_logs` table populated by
 * the cross-cutting `audit-log` middleware. Adds DDD use cases for
 * administrative listing, detail and retention cleanup, plus defensive
 * redaction at the read boundary.
 */
import type { FastifyInstance } from 'fastify';
import { SystemClock } from '../../shared/application/ports/clock.port.js';
import { CryptoUuidGenerator } from '../../shared/application/ports/uuid.port.js';
import { CleanupExpiredAuditLogsUseCase } from './application/use-cases/cleanup-expired-audit-logs.use-case.js';
import { GetAuditLogDetailUseCase } from './application/use-cases/get-audit-log-detail.use-case.js';
import { ListAuditLogsUseCase } from './application/use-cases/list-audit-logs.use-case.js';
import type { AuditLogRepository } from './domain/repositories/audit-log.repository.js';
import { InMemoryAuditLogRepository } from './infra/persistence/in-memory-audit-log.repository.js';
import { createPgAuditLogRepository } from './infra/persistence/pg-audit-log.repository.js';

export async function registerAuditLogsModule(app: FastifyInstance): Promise<void> {
  const ctx = app.ctx;
  const clock = new SystemClock();
  const uuid = new CryptoUuidGenerator();

  const repo: AuditLogRepository = ctx.sandboxFallback
    ? new InMemoryAuditLogRepository()
    : createPgAuditLogRepository(ctx.tm);

  const listUc = new ListAuditLogsUseCase(repo, clock);
  const getDetailUc = new GetAuditLogDetailUseCase(repo);
  const cleanupUc = new CleanupExpiredAuditLogsUseCase({
    repo,
    clock,
    uuid,
    outbox: {
      save: async (e) => ctx.outbox.save(e),
    },
  });

  ctx.useCases.auditLogs = {
    list: listUc,
    getDetail: getDetailUc,
    cleanup: cleanupUc,
  };

  app.log.debug({ module: 'audit-logs' }, 'audit-logs module ready');
}
