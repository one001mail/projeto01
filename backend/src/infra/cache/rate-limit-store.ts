/**
 * Rate-limit store (sandbox in-memory).
 *
 * Fastify's rate-limit plugin owns the authoritative store. This module
 * keeps a tiny in-memory counter for custom uses (domain-level throttling)
 * and exists mostly for architectural parity with the master prompt.
 */
export interface RateLimitStore {
  take(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number };
  reset(key: string): void;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, Bucket>();

  take(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: Math.max(0, limit - 1) };
    }
    if (bucket.count >= limit) return { allowed: false, remaining: 0 };
    bucket.count += 1;
    return { allowed: true, remaining: Math.max(0, limit - bucket.count) };
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }
}

export const rateLimitStore: RateLimitStore = new InMemoryRateLimitStore();
