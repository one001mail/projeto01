/**
 * Log Minimizer module — privacy-by-design, SANDBOX-safe.
 *
 * Drives payload minimization, redaction, and retention-window cleanup.
 * This is NOT an anti-forensic module: its only goal is data-minimization
 * so logs stay useful for debugging without leaking sensitive fields.
 */
import type { FastifyInstance } from 'fastify';
import { ApplyLogPolicyUseCase } from './application/use-cases/apply-log-policy.use-case.js';
import { CleanupExpiredLogsUseCase } from './application/use-cases/cleanup-expired-logs.use-case.js';
import { MinimizeLogPayloadUseCase } from './application/use-cases/minimize-log-payload.use-case.js';
import { InMemoryLogMinimizerRepository } from './infra/persistence/in-memory-log-minimizer.repository.js';

export interface LogMinimizerModule {
  readonly name: 'log-minimizer';
  readonly minimize: MinimizeLogPayloadUseCase;
  readonly cleanup: CleanupExpiredLogsUseCase;
  readonly apply: ApplyLogPolicyUseCase;
  readonly repository: InMemoryLogMinimizerRepository;
}

export async function registerLogMinimizerModule(app: FastifyInstance): Promise<void> {
  const repository = new InMemoryLogMinimizerRepository();
  const module: LogMinimizerModule = {
    name: 'log-minimizer',
    minimize: new MinimizeLogPayloadUseCase(),
    cleanup: new CleanupExpiredLogsUseCase(repository),
    apply: new ApplyLogPolicyUseCase(repository),
    repository,
  };
  (app as unknown as { logMinimizer?: LogMinimizerModule }).logMinimizer = module;
  app.log.debug({ module: 'log-minimizer', sandbox: true }, 'log-minimizer module ready');
}
