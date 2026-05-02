export const ADDRESS_EXPIRED_EVENT = 'address-generator.address-expired';

export interface AddressExpiredPayload {
  readonly addressTokenId: string;
  readonly mock: true;
}
