import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { AddressGeneratorRepository } from '../../domain/repositories/address-generator.repository.js';

export interface GetAddressMetadataResult {
  readonly id: string;
  readonly namespace: string;
  readonly status: string;
  readonly expiresAt: string | null;
  readonly disclaimer: string;
}

export type GetAddressMetadataError = { kind: 'NOT_FOUND'; message: string };

export class GetAddressMetadataUseCase {
  constructor(private readonly repo: AddressGeneratorRepository) {}

  async execute(input: {
    id: string;
  }): Promise<Ok<GetAddressMetadataResult> | Err<GetAddressMetadataError>> {
    const entity = await this.repo.findById(input.id);
    if (!entity) return err({ kind: 'NOT_FOUND', message: 'address not found' });
    return ok({
      id: entity.id,
      namespace: entity.namespace,
      status: entity.status,
      expiresAt: entity.expiresAt,
      disclaimer: 'SANDBOX-ONLY mock token. Not a wallet.',
    });
  }
}
