import { makeDomainEvent } from '../../../../shared/domain/domain-event.js';

export interface BlockchainBalanceUpdatedPayload extends Record<string, unknown> {
  readonly walletId: string;
  readonly network: string;
  readonly address: string;
  readonly asset: string;
  readonly confirmedBalance: string;
  readonly pendingBalance: string;
  readonly observedAt: string;
}

export function blockchainBalanceUpdatedEvent(payload: BlockchainBalanceUpdatedPayload) {
  return makeDomainEvent({
    eventName: 'wallet.blockchain-balance-updated',
    aggregateId: payload.walletId,
    payload,
  });
}
