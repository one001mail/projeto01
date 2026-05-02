import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { BlockchainMonitorRepository } from '../../domain/repositories/blockchain-monitor.repository.js';

export interface ConfirmDepositCommand {
  readonly id: string;
  readonly threshold?: number;
}

export type ConfirmDepositError = { kind: 'NOT_FOUND'; message: string };

export class ConfirmDepositUseCase {
  constructor(private readonly repo: BlockchainMonitorRepository) {}

  async execute(
    cmd: ConfirmDepositCommand,
  ): Promise<Ok<{ id: string; status: string; confirmations: number }> | Err<ConfirmDepositError>> {
    const tx = await this.repo.findById(cmd.id);
    if (!tx) return err({ kind: 'NOT_FOUND', message: 'tx not found' });
    tx.confirm(cmd.threshold ?? 3);
    await this.repo.save(tx);
    return ok({ id: tx.id, status: tx.status, confirmations: tx.confirmations });
  }
}
