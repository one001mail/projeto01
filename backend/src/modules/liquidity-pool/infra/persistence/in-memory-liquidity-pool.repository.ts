import type { LiquidityPool } from '../../domain/entities/liquidity-pool.entity.js';
import type { PoolReservation } from '../../domain/entities/pool-reservation.entity.js';
import type { LiquidityPoolRepository } from '../../domain/repositories/liquidity-pool.repository.js';

export class InMemoryLiquidityPoolRepository implements LiquidityPoolRepository {
  private readonly pools = new Map<string, LiquidityPool>();
  private readonly reservations = new Map<string, PoolReservation>();

  async savePool(p: LiquidityPool): Promise<void> {
    this.pools.set(p.id, p);
  }
  async findPool(id: string): Promise<LiquidityPool | null> {
    return this.pools.get(id) ?? null;
  }
  async saveReservation(r: PoolReservation): Promise<void> {
    this.reservations.set(r.id, r);
  }
  async findReservation(id: string): Promise<PoolReservation | null> {
    return this.reservations.get(id) ?? null;
  }
  reset(): void {
    this.pools.clear();
    this.reservations.clear();
  }
}
