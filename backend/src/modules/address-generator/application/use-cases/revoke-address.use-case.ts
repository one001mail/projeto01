import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { AddressGeneratorRepository } from '../../domain/repositories/address-generator.repository.js';

export interface RevokeAddressCommand {
  readonly id: string;
}

export type RevokeAddressError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'NOT_FOUND'; message: string };

export class RevokeAddressUseCase {
  constructor(private readonly repo: AddressGeneratorRepository) {}

  async execute(
    cmd: RevokeAddressCommand,
  ): Promise<Ok<{ id: string; status: 'revoked' }> | Err<RevokeAddressError>> {
    if (!cmd.id) return err({ kind: 'INVALID_INPUT', message: 'id required' });
    const entity = await this.repo.findById(cmd.id);
    if (!entity) return err({ kind: 'NOT_FOUND', message: 'address not found' });
    entity.revoke();
    await this.repo.save(entity);
    return ok({ id: entity.id, status: 'revoked' });
  }
}
