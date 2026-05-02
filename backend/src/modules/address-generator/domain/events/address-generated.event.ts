/**
 * Event names emitted by address-generator. All events are sandbox-only.
 */
export const ADDRESS_GENERATED = 'address-generator.address-generated';
export const ADDRESS_EXPIRED = 'address-generator.address-expired';

export interface AddressGeneratedPayload {
  readonly addressTokenId: string;
  readonly namespace: string;
  readonly mockSessionId: string | null;
  readonly mock: true;
  readonly notAWallet: true;
}
