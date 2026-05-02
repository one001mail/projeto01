import { describe, expect, it } from 'vitest';
import { AdvanceDepositSagaUseCase } from './application/use-cases/advance-deposit-saga.use-case.js';
import { CompensateDepositSagaUseCase } from './application/use-cases/compensate-deposit-saga.use-case.js';
import { StartDepositSagaUseCase } from './application/use-cases/start-deposit-saga.use-case.js';
import { InMemoryDepositSagaRepository } from './infra/persistence/in-memory-deposit-saga.repository.js';

describe('deposit-saga (SANDBOX)', () => {
  it('transitions STARTED -> ACCEPTED -> ROUTED -> COMPLETED', async () => {
    const repo = new InMemoryDepositSagaRepository();
    const start = new StartDepositSagaUseCase(repo);
    const advance = new AdvanceDepositSagaUseCase(repo);

    const s = await start.execute({ id: 'saga-1', mockSessionId: 'sess-1' });
    expect(s.ok).toBe(true);

    const a1 = await advance.execute({ id: 'saga-1', target: 'ACCEPTED' });
    expect(a1.ok).toBe(true);
    const a2 = await advance.execute({ id: 'saga-1', target: 'ROUTED' });
    expect(a2.ok).toBe(true);
    const a3 = await advance.execute({ id: 'saga-1', target: 'COMPLETED' });
    expect(a3.ok).toBe(true);
    if (a3.ok) expect(a3.value.status).toBe('COMPLETED');
  });

  it('rejects invalid transitions', async () => {
    const repo = new InMemoryDepositSagaRepository();
    const start = new StartDepositSagaUseCase(repo);
    const advance = new AdvanceDepositSagaUseCase(repo);

    await start.execute({ id: 'saga-2', mockSessionId: 'x' });
    const r = await advance.execute({ id: 'saga-2', target: 'COMPLETED' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('INVALID_TRANSITION');
  });

  it('compensates non-terminal sagas', async () => {
    const repo = new InMemoryDepositSagaRepository();
    const start = new StartDepositSagaUseCase(repo);
    const comp = new CompensateDepositSagaUseCase(repo);

    await start.execute({ id: 'saga-3', mockSessionId: 'x' });
    const r = await comp.execute({ id: 'saga-3', reason: 'test' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe('FAILED');
  });
});
