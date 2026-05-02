/**
 * Job runner — SANDBOX.
 *
 * Dispatches a job by name against a local registry. The canonical queue
 * abstraction is `src/shared/application/ports/queue.port.ts`; the
 * default adapter is the noop queue. This runner is a tiny helper that
 * lets modules execute their jobs directly during tests or in-process
 * workers without a real broker.
 */
export type JobHandler<TInput = unknown, TOutput = unknown> = (input: TInput) => Promise<TOutput>;

export interface JobRunnerRegistry {
  register<TInput, TOutput>(name: string, handler: JobHandler<TInput, TOutput>): void;
  run<TInput, TOutput>(name: string, input: TInput): Promise<TOutput>;
  has(name: string): boolean;
}

export function createJobRunner(): JobRunnerRegistry {
  const handlers = new Map<string, JobHandler>();
  return {
    register(name, handler) {
      handlers.set(name, handler as JobHandler);
    },
    async run<TInput, TOutput>(name: string, input: TInput): Promise<TOutput> {
      const handler = handlers.get(name);
      if (!handler) throw new Error(`Job handler not registered: ${name}`);
      return (await handler(input)) as TOutput;
    },
    has(name: string): boolean {
      return handlers.has(name);
    },
  };
}

/** Process-wide default runner. */
export const jobRunner: JobRunnerRegistry = createJobRunner();
