import { makeDomainEvent } from '../../../../shared/domain/domain-event.js';

export interface TransactionPreparedPayload extends Record<string, unknown> {
  readonly walletId: string;
  readonly transactionId: string;
  readonly network: string;
  readonly asset: string;
  readonly amount: string;
}

export function transactionPreparedEvent(payload: TransactionPreparedPayload) {
  return makeDomainEvent({
    eventName: 'wallet.transaction-prepared',
    aggregateId: payload.transactionId,
    payload,
  });
}
