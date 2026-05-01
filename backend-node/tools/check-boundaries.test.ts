/**
 * Tests for the boundary checker.
 *
 * The checker is enforcement infrastructure -- if it rots, boundary
 * violations slip through silently. These tests freeze its observable
 * behaviour: the script exits 0 on a clean tree and 1 with a structured
 * message when a file breaks the matrix.
 *
 * We exercise it as a subprocess so the test mirrors how CI runs it.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const SCRIPT = resolve(PROJECT_ROOT, 'tools/check-boundaries.ts');
const TSX = resolve(PROJECT_ROOT, 'node_modules/.bin/tsx');

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

function run(): RunResult {
  try {
    const out = execFileSync(TSX, [SCRIPT], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    return { status: 0, stdout: out, stderr: '' };
  } catch (e) {
    const err = e as { status?: number; stdout?: Buffer | string; stderr?: Buffer | string };
    return {
      status: typeof err.status === 'number' ? err.status : 1,
      stdout: err.stdout?.toString() ?? '',
      stderr: err.stderr?.toString() ?? '',
    };
  }
}

describe('tools/check-boundaries', () => {
  const STAGING: string[] = [];

  afterEach(() => {
    for (const p of STAGING.splice(0)) {
      rmSync(p, { recursive: true, force: true });
    }
  });

  function stage(relPath: string, content: string): string {
    const abs = resolve(PROJECT_ROOT, 'src', relPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf8');
    STAGING.push(abs);
    return abs;
  }

  it('exits 0 on the current tree (no violations)', () => {
    const res = run();
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('no boundary violations');
  });

  it('flags framework imports in pure layers', () => {
    stage(
      'shared/application/ports/_tmp_bad_port.ts',
      "import { Pool } from 'pg';\nexport const x = Pool;\n",
    );
    const res = run();
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('may not import framework package `pg`');
    expect(res.stdout).toContain('shared/application/ports/_tmp_bad_port.ts');
  });

  it('flags application -> infra imports', () => {
    stage(
      'modules/_template/application/_tmp_bad_uc.ts',
      "import { makeEvent } from '../../../infra/events/domain-event.js';\nexport const x = makeEvent;\n",
    );
    const res = run();
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('may not import from layer `infra`');
  });

  it('flags cross-module imports as the highest-priority error', () => {
    stage(
      'modules/_other/domain/x.ts',
      "import { Example } from '../../_template/domain/example.entity.js';\nexport const y = Example;\n",
    );
    const res = run();
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('cross-module import');
    expect(res.stdout).toContain('modules/_other -> modules/_template');
  });

  it('allows zod and node built-ins everywhere (pure layers included)', () => {
    stage(
      'shared/types/_tmp_ok.ts',
      "import { z } from 'zod';\nimport { createHash } from 'node:crypto';\nexport const s = z.string();\nexport const h = createHash;\n",
    );
    const res = run();
    expect(res.status).toBe(0);
  });

  it('rejects an unresolvable relative import', () => {
    stage(
      'shared/types/_tmp_missing.ts',
      "import { Nope } from './does-not-exist.js';\nexport const y = Nope;\n",
    );
    const res = run();
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('unresolvable import');
  });

  it('exits 2 when an unknown layer appears', () => {
    const abs = resolve(PROJECT_ROOT, 'src/shared/_orphan/_tmp_unknown.ts');
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, 'export const x = 1;\n', 'utf8');
    STAGING.push(abs);
    // Also clean the parent directory up so we don't leave empty shared/_orphan around.
    STAGING.push(resolve(PROJECT_ROOT, 'src/shared/_orphan'));
    const res = run();
    expect(res.status).toBe(2);
    expect(res.stdout).toContain('UNRECOGNISED LAYER');
  });
});

// Join helper kept to avoid unused-import warnings when the test file is
// tweaked during development.
void join;
