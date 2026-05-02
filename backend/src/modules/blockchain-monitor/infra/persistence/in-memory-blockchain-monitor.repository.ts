import type { MonitoredTransaction } from '../../domain/entities/monitored-transaction.entity.js';
import type { BlockchainMonitorRepository } from '../../domain/repositories/blockchain-monitor.repository.js';

export class InMemoryBlockchainMonitorRepository implements BlockchainMonitorRepository {
  private readonly store = new Map<string, MonitoredTransaction>();

  async save(tx: MonitoredTransaction): Promise<void> {
    this.store.set(tx.id, tx);
  }
  async findById(id: string): Promise<MonitoredTransaction | null> {
    return this.store.get(id) ?? null;
  }
  async listPending(limit: number): Promise<readonly MonitoredTransaction[]> {
    return [...this.store.values()].filter((t) => t.status === 'pending').slice(0, limit);
  }
  reset(): void {
    this.store.clear();
  }
}
