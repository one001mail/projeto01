/**
 * In-memory IdempotencyStore.
 *
 * Used by tests and by single-process dev runs without Postgres. Maintains
 * the same semantics as the PG adapter: HIT on key + matching hash, MISMATCH
 * on key + different hash, MISS otherwise. Honours `expiresAt`.
 */
import type {
  IdempotencyLookup,
  IdempotencyRecord,
  IdempotencyStore,
} from '../../shared/application/ports/idempotency-store.port.js';

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly map = new Map<string, IdempotencyRecord>();

  async lookup(key: string, requestHash: string): Promise<IdempotencyLookup> {
    const rec = this.map.get(key);
    if (!rec) return { outcome: 'MISS' };
    if (rec.expiresAt.getTime() <= Date.now()) {
      this.map.delete(key);
      return { outcome: 'MISS' };
    }
    if (rec.requestHash !== requestHash) {
      return { outcome: 'MISMATCH', storedHash: rec.requestHash };
    }
    return { outcome: 'HIT', record: rec };
  }

  async save(record: IdempotencyRecord): Promise<void> {
    // Last writer wins on the same key (matches PG ON CONFLICT DO NOTHING
    // semantics paired with up-front lookup). The middleware never calls
    // save() after seeing HIT, so this only fires on MISS.
    this.map.set(record.key, record);
  }

  async sweepExpired(now: Date): Promise<number> {
    let removed = 0;
    for (const [k, rec] of this.map) {
      if (rec.expiresAt.getTime() <= now.getTime()) {
        this.map.delete(k);
        removed++;
      }
    }
    return removed;
  }

  /** Test helper: snapshot of stored keys. */
  size(): number {
    return this.map.size;
  }
}
