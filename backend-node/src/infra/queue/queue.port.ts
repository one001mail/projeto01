/**
 * Queue Port.
 *
 * Abstract contract for asynchronous job queues (BullMQ, Redis Streams,
 * SQS, etc.). The port is intentionally narrow so adapters can be swapped
 * without touching the application layer.
 *
 * Phase B1.5 ships a no-op adapter so the container can be assembled and
 * tests can run without a queue backend. A real adapter (BullMQ on Redis)
 * lands in B3 alongside the outbox dispatcher.
 */
export interface QueueJob<TPayload = unknown> {
  readonly name: string;
  readonly payload: TPayload;
  readonly options?: QueueJobOptions;
}

export interface QueueJobOptions {
  /** Delay in milliseconds before the job becomes available to workers. */
  readonly delayMs?: number;
  /** Maximum retry attempts on failure. */
  readonly attempts?: number;
  /** Optional client-supplied idempotency key. */
  readonly idempotencyKey?: string;
}

export type JobHandler<TPayload = unknown> = (job: QueueJob<TPayload>) => Promise<void>;

export interface QueuePort {
  /** Enqueue a single job. Returns the assigned job id. */
  enqueue<TPayload>(job: QueueJob<TPayload>): Promise<string>;
  /** Register a handler for jobs of the given name. */
  process<TPayload>(name: string, handler: JobHandler<TPayload>): void;
  /** Releases workers/connections. Idempotent. */
  close(): Promise<void>;
}

export function createNoopQueue(): QueuePort {
  return {
    async enqueue() {
      // Phase B1.5: no backend wired yet. Real adapter lands in B3.
      return crypto.randomUUID();
    },
    process() {
      /* no-op until a real adapter is wired */
    },
    async close() {
      /* no-op */
    },
  };
}
