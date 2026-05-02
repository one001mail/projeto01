/**
 * Best-effort Postgres probe used by the composition root.
 *
 * Returns `true` when a trivial `SELECT 1` succeeds inside the configured
 * timeout, `false` otherwise. Swallows every error by design: this probe
 * is a routing decision, never an error source.
 *
 * The underlying `pg.Pool` is left intact for production use; only the
 * initial probe client is released after the check.
 */
import type { Pool } from 'pg';

export interface ProbePostgresOptions {
  /** Max wall-clock time for the probe, in ms. Defaults to 1500 ms. */
  timeoutMs?: number;
}

export async function probePostgres(
  pool: Pool,
  options: ProbePostgresOptions = {},
): Promise<boolean> {
  const timeoutMs = options.timeoutMs ?? 1_500;

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const settle = (value: boolean): void => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const timer = setTimeout(() => settle(false), timeoutMs);
    timer.unref();

    pool
      .connect()
      .then(async (client) => {
        try {
          await client.query('SELECT 1');
          settle(true);
        } catch {
          settle(false);
        } finally {
          try {
            client.release();
          } catch {
            /* ignore */
          }
          clearTimeout(timer);
        }
      })
      .catch(() => {
        clearTimeout(timer);
        settle(false);
      });
  });
}
