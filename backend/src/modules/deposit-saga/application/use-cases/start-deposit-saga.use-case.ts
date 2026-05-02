import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { DepositSagaRepository } from '../../domain/repositories/deposit-saga.repository.js';
import { DepositOrchestratorService } from '../../domain/services/deposit-orchestrator.service.js';

export interface StartDepositSagaCommand {
  readonly id: string;
  readonly mockSessionId: string;
}
export type StartDepositSagaError = { kind: 'INVALID_INPUT'; message: string };

export class StartDepositSagaUseCase {
  constructor(
    private readonly repo: DepositSagaRepository,
    private readonly svc: DepositOrchestratorService = new DepositOrchestratorService(),
  ) {}
  async execute(
    cmd: StartDepositSagaCommand,
  ): Promise<Ok<{ id: string; status: string }> | Err<StartDepositSagaError>> {
    try {
      const s = this.svc.start(cmd);
      await this.repo.save(s);
      return ok({ id: s.id, status: s.status });
    } catch (e) {
      return err({ kind: 'INVALID_INPUT', message: e instanceof Error ? e.message : 'invalid' });
    }
  }
}
