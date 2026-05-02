import { type Ok, ok } from '../../../../shared/types/result.js';
import { LogPolicy } from '../../domain/entities/log-policy.entity.js';
import type { LogMinimizerRepository } from '../../domain/repositories/log-minimizer.repository.js';

export interface ApplyLogPolicyCommand {
  readonly id: string;
  readonly scope: string;
  readonly retentionDays: number;
  readonly redactPaths: readonly string[];
}

export class ApplyLogPolicyUseCase {
  constructor(private readonly repo: LogMinimizerRepository) {}
  async execute(cmd: ApplyLogPolicyCommand): Promise<Ok<{ id: string }>> {
    const p = LogPolicy.create(cmd);
    await this.repo.savePolicy(p);
    return ok({ id: p.id });
  }
}
