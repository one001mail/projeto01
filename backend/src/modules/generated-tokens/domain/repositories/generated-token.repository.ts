/**
 * GeneratedTokenRepository PORT.
 *
 * Persistence-agnostic CRUD-ish surface for the aggregate. Implementations
 * live under `infra/persistence/`.
 */
import type { GeneratedToken } from '../entities/generated-token.entity.js';

export interface GeneratedTokenRepository {
  save(token: GeneratedToken): Promise<void>;
  update(token: GeneratedToken): Promise<void>;
  findById(id: string): Promise<GeneratedToken | null>;
  findByToken(value: string): Promise<GeneratedToken | null>;
  /** Returns ids whose TTL elapsed and are still 'active'. */
  listExpiredActive(now: Date, limit: number): Promise<readonly GeneratedToken[]>;
}
