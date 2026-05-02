import { describe, expect, it } from 'vitest';
import { ReleaseLiquidityUseCase } from './application/use-cases/release-liquidity.use-case.js';
import { ReserveLiquidityUseCase } from './application/use-cases/reserve-liquidity.use-case.js';
import { InMemoryLiquidityPoolRepository } from './infra/persistence/in-memory-liquidity-pool.repository.js';

describe('liquidity-pool (SANDBOX / MOCK)', () => {
  it('reserves then releases liquidity', async () => {
    const repo = new InMemoryLiquidityPoolRepository();
    const reserve = new ReserveLiquidityUseCase(repo);
    const release = new ReleaseLiquidityUseCase(repo);

    const r = await reserve.execute({
      poolId: 'pool-1',
      namespace: 'demo',
      total: 100,
      reservationId: 'r-1',
      amount: 10,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.poolAvailable).toBe(90);

    const rel = await release.execute({ reservationId: 'r-1' });
    expect(rel.ok).toBe(true);
  });

  it('rejects when insufficient mock liquidity', async () => {
    const repo = new InMemoryLiquidityPoolRepository();
    const reserve = new ReserveLiquidityUseCase(repo);
    const r = await reserve.execute({
      poolId: 'pool-2',
      namespace: 'x',
      total: 5,
      reservationId: 'r-2',
      amount: 10,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('INSUFFICIENT_LIQUIDITY');
  });
});
