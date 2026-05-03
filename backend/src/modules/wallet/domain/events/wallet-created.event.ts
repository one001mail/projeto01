/**
 * wallet.created domain event helper.
 *
 * Raised by `Wallet.create()`. Carries only public metadata.
 */
import { makeDomainEvent } from '../../../../shared/domain/domain-event.js';

export interface WalletCreatedPayload extends Record<string, unknown> {
  readonly walletId: string;
  readonly mode: 'non_custodial' | 'custodial';
  readonly ownerRef: string;
  readonly supportedNetworks: readonly string[];
}

export function walletCreatedEvent(payload: WalletCreatedPayload) {
  return makeDomainEvent({
    eventName: 'wallet.created',
    aggregateId: payload.walletId,
    payload,
  });
}
