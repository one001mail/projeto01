/**
 * Deposit Saga module — SANDBOX-ONLY.
 *
 * Orchestrates MOCK educational state transitions. No real deposits,
 * no custody, no settlement, no payment routing.
 */
import type { FastifyInstance } from 'fastify';
import { AdvanceDepositSagaUseCase } from './application/use-cases/advance-deposit-saga.use-case.js';
import { CompensateDepositSagaUseCase } from './application/use-cases/compensate-deposit-saga.use-case.js';
import { StartDepositSagaUseCase } from './application/use-cases/start-deposit-saga.use-case.js';
import { InMemoryDepositSagaRepository } from './infra/persistence/in-memory-deposit-saga.repository.js';

export interface DepositSagaModule {
  readonly name: 'deposit-saga';
  readonly start: StartDepositSagaUseCase;
  readonly advance: AdvanceDepositSagaUseCase;
  readonly compensate: CompensateDepositSagaUseCase;
  readonly repository: InMemoryDepositSagaRepository;
}

export async function registerDepositSagaModule(app: FastifyInstance): Promise<void> {
  const repository = new InMemoryDepositSagaRepository();
  const module: DepositSagaModule = {
    name: 'deposit-saga',
    start: new StartDepositSagaUseCase(repository),
    advance: new AdvanceDepositSagaUseCase(repository),
    compensate: new CompensateDepositSagaUseCase(repository),
    repository,
  };
  (app as unknown as { depositSaga?: DepositSagaModule }).depositSaga = module;
  app.log.debug({ module: 'deposit-saga', sandbox: true }, 'deposit-saga module ready (MOCK)');
}
