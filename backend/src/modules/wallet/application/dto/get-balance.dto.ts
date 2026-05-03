import type { NetworkKind } from '../../domain/value-objects/network.js';

export interface GetBalanceDto {
  readonly walletId: string;
  readonly address: string;
}

export interface BalanceResultDto {
  readonly walletId: string;
  readonly address: string;
  readonly network: NetworkKind;
  readonly asset: string;
  readonly confirmed: string;
  readonly pending: string;
  readonly observedAt: string;
}
