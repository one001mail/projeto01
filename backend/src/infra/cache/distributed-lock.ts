/**
 * Distributed lock (sandbox).
 *
 * Minimal in-process lock. Real deployments should swap for a Redis-based
 * implementation (SET NX PX + fencing token). This stub keeps the master-
 * prompt surface in place without pulling additional dependencies.
 */
export interface DistributedLock {
  acquire(key: string, ttlMs: number): Promise<LockHandle | null>;
}

export interface LockHandle {
  readonly key: string;
  release(): Promise<void>;
}

export class InMemoryDistributedLock implements DistributedLock {
  private readonly held = new Map<string, number>();

  async acquire(key: string, ttlMs: number): Promise<LockHandle | null> {
    const now = Date.now();
    const existing = this.held.get(key);
    if (existing && existing > now) return null;
    this.held.set(key, now + ttlMs);
    return {
      key,
      release: async () => {
        this.held.delete(key);
      },
    };
  }
}

export const distributedLock: DistributedLock = new InMemoryDistributedLock();
