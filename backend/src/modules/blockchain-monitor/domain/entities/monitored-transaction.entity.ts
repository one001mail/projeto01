/**
 * Blockchain Monitor module — SANDBOX-ONLY, MOCK ONLY.
 *
 * Does NOT connect to Bitcoin, Ethereum, mempool, RPC or any external
 * blockchain source. All events are synthesized from an in-memory mock
 * provider. No funds are observed. No transactions are broadcast.
 */
import { makeDomainEvent } from '../../../../shared/domain/domain-event.js';

export type ConfirmationStatus = 'pending' | 'observed' | 'confirmed';

export interface MonitoredTransactionProps {
  readonly id: string;
  readonly txid: string; // mocktx_*
  readonly blockHeight: number | null;
  readonly confirmations: number;
  readonly status: ConfirmationStatus;
  readonly observedAt: Date;
}

export class MonitoredTransaction {
  private constructor(private props: MonitoredTransactionProps) {}

  static register(input: { id: string; txid: string; now?: Date }): MonitoredTransaction {
    if (!input.txid.startsWith('mocktx_')) {
      throw new Error('txid must be a sandbox mock txid (prefix "mocktx_")');
    }
    return new MonitoredTransaction({
      id: input.id,
      txid: input.txid,
      blockHeight: null,
      confirmations: 0,
      status: 'pending',
      observedAt: input.now ?? new Date(),
    });
  }

  observe(blockHeight: number): ReturnType<typeof makeDomainEvent> {
    this.props = {
      ...this.props,
      blockHeight,
      confirmations: 1,
      status: 'observed',
    };
    return makeDomainEvent({
      eventName: 'blockchain-monitor.deposit-detected',
      aggregateId: this.props.id,
      payload: {
        monitoredTxId: this.props.id,
        mockTxid: this.props.txid,
        blockHeight,
        mock: true,
        notARealTx: true,
      },
    });
  }

  confirm(threshold: number): ReturnType<typeof makeDomainEvent> | null {
    this.props = { ...this.props, confirmations: this.props.confirmations + 1 };
    if (this.props.confirmations >= threshold && this.props.status !== 'confirmed') {
      this.props = { ...this.props, status: 'confirmed' };
      return makeDomainEvent({
        eventName: 'blockchain-monitor.deposit-confirmed',
        aggregateId: this.props.id,
        payload: {
          monitoredTxId: this.props.id,
          mockTxid: this.props.txid,
          confirmations: this.props.confirmations,
          mock: true,
        },
      });
    }
    return null;
  }

  get id(): string {
    return this.props.id;
  }
  get status(): ConfirmationStatus {
    return this.props.status;
  }
  get txid(): string {
    return this.props.txid;
  }
  get confirmations(): number {
    return this.props.confirmations;
  }
}

export const CONFIRMATION_THRESHOLD_DEFAULT = 3;
