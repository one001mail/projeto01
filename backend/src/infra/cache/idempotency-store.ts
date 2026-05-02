/**
 * Idempotency-store re-export.
 *
 * Consumers import from a stable path (`infra/cache/idempotency-store.js`);
 * implementation stays under `infra/idempotency/` to keep the domain port
 * colocated with its adapters.
 */
export { InMemoryIdempotencyStore as IdempotencyStore } from '../idempotency/in-memory-idempotency.store.js';
