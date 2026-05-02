import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import { MonitoredTransaction } from '../../domain/entities/monitored-transaction.entity.js';
import type { BlockchainMonitorRepository } from '../../domain/repositories/blockchain-monitor.repository.js';

export interface RegisterTransactionWatchCommand {
  readonly id: string;
  readonly mockTxid: string;
}

export type RegisterTransactionWatchError = { kind: 'INVALID_INPUT'; message: string };

export class RegisterTransactionWatchUseCase {
  constructor(private readonly repo: BlockchainMonitorRepository) {}

  async execute(
    cmd: RegisterTransactionWatchCommand,
  ): Promise<Ok<{ id: string; mockTxid: string }> | Err<RegisterTransactionWatchError>> {
    try {
      const tx = MonitoredTransaction.register({ id: cmd.id, txid: cmd.mockTxid });
      await this.repo.save(tx);
      return ok({ id: tx.id, mockTxid: tx.txid });
    } catch (e) {
      return err({ kind: 'INVALID_INPUT', message: e instanceof Error ? e.message : 'invalid' });
    }
  }
}
