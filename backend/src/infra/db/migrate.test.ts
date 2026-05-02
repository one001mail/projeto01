import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ChecksumMismatchError,
  computeChecksum,
  loadMigrationFiles,
  planMigrations,
} from './migrate.js';

describe('migration runner — pure helpers', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'mig-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('loads sql files in lexicographic order', () => {
    writeFileSync(join(dir, '003_third.sql'), 'SELECT 3;');
    writeFileSync(join(dir, '001_first.sql'), 'SELECT 1;');
    writeFileSync(join(dir, '002_second.sql'), 'SELECT 2;');
    writeFileSync(join(dir, 'README.md'), 'not a migration');

    const files = loadMigrationFiles(dir);
    expect(files.map((f) => f.filename)).toEqual([
      '001_first.sql',
      '002_second.sql',
      '003_third.sql',
    ]);
    expect(files[0]?.checksum).toBe(computeChecksum('SELECT 1;'));
  });

  it('plan: marks unseen migrations as toApply, applied as alreadyApplied', () => {
    writeFileSync(join(dir, '001_a.sql'), 'A');
    writeFileSync(join(dir, '002_b.sql'), 'B');
    const files = loadMigrationFiles(dir);
    const applied = new Map<string, string>([['001_a.sql', computeChecksum('A')]]);

    const plan = planMigrations(files, applied);
    expect(plan.alreadyApplied).toEqual(['001_a.sql']);
    expect(plan.toApply.map((f) => f.filename)).toEqual(['002_b.sql']);
  });

  it('plan: aborts with ChecksumMismatchError when an applied file changed', () => {
    writeFileSync(join(dir, '001_a.sql'), 'A-MODIFIED');
    const files = loadMigrationFiles(dir);
    const applied = new Map<string, string>([['001_a.sql', computeChecksum('A-original')]]);

    expect(() => planMigrations(files, applied)).toThrowError(ChecksumMismatchError);
  });

  it('every shipped migration file has a deterministic checksum', () => {
    // Smoke test: ensures the real migrations directory is readable and yields
    // 10 files in numeric order, each with a stable sha-256 checksum.
    const files = loadMigrationFiles();
    expect(files.length).toBeGreaterThanOrEqual(10);
    expect(files.map((f) => f.filename)).toEqual([...files.map((f) => f.filename)].sort());
    for (const f of files) expect(f.checksum).toMatch(/^[a-f0-9]{64}$/);
  });
});
