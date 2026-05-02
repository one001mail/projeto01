import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { DepositSagaRepository } from '../../domain/repositories/deposit-saga.repository.js';
import type { SagaStatus } from '../../domain/value-objects/saga-status.js';

export interface AdvanceDepositSagaCommand {
  readonly id: string;
  readonly target: SagaStatus;
}
export type AdvanceDepositSagaError =
  | { kind: 'NOT_FOUND'; message: string }
  | { kind: 'INVALID_TRANSITION'; message: string };

export class AdvanceDepositSagaUseCase {
  constructor(private readonly repo: DepositSagaRepository) {}
  async execute(
    cmd: AdvanceDepositSagaCommand,
  ): Promise<Ok<{ id: string; status: string }> | Err<AdvanceDepositSagaError>> {
    const s = await this.repo.findById(cmd.id);
    if (!s) return err({ kind: 'NOT_FOUND', message: 'saga not found' });
    try {
      s.advance(cmd.target);
      await this.repo.save(s);
      return ok({ id: s.id, status: s.status });
    } catch (e) {
      return err({ kind: 'INVALID_TRANSITION', message: e instanceof Error ? e.message : 'bad' });
    }
  }
}
