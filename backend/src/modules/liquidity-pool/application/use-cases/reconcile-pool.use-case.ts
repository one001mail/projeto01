import { type Ok, ok } from '../../../../shared/types/result.js';
import type { LiquidityPoolRepository } from '../../domain/repositories/liquidity-pool.repository.js';

/**
 * Reconcile pool — SANDBOX stub.
 *
 * Real systems would cross-check the pool balance against an external
 * source of truth. In the sandbox this is a no-op that simply reports the
 * current pool state.
 */
export class ReconcilePoolUseCase {
  constructor(private readonly repo: LiquidityPoolRepository) {}
  async execute(input: { poolId: string }): Promise<
    Ok<{ poolId: string; balanced: true; mock: true }>
  > {
    await this.repo.findPool(input.poolId);
    return ok({ poolId: input.poolId, balanced: true as const, mock: true as const });
  }
}
