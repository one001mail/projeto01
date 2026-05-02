import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { LiquidityPoolRepository } from '../../domain/repositories/liquidity-pool.repository.js';

export interface ReleaseLiquidityCommand {
  readonly reservationId: string;
}
export type ReleaseLiquidityError = { kind: 'NOT_FOUND'; message: string };

export class ReleaseLiquidityUseCase {
  constructor(private readonly repo: LiquidityPoolRepository) {}

  async execute(
    cmd: ReleaseLiquidityCommand,
  ): Promise<Ok<{ reservationId: string; status: 'released' }> | Err<ReleaseLiquidityError>> {
    const r = await this.repo.findReservation(cmd.reservationId);
    if (!r) return err({ kind: 'NOT_FOUND', message: 'reservation not found' });
    const pool = await this.repo.findPool(r.poolId);
    if (!pool) return err({ kind: 'NOT_FOUND', message: 'pool not found' });
    if (r.status === 'reserved') {
      pool.release(r.amount, r.id);
      r.release();
      await this.repo.savePool(pool);
      await this.repo.saveReservation(r);
    }
    return ok({ reservationId: r.id, status: 'released' });
  }
}
