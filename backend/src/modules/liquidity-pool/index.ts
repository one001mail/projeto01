/**
 * Liquidity Pool module — SANDBOX-ONLY.
 *
 * Models MOCK resource allocation (abstract unitless "slots"). No real
 * liquidity, no wallet balances, no spendable accounting.
 */
import type { FastifyInstance } from 'fastify';
import { ReconcilePoolUseCase } from './application/use-cases/reconcile-pool.use-case.js';
import { ReleaseLiquidityUseCase } from './application/use-cases/release-liquidity.use-case.js';
import { ReserveLiquidityUseCase } from './application/use-cases/reserve-liquidity.use-case.js';
import { InMemoryLiquidityPoolRepository } from './infra/persistence/in-memory-liquidity-pool.repository.js';

export interface LiquidityPoolModule {
  readonly name: 'liquidity-pool';
  readonly reserve: ReserveLiquidityUseCase;
  readonly release: ReleaseLiquidityUseCase;
  readonly reconcile: ReconcilePoolUseCase;
  readonly repository: InMemoryLiquidityPoolRepository;
}

export async function registerLiquidityPoolModule(app: FastifyInstance): Promise<void> {
  const repository = new InMemoryLiquidityPoolRepository();
  const module: LiquidityPoolModule = {
    name: 'liquidity-pool',
    reserve: new ReserveLiquidityUseCase(repository),
    release: new ReleaseLiquidityUseCase(repository),
    reconcile: new ReconcilePoolUseCase(repository),
    repository,
  };
  (app as unknown as { liquidityPool?: LiquidityPoolModule }).liquidityPool = module;
  app.log.debug({ module: 'liquidity-pool', sandbox: true }, 'liquidity-pool module ready (MOCK)');
}
