import type { DepositSaga } from '../../domain/entities/deposit-saga.entity.js';
import type { DepositSagaRepository } from '../../domain/repositories/deposit-saga.repository.js';

export class InMemoryDepositSagaRepository implements DepositSagaRepository {
  private readonly store = new Map<string, DepositSaga>();
  async save(s: DepositSaga): Promise<void> {
    this.store.set(s.id, s);
  }
  async findById(id: string): Promise<DepositSaga | null> {
    return this.store.get(id) ?? null;
  }
  reset(): void {
    this.store.clear();
  }
}
