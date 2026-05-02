export const DEPOSIT_DETECTED = 'blockchain-monitor.deposit-detected';
export interface DepositDetectedPayload {
  readonly monitoredTxId: string;
  readonly mockTxid: string;
  readonly blockHeight: number;
  readonly mock: true;
  readonly notARealTx: true;
}
