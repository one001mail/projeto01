import type { LiquidityPool } from '../entities/liquidity-pool.entity.js';
import type { PoolReservation } from '../entities/pool-reservation.entity.js';

export interface LiquidityPoolRepository {
  savePool(pool: LiquidityPool): Promise<void>;
  findPool(id: string): Promise<LiquidityPool | null>;
  saveReservation(r: PoolReservation): Promise<void>;
  findReservation(id: string): Promise<PoolReservation | null>;
}
