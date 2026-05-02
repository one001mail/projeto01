/**
 * Mock blockchain reader — SANDBOX ONLY.
 *
 * DOES NOT call Bitcoin, Ethereum, mempool.space, blockstream, Electrum,
 * Infura, Alchemy, QuickNode, any RPC node, any node software, any
 * block explorer, or any third-party blockchain service. DOES NOT read
 * the mempool. DOES NOT read block headers. DOES NOT watch addresses.
 *
 * It returns observations from a locally seeded in-memory list only.
 */
import type {
  BlockchainObservation,
  BlockchainReaderService,
} from '../../domain/services/blockchain-reader.service.js';

export class MockBlockchainReaderProvider implements BlockchainReaderService {
  private readonly queue: BlockchainObservation[] = [];

  enqueue(obs: BlockchainObservation): void {
    this.queue.push(obs);
  }

  async pollPending(): Promise<readonly BlockchainObservation[]> {
    const out = [...this.queue];
    this.queue.length = 0;
    return out;
  }
}
