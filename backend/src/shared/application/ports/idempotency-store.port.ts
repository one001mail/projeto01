/**
 * Idempotency-store port.
 *
 * Backs the idempotency-key middleware (B4). The store records the response
 * once a request completes and replays it for subsequent calls with the
 * same key + matching request hash. Mismatched bodies for the same key
 * surface as a `MISMATCH` outcome so the HTTP layer can return 409.
 */
export interface IdempotencyRecord {
  key: string;
  requestHash: string;
  statusCode: number;
  responseBody: unknown;
  expiresAt: Date;
  createdAt: Date;
}

export type IdempotencyLookup =
  | { outcome: 'HIT'; record: IdempotencyRecord }
  | { outcome: 'MISS' }
  | { outcome: 'MISMATCH'; storedHash: string };

export interface IdempotencyStore {
  lookup(key: string, requestHash: string): Promise<IdempotencyLookup>;
  save(record: IdempotencyRecord): Promise<void>;
  /** Drops expired rows. Called by a periodic sweeper. */
  sweepExpired(now: Date): Promise<number>;
}
