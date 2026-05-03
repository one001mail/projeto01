import { makeDomainEvent } from '../../../../shared/domain/domain-event.js';

export interface TransactionBroadcastedPayload extends Record<string, unknown> {
  readonly walletId: string;
  readonly transactionId: string;
  readonly network: string;
  readonly txHash: string;
}

export function transactionBroadcastedEvent(payload: TransactionBroadcastedPayload) {
  return makeDomainEvent({
    eventName: 'wallet.transaction-broadcasted',
    aggregateId: payload.transactionId,
    payload,
  });
}
