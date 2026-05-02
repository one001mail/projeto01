/**
 * Queue port.
 *
 * Abstract contract for asynchronous job queues (BullMQ, Redis Streams,
 * SQS, etc.). The port is intentionally narrow so adapters can be swapped
 * without touching the application layer. Concrete adapters live under
 * `infra/queue/` (e.g. `noop-queue.ts`, future `bullmq-queue.ts`).
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
