import { DepositSaga } from '../entities/deposit-saga.entity.js';

/**
 * Pure domain service: orchestrates the lifecycle of a mock saga.
 * Side-effect-free; persistence happens in the use case layer.
 */
export class DepositOrchestratorService {
  start(input: { id: string; mockSessionId: string }): DepositSaga {
    return DepositSaga.start(input);
  }
  advance(s: DepositSaga, target: Parameters<DepositSaga['advance']>[0]): void {
    s.advance(target);
  }
  compensate(s: DepositSaga, reason: string): void {
    s.compensate(reason);
  }
}
