/**
 * Migration runner.
 *
 * Discovers `*.sql` files alongside this module, computes a sha-256 checksum
 * for each, and applies them in filename order. State lives in the
 * `schema_migrations` table. Each migration runs inside its own transaction
 * so a failure rolls back without partial state. A stored checksum that
 * differs from the on-disk file aborts the run — migrations are append-only.
 *
 * Pure helpers (`loadMigrationFiles`, `planMigrations`, `ChecksumMismatchError`)
 * are exported for unit tests so the planning logic can be exercised without
 * a real database.
 *
 * CLI:
 *   yarn migrate                 — apply pending migrations
 *   yarn migrate --dry-run       — print plan, do not execute
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PoolClient } from 'pg';
import { loadConfig } from '../../app/config.js';
import { buildStandaloneLogger } from '../logging/logger.js';
import { closePostgres, getPool } from './postgres.js';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

export interface MigrationFile {
  filename: string;
  sql: string;
  checksum: string;
}

export class ChecksumMismatchError extends Error {
  constructor(
    public readonly filename: string,
    public readonly stored: string,
    public readonly current: string,
  ) {
    super(
      `Checksum mismatch for migration "${filename}": stored=${stored.slice(0, 12)}… current=${current.slice(0, 12)}…. ` +
        'Migrations are append-only — do not edit applied files.',
    );
    this.name = 'ChecksumMismatchError';
  }
}

export function computeChecksum(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/** Reads every `*.sql` file in `dir`, sorted by filename ascending. */
export function loadMigrationFiles(dir: string = MIGRATIONS_DIR): MigrationFile[] {
  const filenames = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  return filenames.map((filename) => {
    const sql = readFileSync(join(dir, filename), 'utf8');
    return { filename, sql, checksum: computeChecksum(sql) };
  });
}

export interface MigrationPlan {
  toApply: MigrationFile[];
  alreadyApplied: string[];
}

/** Pure planner: decides which migrations to apply and verifies checksums. */
export function planMigrations(
  files: readonly MigrationFile[],
  applied: ReadonlyMap<string, string>,
): MigrationPlan {
  const toApply: MigrationFile[] = [];
  const alreadyApplied: string[] = [];
  for (const f of files) {
    const stored = applied.get(f.filename);
    if (stored !== undefined) {
      if (stored !== f.checksum) {
        throw new ChecksumMismatchError(f.filename, stored, f.checksum);
      }
      alreadyApplied.push(f.filename);
    } else {
      toApply.push(f);
    }
  }
  return { toApply, alreadyApplied };
}

async function ensureSchemaMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   text        PRIMARY KEY,
      checksum   text        NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function loadAppliedMap(client: PoolClient): Promise<Map<string, string>> {
  const r = await client.query<{ filename: string; checksum: string }>(
    'SELECT filename, checksum FROM schema_migrations',
  );
  return new Map(r.rows.map((row) => [row.filename, row.checksum]));
}

export interface RunOptions {
  dryRun?: boolean;
  migrationsDir?: string;
}

export interface RunResult {
  applied: string[];
  alreadyApplied: string[];
  dryRun: boolean;
}

export async function runMigrations(opts: RunOptions = {}): Promise<RunResult> {
  const config = loadConfig();
  const log = buildStandaloneLogger(config);
  const dir = opts.migrationsDir ?? MIGRATIONS_DIR;
  const dryRun = opts.dryRun ?? false;

  const files = loadMigrationFiles(dir);
  log.info({ count: files.length, dir, dryRun }, 'discovered migrations');

  const pool = getPool();
  const client = await pool.connect();

  try {
    await ensureSchemaMigrationsTable(client);
    const applied = await loadAppliedMap(client);
    const plan = planMigrations(files, applied);

    log.info(
      { toApply: plan.toApply.map((m) => m.filename), alreadyApplied: plan.alreadyApplied },
      'migration plan',
    );

    if (dryRun) {
      return {
        applied: plan.toApply.map((m) => m.filename),
        alreadyApplied: plan.alreadyApplied,
        dryRun,
      };
    }

    const applied2: string[] = [];
    for (const m of plan.toApply) {
      log.info({ filename: m.filename }, 'applying migration');
      try {
        await client.query('BEGIN');
        await client.query(m.sql);
        await client.query('INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)', [
          m.filename,
          m.checksum,
        ]);
        await client.query('COMMIT');
        applied2.push(m.filename);
        log.info({ filename: m.filename }, 'migration applied');
      } catch (err) {
        await client.query('ROLLBACK').catch(() => undefined);
        log.error({ filename: m.filename, err }, 'migration failed; rolled back');
        throw err;
      }
    }

    return { applied: applied2, alreadyApplied: plan.alreadyApplied, dryRun };
  } finally {
    client.release();
  }
}

// ---------- CLI entry ----------
function isDirectInvocation(): boolean {
  if (!process.argv[1]) return false;
  return import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('migrate.ts');
}

if (isDirectInvocation()) {
  const dryRun = process.argv.includes('--dry-run');
  runMigrations({ dryRun })
    .then((r) => {
      // biome-ignore lint/suspicious/noConsole: CLI script.
      console.log(
        `[migrate] ${r.dryRun ? '(dry-run) ' : ''}applied ${r.applied.length}, already-applied ${r.alreadyApplied.length}`,
      );
    })
    .catch((err) => {
      // biome-ignore lint/suspicious/noConsole: CLI script.
      console.error('[migrate] failed:', err);
      process.exitCode = 1;
    })
    .finally(() => closePostgres());
}
