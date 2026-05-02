import { describe, expect, it } from 'vitest';
import { ConfirmDepositUseCase } from './application/use-cases/confirm-deposit.use-case.js';
import { PollBlockchainUseCase } from './application/use-cases/poll-blockchain.use-case.js';
import { RegisterTransactionWatchUseCase } from './application/use-cases/register-transaction-watch.use-case.js';
import { InMemoryBlockchainMonitorRepository } from './infra/persistence/in-memory-blockchain-monitor.repository.js';
import { MockBlockchainReaderProvider } from './infra/providers/mock-blockchain-reader.provider.js';

describe('blockchain-monitor (SANDBOX / MOCK-ONLY)', () => {
  it('registers a watch and polls mock observations', async () => {
    const repo = new InMemoryBlockchainMonitorRepository();
    const provider = new MockBlockchainReaderProvider();
    const reg = new RegisterTransactionWatchUseCase(repo);
    const poll = new PollBlockchainUseCase(repo, provider);

    const r = await reg.execute({ id: 'tx-1', mockTxid: 'mocktx_abcdef1234567890' });
    expect(r.ok).toBe(true);
    provider.enqueue({ txid: 'mocktx_abcdef1234567890', blockHeight: 1 });
    const p = await poll.execute();
    expect(p.ok).toBe(true);
    if (p.ok) expect(p.value.observedCount).toBe(1);
  });

  it('rejects non-sandbox txids', async () => {
    const repo = new InMemoryBlockchainMonitorRepository();
    const reg = new RegisterTransactionWatchUseCase(repo);
    const r = await reg.execute({ id: 'tx-2', mockTxid: 'deadbeef' });
    expect(r.ok).toBe(false);
  });

  it('confirms after reaching threshold', async () => {
    const repo = new InMemoryBlockchainMonitorRepository();
    const provider = new MockBlockchainReaderProvider();
    const reg = new RegisterTransactionWatchUseCase(repo);
    const poll = new PollBlockchainUseCase(repo, provider);
    const conf = new ConfirmDepositUseCase(repo);

    await reg.execute({ id: 'tx-3', mockTxid: 'mocktx_aaaaaaaa11111111' });
    provider.enqueue({ txid: 'mocktx_aaaaaaaa11111111', blockHeight: 1 });
    await poll.execute();
    await conf.execute({ id: 'tx-3', threshold: 2 });
    const r = await conf.execute({ id: 'tx-3', threshold: 2 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe('confirmed');
  });
});
