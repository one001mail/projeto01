/**
 * Scheduler worker (F4).
 *
 * Generic periodic ticker: `start()` installs a timer that calls `tick()`
 * every `intervalMs`. Ticks never overlap — if a previous tick is still in
 * flight when the timer fires, the new fire is skipped. `stop()` cancels
 * the timer and awaits the in-flight tick (if any).
 *
 * Used by F4 to drive the outbox dispatcher; the same primitive will back
 * the idempotency sweeper and future housekeeping jobs.
 */
import type { Logger } from '../../shared/application/ports/logger.port.js';

export type SchedulerTick = () => Promise<void>;

export interface SchedulerWorkerOptions {
  /** Human-readable name for logs / metrics. */
  name: string;
  /** Callback executed on every tick. Exceptions are caught and logged. */
  tick: SchedulerTick;
  /** Interval between tick firings, in milliseconds. Must be positive. */
  intervalMs: number;
  /** When true, fires one tick immediately on `start()`. Default: false. */
  runOnStart?: boolean;
  /** Optional structured logger; falls back to silent when omitted. */
  logger?: Logger;
}

export interface SchedulerWorker {
  start(): void;
  stop(): Promise<void>;
  readonly isRunning: boolean;
}

export function createSchedulerWorker(options: SchedulerWorkerOptions): SchedulerWorker {
  const { name, tick, intervalMs, runOnStart = false, logger } = options;
  if (intervalMs <= 0) {
    throw new Error(`scheduler-worker(${name}): intervalMs must be > 0`);
  }

  let timer: NodeJS.Timeout | null = null;
  let running = false;
  let inflight: Promise<void> | null = null;

  const runTick = (): Promise<void> => {
    if (inflight) return inflight; // skip overlapping fire
    inflight = (async () => {
      try {
        await tick();
      } catch (err) {
        logger?.warn({ err, worker: name }, 'scheduler tick failed');
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  };

  return {
    get isRunning(): boolean {
      return running;
    },

    start(): void {
      if (running) return;
      running = true;
      if (runOnStart) {
        // Fire-and-forget; errors are captured inside runTick.
        void runTick();
      }
      timer = setInterval(() => {
        if (!running) return;
        void runTick();
      }, intervalMs);
      // Do not keep the event loop alive purely for the scheduler.
      timer.unref();
      logger?.info({ worker: name, intervalMs }, 'scheduler worker started');
    },

    async stop(): Promise<void> {
      if (!running) return;
      running = false;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      if (inflight) {
        try {
          await inflight;
        } catch {
          /* already logged by runTick */
        }
      }
      logger?.info({ worker: name }, 'scheduler worker stopped');
    },
  };
}
