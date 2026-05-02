export const DEPOSIT_CONFIRMED = 'blockchain-monitor.deposit-confirmed';
export interface DepositConfirmedPayload {
  readonly monitoredTxId: string;
  readonly mockTxid: string;
  readonly confirmations: number;
  readonly mock: true;
}
