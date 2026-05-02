/**
 * Repository port for address tokens.
 */
import type { AddressToken } from '../entities/address-token.entity.js';

export interface AddressGeneratorRepository {
  save(token: AddressToken): Promise<void>;
  findById(id: string): Promise<AddressToken | null>;
  listByNamespace(namespace: string, limit: number): Promise<readonly AddressToken[]>;
}
