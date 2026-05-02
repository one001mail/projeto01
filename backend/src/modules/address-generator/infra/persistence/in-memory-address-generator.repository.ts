import type { AddressToken } from '../../domain/entities/address-token.entity.js';
import type { AddressGeneratorRepository } from '../../domain/repositories/address-generator.repository.js';

export class InMemoryAddressGeneratorRepository implements AddressGeneratorRepository {
  private readonly store = new Map<string, AddressToken>();

  async save(token: AddressToken): Promise<void> {
    this.store.set(token.id, token);
  }

  async findById(id: string): Promise<AddressToken | null> {
    return this.store.get(id) ?? null;
  }

  async listByNamespace(namespace: string, limit: number): Promise<readonly AddressToken[]> {
    return [...this.store.values()]
      .filter((t) => t.namespace === namespace)
      .slice(0, Math.max(0, limit));
  }

  reset(): void {
    this.store.clear();
  }
}
