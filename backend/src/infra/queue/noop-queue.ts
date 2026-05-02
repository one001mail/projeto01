/**
 * No-op queue adapter.
 *
 * Satisfies `QueuePort` without any backend wired. Used while no real queue
 * is required; the production adapter (BullMQ on Redis) will replace it
 * transparently via the composition root.
 */
import type { JobHandler, QueueJob, QueuePort } from '../../shared/application/ports/queue.port.js';

export function createNoopQueue(): QueuePort {
  return {
    async enqueue<TPayload>(_job: QueueJob<TPayload>): Promise<string> {
      return crypto.randomUUID();
    },
    process<TPayload>(_name: string, _handler: JobHandler<TPayload>): void {
      /* no-op until a real adapter is wired */
    },
    async close(): Promise<void> {
      /* no-op */
    },
  };
}
