import type { MonitoredTransaction } from '../entities/monitored-transaction.entity.js';

export interface BlockchainMonitorRepository {
  save(tx: MonitoredTransaction): Promise<void>;
  findById(id: string): Promise<MonitoredTransaction | null>;
  listPending(limit: number): Promise<readonly MonitoredTransaction[]>;
}
