/**
 * PG-backed `GeneratedTokenRepository`.
 *
 * Speaks to the existing `generated_tokens` table:
 *   id uuid pk, token text unique, namespace text, status text, payload
 *   jsonb, created_at timestamptz, expires_at timestamptz nullable.
 *
 * Status values map onto the domain `TokenStatus` value object. Metadata
 * is stored under the JSONB `payload` column.
 */
import type { TransactionManager } from '../../../../shared/application/ports/transaction-manager.port.js';
import { GeneratedToken } from '../../domain/entities/generated-token.entity.js';
import type { GeneratedTokenRepository } from '../../domain/repositories/generated-token.repository.js';
import { SandboxToken } from '../../domain/value-objects/sandbox-token.vo.js';
import { TokenNamespace } from '../../domain/value-objects/token-namespace.vo.js';

interface GeneratedTokenRow {
  id: string;
  token: string;
  namespace: string;
  status: string;
  payload: Record<string, unknown> | null;
  created_at: Date;
  expires_at: Date | null;
}

function rowToEntity(row: GeneratedTokenRow): GeneratedToken {
  const status =
    row.status === 'active' || row.status === 'revoked' || row.status === 'expired'
      ? row.status
      : 'active';
  const payload = row.payload ?? {};
  const metadata: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload)) {
    metadata[k] = typeof v === 'string' ? v : JSON.stringify(v ?? '');
  }
  return GeneratedToken.restore({
    id: row.id,
    namespace: TokenNamespace.fromString(row.namespace),
    token: SandboxToken.fromString(row.token),
    status,
    metadata,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  });
}

export function createPgGeneratedTokenRepository(tm: TransactionManager): GeneratedTokenRepository {
  return {
    async save(token: GeneratedToken): Promise<void> {
      const r = tm.getCurrentRunner();
      await r.query(
        `INSERT INTO generated_tokens (id, token, namespace, status, payload, created_at, expires_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)`,
        [
          token.id,
          token.token.toString(),
          token.namespace.toString(),
          token.status.toString(),
          JSON.stringify(token.metadata),
          token.createdAt,
          token.expiresAt,
        ],
      );
    },

    async update(token: GeneratedToken): Promise<void> {
      const r = tm.getCurrentRunner();
      await r.query(
        `UPDATE generated_tokens
         SET status = $2, payload = $3::jsonb, expires_at = $4
         WHERE id = $1`,
        [token.id, token.status.toString(), JSON.stringify(token.metadata), token.expiresAt],
      );
    },

    async findById(id: string): Promise<GeneratedToken | null> {
      const r = tm.getCurrentRunner();
      const res = await r.query<GeneratedTokenRow>(
        `SELECT id, token, namespace, status, payload, created_at, expires_at
         FROM generated_tokens WHERE id = $1`,
        [id],
      );
      const row = res.rows[0];
      return row ? rowToEntity(row) : null;
    },

    async findByToken(value: string): Promise<GeneratedToken | null> {
      const r = tm.getCurrentRunner();
      const res = await r.query<GeneratedTokenRow>(
        `SELECT id, token, namespace, status, payload, created_at, expires_at
         FROM generated_tokens WHERE token = $1`,
        [value],
      );
      const row = res.rows[0];
      return row ? rowToEntity(row) : null;
    },

    async listExpiredActive(now: Date, limit: number): Promise<readonly GeneratedToken[]> {
      const r = tm.getCurrentRunner();
      const res = await r.query<GeneratedTokenRow>(
        `SELECT id, token, namespace, status, payload, created_at, expires_at
         FROM generated_tokens
         WHERE status = 'active'
           AND expires_at IS NOT NULL
           AND expires_at <= $1
         ORDER BY expires_at ASC
         LIMIT $2`,
        [now, limit],
      );
      return res.rows.map(rowToEntity);
    },
  };
}
