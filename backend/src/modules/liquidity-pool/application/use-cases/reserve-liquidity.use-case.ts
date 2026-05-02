import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import { LiquidityPool } from '../../domain/entities/liquidity-pool.entity.js';
import { PoolReservation } from '../../domain/entities/pool-reservation.entity.js';
import type { LiquidityPoolRepository } from '../../domain/repositories/liquidity-pool.repository.js';

export interface ReserveLiquidityCommand {
  readonly poolId: string;
  readonly namespace: string;
  readonly total: number;
  readonly reservationId: string;
  readonly amount: number;
}

export type ReserveLiquidityError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'INSUFFICIENT_LIQUIDITY'; message: string };

export class ReserveLiquidityUseCase {
  constructor(private readonly repo: LiquidityPoolRepository) {}

  async execute(
    cmd: ReserveLiquidityCommand,
  ): Promise<Ok<{ reservationId: string; poolAvailable: number }> | Err<ReserveLiquidityError>> {
    try {
      let pool = await this.repo.findPool(cmd.poolId);
      if (!pool) {
        pool = LiquidityPool.create({ id: cmd.poolId, namespace: cmd.namespace, total: cmd.total });
      }
      pool.reserve(cmd.amount, cmd.reservationId);
      await this.repo.savePool(pool);
      await this.repo.saveReservation(
        PoolReservation.create({
          id: cmd.reservationId,
          poolId: cmd.poolId,
          amount: cmd.amount,
        }),
      );
      return ok({ reservationId: cmd.reservationId, poolAvailable: pool.available });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'invalid';
      if (msg.startsWith('insufficient'))
        return err({ kind: 'INSUFFICIENT_LIQUIDITY', message: msg });
      return err({ kind: 'INVALID_INPUT', message: msg });
    }
  }
}
