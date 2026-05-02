/**
 * Job dispatcher (sandbox).
 *
 * Thin wrapper on top of the shared queue port / local job runner.
 * Today it routes to the in-process runner; production would publish to
 * BullMQ/Redis.
 */
import { jobRunner } from './job-runner.js';

export interface JobDispatcher {
  dispatch<TInput>(name: string, input: TInput): Promise<void>;
}

export const jobDispatcher: JobDispatcher = {
  async dispatch<TInput>(name: string, input: TInput): Promise<void> {
    if (!jobRunner.has(name)) return;
    await jobRunner.run(name, input);
  },
};
