/**
 * Logger port.
 *
 * Application code depends on this interface, never on Pino directly.
 * The Fastify plugin and standalone scripts each provide an adapter.
 */
export interface LogFn {
  (msg: string): void;
  (obj: Record<string, unknown>, msg?: string): void;
}

export interface Logger {
  trace: LogFn;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  fatal: LogFn;
  /** Returns a child logger that adds the given bindings to every event. */
  child(bindings: Record<string, unknown>): Logger;
}
