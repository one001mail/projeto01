/**
 * Blockchain Monitor module composition root — SANDBOX-ONLY, MOCK ONLY.
 *
 * NO REAL BLOCKCHAIN ACCESS. NO RPC. NO MEMPOOL. NO EXPLORER. NO FUNDS.
 */
import type { FastifyInstance } from 'fastify';
import { ConfirmDepositUseCase } from './application/use-cases/confirm-deposit.use-case.js';
import { PollBlockchainUseCase } from './application/use-cases/poll-blockchain.use-case.js';
import { RegisterTransactionWatchUseCase } from './application/use-cases/register-transaction-watch.use-case.js';
import { InMemoryBlockchainMonitorRepository } from './infra/persistence/in-memory-blockchain-monitor.repository.js';
import { MockBlockchainReaderProvider } from './infra/providers/mock-blockchain-reader.provider.js';

export interface BlockchainMonitorModule {
  readonly name: 'blockchain-monitor';
  readonly registerWatch: RegisterTransactionWatchUseCase;
  readonly poll: PollBlockchainUseCase;
  readonly confirm: ConfirmDepositUseCase;
  readonly repository: InMemoryBlockchainMonitorRepository;
  readonly provider: MockBlockchainReaderProvider;
}

export async function registerBlockchainMonitorModule(app: FastifyInstance): Promise<void> {
  const repository = new InMemoryBlockchainMonitorRepository();
  const provider = new MockBlockchainReaderProvider();

  const module: BlockchainMonitorModule = {
    name: 'blockchain-monitor',
    registerWatch: new RegisterTransactionWatchUseCase(repository),
    poll: new PollBlockchainUseCase(repository, provider),
    confirm: new ConfirmDepositUseCase(repository),
    repository,
    provider,
  };
  (app as unknown as { blockchainMonitor?: BlockchainMonitorModule }).blockchainMonitor = module;

  app.log.debug(
    { module: 'blockchain-monitor', sandbox: true, mockOnly: true },
    'blockchain-monitor module ready (MOCK ONLY, NO REAL BLOCKCHAIN)',
  );
}
