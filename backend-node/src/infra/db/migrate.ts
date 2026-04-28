/**
 * Migration runner stub.
 *
 * In phase B2 this will read SQL files from `src/infra/db/migrations/` and
 * apply them transactionally with a `schema_migrations` table. For now it
 * exits cleanly so `npm run migrate` is wired and CI doesn't break.
 */
import { loadConfig } from '../../app/config.js';
import { closePostgres, getPool } from './postgres.js';

async function run(): Promise<void> {
  const config = loadConfig();
  // eslint-disable-next-line no-console
  console.log(`[migrate] target = ${config.DATABASE_URL.replace(/:[^:@]*@/, ':***@')}`);

  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      // eslint-disable-next-line no-console
      console.log('[migrate] connection ok — no migrations defined yet (phase B1).');
    } finally {
      client.release();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[migrate] failed:', err);
    process.exitCode = 1;
  } finally {
    await closePostgres();
  }
}

run();
