import { makeDomainEvent } from '../../../../shared/domain/domain-event.js';

export interface AddressGeneratedPayload extends Record<string, unknown> {
  readonly walletId: string;
  readonly network: string;
  readonly asset: string;
  readonly address: string;
  readonly addressIndex: number;
}

export function addressGeneratedEvent(payload: AddressGeneratedPayload) {
  return makeDomainEvent({
    eventName: 'wallet.address-generated',
    aggregateId: payload.walletId,
    payload,
  });
}
