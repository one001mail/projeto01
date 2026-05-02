import type { DepositSaga } from '../entities/deposit-saga.entity.js';

export interface DepositSagaRepository {
  save(s: DepositSaga): Promise<void>;
  findById(id: string): Promise<DepositSaga | null>;
}
