/**
 * In-memory ContactRequest repository.
 */
import { ContactRequest, type ContactRequestProps } from '../domain/contact-request.entity.js';
import type { ContactRequestRepository } from '../domain/contact-request.repository.js';

export class InMemoryContactRequestRepository implements ContactRequestRepository {
  private readonly store = new Map<string, ContactRequestProps>();

  async save(request: ContactRequest): Promise<void> {
    this.store.set(request.id, request.toJSON());
  }

  /** Test helpers. */
  size(): number {
    return this.store.size;
  }
  list(): ContactRequest[] {
    return Array.from(this.store.values()).map((p) => ContactRequest.restore(p));
  }
  reset(): void {
    this.store.clear();
  }
}
