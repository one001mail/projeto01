import type { LiquidityPool } from '../entities/liquidity-pool.entity.js';

export class PoolAllocationService {
  canAllocate(pool: LiquidityPool, amount: number): boolean {
    return pool.available >= amount && amount > 0;
  }
}
