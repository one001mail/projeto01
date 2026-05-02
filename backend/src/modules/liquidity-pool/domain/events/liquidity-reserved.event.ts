export const LIQUIDITY_RESERVED_EVENT = 'liquidity-pool.liquidity-reserved';
export interface LiquidityReservedPayload {
  readonly poolId: string;
  readonly reservationId: string;
  readonly amount: number;
  readonly namespace: string;
  readonly mock: true;
}
