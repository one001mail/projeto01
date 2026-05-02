/**
 * PostgreSQL IdempotencyStore.
 *
 * Reads/writes the `idempotency_keys` table (migration 009). The middleware
 * looks up by primary key, then — if no row — the request runs and the
 * middleware calls `save()` after the response is final.
 *
 * Concurrency note:
 *   * Two concurrent requests with the same `Idempotency-Key` may both
 *     observe MISS. The PRIMARY KEY constraint on `key` then ensures only
 *     one INSERT wins; the loser becomes a MISMATCH on the next pass.
 *     For the purposes of the educational sandbox this is acceptable. A
 *     stronger guarantee (advisory lock + INSERT ... ON CONFLICT) is doable
 *     in a future iteration without changing the port.
 */
import type {
  IdempotencyLookup,
  IdempotencyRecord,
  IdempotencyStore,
} from '../../shared/application/ports/idempotency-store.port.js';
import type { QueryRunner } from '../../shared/application/ports/transaction-manager.port.js';

export interface PgIdempotencyStoreDeps {
  /** Returns the runner active for the current request (transactional or pool). */
  defaultRunner: () => QueryRunner;
}

interface Row {
  key: string;
  request_hash: string;
  status_code: number | null;
  response_body: unknown;
  expires_at: string;
  created_at: string;
}

export function createPgIdempotencyStore(deps: PgIdempotencyStoreDeps): IdempotencyStore {
  return {
    async lookup(key, requestHash): Promise<IdempotencyLookup> {
      const r = await deps.defaultRunner().query<Row>(
        'SELECT key, request_hash, status_code, response_body, expires_at, created_at \
           FROM idempotency_keys WHERE key = $1 LIMIT 1',
        [key],
      );
      const row = r.rows[0];
      if (!row) return { outcome: 'MISS' };

      const expiresAt = new Date(row.expires_at);
      if (expiresAt.getTime() <= Date.now()) {
        // Expired — treat as MISS. The sweeper will physically delete it.
        return { outcome: 'MISS' };
      }
      if (row.request_hash !== requestHash) {
        return { outcome: 'MISMATCH', storedHash: row.request_hash };
      }
      return {
        outcome: 'HIT',
        record: {
          key: row.key,
          requestHash: row.request_hash,
          statusCode: row.status_code ?? 200,
          responseBody: row.response_body,
          expiresAt,
          createdAt: new Date(row.created_at),
        },
      };
    },

    async save(record: IdempotencyRecord): Promise<void> {
      await deps.defaultRunner().query(
        'INSERT INTO idempotency_keys (key, request_hash, response_body, status_code, expires_at) \
           VALUES ($1, $2, $3::jsonb, $4, $5) ON CONFLICT (key) DO NOTHING',
        [
          record.key,
          record.requestHash,
          JSON.stringify(record.responseBody ?? null),
          record.statusCode,
          record.expiresAt.toISOString(),
        ],
      );
    },

    async sweepExpired(now: Date): Promise<number> {
      const r = await deps
        .defaultRunner()
        .query('DELETE FROM idempotency_keys WHERE expires_at <= $1', [now.toISOString()]);
      return r.rowCount ?? 0;
    },
  };
}
