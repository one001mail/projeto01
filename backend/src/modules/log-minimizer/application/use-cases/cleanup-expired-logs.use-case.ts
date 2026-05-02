import { type Ok, ok } from '../../../../shared/types/result.js';
import type { LogMinimizerRepository } from '../../domain/repositories/log-minimizer.repository.js';
import { RetentionWindow } from '../../domain/value-objects/retention-window.js';

export interface CleanupExpiredLogsCommand {
  readonly scope: string;
  readonly retentionDays: number;
}

export class CleanupExpiredLogsUseCase {
  constructor(private readonly repo: LogMinimizerRepository) {}
  async execute(
    cmd: CleanupExpiredLogsCommand,
  ): Promise<Ok<{ removedCount: number; cutoff: string; scope: string; mock: true }>> {
    const window = RetentionWindow.ofDays(cmd.retentionDays);
    const cutoff = window.cutoff();
    const removed = await this.repo.removeOlderThan(cmd.scope, cutoff);
    return ok({
      removedCount: removed,
      cutoff: cutoff.toISOString(),
      scope: cmd.scope,
      mock: true as const,
    });
  }
}
