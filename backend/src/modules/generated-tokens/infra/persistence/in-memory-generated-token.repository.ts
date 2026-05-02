/**
 * In-memory implementation of `GeneratedTokenRepository` for tests and
 * sandbox runs without Postgres. Store is local to the instance — not
 * shared across requests in production.
 */
import type { GeneratedToken } from '../../domain/entities/generated-token.entity.js';
import type { GeneratedTokenRepository } from '../../domain/repositories/generated-token.repository.js';

export class InMemoryGeneratedTokenRepository implements GeneratedTokenRepository {
  private byId: Map<string, GeneratedToken> = new Map();
  private byToken: Map<string, string> = new Map();

  async save(token: GeneratedToken): Promise<void> {
    this.byId.set(token.id, token);
    this.byToken.set(token.token.toString(), token.id);
  }

  async update(token: GeneratedToken): Promise<void> {
    this.byId.set(token.id, token);
  }

  async findById(id: string): Promise<GeneratedToken | null> {
    return this.byId.get(id) ?? null;
  }

  async findByToken(value: string): Promise<GeneratedToken | null> {
    const id = this.byToken.get(value);
    if (!id) return null;
    return this.byId.get(id) ?? null;
  }

  async listExpiredActive(now: Date, limit: number): Promise<readonly GeneratedToken[]> {
    const out: GeneratedToken[] = [];
    for (const t of this.byId.values()) {
      if (out.length >= limit) break;
      if (!t.status.isActive()) continue;
      if (t.expiresAt && t.expiresAt.getTime() <= now.getTime()) {
        out.push(t);
      }
    }
    return out;
  }

  reset(): void {
    this.byId.clear();
    this.byToken.clear();
  }

  size(): number {
    return this.byId.size;
  }
}
