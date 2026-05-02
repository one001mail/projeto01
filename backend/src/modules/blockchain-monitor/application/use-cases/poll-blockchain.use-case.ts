import { type Ok, ok } from '../../../../shared/types/result.js';
import type { BlockchainMonitorRepository } from '../../domain/repositories/blockchain-monitor.repository.js';
import type { BlockchainReaderService } from '../../domain/services/blockchain-reader.service.js';

export interface PollBlockchainResult {
  readonly observedCount: number;
  readonly mock: true;
}

export class PollBlockchainUseCase {
  constructor(
    private readonly repo: BlockchainMonitorRepository,
    private readonly reader: BlockchainReaderService,
  ) {}

  /**
   * Iterates MOCK observations and marks matching monitored transactions
   * as observed. Never hits a real blockchain endpoint.
   */
  async execute(): Promise<Ok<PollBlockchainResult>> {
    const obs = await this.reader.pollPending();
    let count = 0;
    for (const o of obs) {
      const pendings = await this.repo.listPending(100);
      const match = pendings.find((p) => p.txid === o.txid);
      if (!match) continue;
      match.observe(o.blockHeight);
      await this.repo.save(match);
      count += 1;
    }
    return ok({ observedCount: count, mock: true as const });
  }
}
