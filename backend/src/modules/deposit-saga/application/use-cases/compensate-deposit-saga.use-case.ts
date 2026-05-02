import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { DepositSagaRepository } from '../../domain/repositories/deposit-saga.repository.js';

export interface CompensateDepositSagaCommand {
  readonly id: string;
  readonly reason: string;
}
export type CompensateDepositSagaError = { kind: 'NOT_FOUND'; message: string };

export class CompensateDepositSagaUseCase {
  constructor(private readonly repo: DepositSagaRepository) {}
  async execute(
    cmd: CompensateDepositSagaCommand,
  ): Promise<Ok<{ id: string; status: string }> | Err<CompensateDepositSagaError>> {
    const s = await this.repo.findById(cmd.id);
    if (!s) return err({ kind: 'NOT_FOUND', message: 'saga not found' });
    s.compensate(cmd.reason);
    await this.repo.save(s);
    return ok({ id: s.id, status: s.status });
  }
}
