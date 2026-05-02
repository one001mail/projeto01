#!/usr/bin/env tsx
/**
 * Architecture boundary checker.
 *
 * Walks every `.ts` file under `src/` (excluding tests and declarations),
 * classifies it into a layer by path, and verifies that each of its imports
 * targets a layer allowed by the layer-dependency matrix.
 *
 * Rules (summary -- full text in /architecture.md):
 *
 *   module-domain       -> module-domain, shared-types, shared-errors, shared-domain
 *   module-application  -> module-domain, shared-port, shared-application, shared-types,
 *                          shared-errors, shared-domain
 *   module-infra        -> module-domain, module-application, shared-*, project-infra
 *   module-root         -> own module subtree, shared-*, project-infra, app
 *   shared-port         -> shared-port, shared-types, shared-errors, shared-domain
 *   shared-application  -> shared-port, shared-application, shared-types, shared-errors,
 *                          shared-domain
 *   shared-types        -> shared-types
 *   shared-errors       -> shared-errors, shared-types
 *   shared-domain       -> shared-domain, shared-types, shared-errors
 *   infra               -> shared-*, project-infra, app (for config only)
 *   api                 -> shared-*, project-infra, app, api
 *   app (composition)   -> module-root, shared-*, project-infra, api, app
 *
 * Cross-module rule (absolute): any import from `modules/A/**` into
 *   `modules/B/**` is a violation, regardless of layer -- modules speak to
 *   each other exclusively via the event bus / outbox.
 *
 * External package rules: framework libraries (fastify, pg, ioredis, pino)
 *   may only be imported from `infra`, `app`, `api`, `module-infra`, and
 *   `module-root`. Pure layers may import node built-ins (`node:*`) and
 *   `zod` only.
 *
 * Usage:
 *   npm run check:boundaries     -- exits non-zero on any violation.
 *
 * Exit codes:
 *   0 -- no violations.
 *   1 -- one or more violations.
 *   2 -- internal error (unknown layer, unresolvable import).
 */
import { readFileSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const SRC_ROOT = resolve(PROJECT_ROOT, 'src');

// ---------------------------------------------------------------------------
// Layer classification
// ---------------------------------------------------------------------------

type Layer =
  | 'module-domain'
  | 'module-application'
  | 'module-infra'
  | 'module-root'
  | 'shared-port'
  | 'shared-application'
  | 'shared-types'
  | 'shared-errors'
  | 'shared-domain'
  | 'infra'
  | 'api'
  | 'app'
  | 'tools'
  | 'unknown';

interface FileInfo {
  absPath: string;
  relPath: string; // posix, relative to src/
  layer: Layer;
  moduleName?: string; // when layer starts with 'module-'
}

const EXCLUDED_SUFFIXES = ['.test.ts', '.spec.ts', '.d.ts'];

function toPosix(p: string): string {
  return p.split(sep).join(posix.sep);
}

function classify(relPosix: string): { layer: Layer; moduleName?: string } {
  // modules/index.ts is the modules barrel -- treat as composition (app).
  if (relPosix === 'modules/index.ts') return { layer: 'app' };
  const modMatch = relPosix.match(/^modules\/([^/]+)\/(.*)$/);
  if (modMatch) {
    const moduleName = modMatch[1]!;
    const rest = modMatch[2]!;
    if (rest.startsWith('domain/')) return { layer: 'module-domain', moduleName };
    if (rest.startsWith('application/')) return { layer: 'module-application', moduleName };
    if (rest.startsWith('infra/')) return { layer: 'module-infra', moduleName };
    if (rest === 'index.ts') return { layer: 'module-root', moduleName };
    return { layer: 'module-root', moduleName };
  }
  if (relPosix.startsWith('shared/application/ports/')) return { layer: 'shared-port' };
  if (relPosix.startsWith('shared/application/')) return { layer: 'shared-application' };
  if (relPosix.startsWith('shared/types/')) return { layer: 'shared-types' };
  if (relPosix.startsWith('shared/errors/')) return { layer: 'shared-errors' };
  if (relPosix.startsWith('shared/domain/')) return { layer: 'shared-domain' };
  if (relPosix.startsWith('shared/')) return { layer: 'unknown' };
  if (relPosix.startsWith('infra/')) return { layer: 'infra' };
  if (relPosix.startsWith('api/')) return { layer: 'api' };
  if (relPosix.startsWith('app/')) return { layer: 'app' };
  if (relPosix === 'index.ts') return { layer: 'app' };
  if (relPosix.startsWith('tools/')) return { layer: 'tools' };
  return { layer: 'unknown' };
}

// ---------------------------------------------------------------------------
// Rule matrix
// ---------------------------------------------------------------------------

const ALLOWED: Record<Layer, readonly Layer[]> = {
  'module-domain': ['module-domain', 'shared-types', 'shared-errors', 'shared-domain'],
  'module-application': [
    'module-domain',
    'module-application',
    'shared-port',
    'shared-application',
    'shared-types',
    'shared-errors',
    'shared-domain',
  ],
  'module-infra': [
    'module-domain',
    'module-application',
    'module-infra',
    'shared-port',
    'shared-application',
    'shared-types',
    'shared-errors',
    'shared-domain',
    'infra',
  ],
  'module-root': [
    'module-domain',
    'module-application',
    'module-infra',
    'module-root',
    'shared-port',
    'shared-application',
    'shared-types',
    'shared-errors',
    'shared-domain',
    'infra',
    'app',
  ],
  'shared-port': ['shared-port', 'shared-types', 'shared-errors', 'shared-domain'],
  'shared-application': [
    'shared-port',
    'shared-application',
    'shared-types',
    'shared-errors',
    'shared-domain',
  ],
  'shared-types': ['shared-types'],
  'shared-errors': ['shared-errors', 'shared-types'],
  'shared-domain': ['shared-domain', 'shared-types', 'shared-errors'],
  infra: [
    'shared-port',
    'shared-application',
    'shared-types',
    'shared-errors',
    'shared-domain',
    'infra',
    'app', // pragmatic: infra reads `app/config` for env-validated Config
  ],
  app: [
    'module-root',
    'shared-port',
    'shared-application',
    'shared-types',
    'shared-errors',
    'shared-domain',
    'infra',
    'api',
    'app',
  ],
  api: [
    'shared-port',
    'shared-application',
    'shared-types',
    'shared-errors',
    'shared-domain',
    'infra',
    'app',
    'api',
  ],
  tools: [
    'shared-port',
    'shared-application',
    'shared-types',
    'shared-errors',
    'shared-domain',
    'tools',
  ],
  unknown: [],
};

// Pure layers: may not import any framework / driver package.
const PURE_LAYERS = new Set<Layer>([
  'module-domain',
  'module-application',
  'shared-port',
  'shared-application',
  'shared-types',
  'shared-errors',
  'shared-domain',
]);

// Packages whose imports mean "framework / driver coupling" and are banned
// in pure layers. Matching is by prefix.
const BANNED_IN_PURE = [
  'fastify',
  '@fastify/',
  'fastify-plugin',
  'pg',
  'ioredis',
  'pino',
  'pino-pretty',
  'dotenv',
  'redis',
  'bullmq',
];

// Packages always allowed anywhere (schema / utility libraries).
const ALWAYS_ALLOWED_PACKAGES = ['zod'];

// ---------------------------------------------------------------------------
// File walking
// ---------------------------------------------------------------------------

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      await walk(full, out);
    } else if (entry.isFile()) {
      if (!entry.name.endsWith('.ts')) continue;
      if (EXCLUDED_SUFFIXES.some((suf) => entry.name.endsWith(suf))) continue;
      out.push(full);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Import parsing (regex-based; TS modules only)
// ---------------------------------------------------------------------------

interface ImportRef {
  specifier: string;
  line: number;
}

const IMPORT_RE =
  /(?:^|\n)\s*(?:import\s+(?:[^'";]*?\s+from\s+)?|export\s+(?:\*|\{[^}]*\})\s+from\s+)['"]([^'"]+)['"]/g;

function parseImports(source: string): ImportRef[] {
  const refs: ImportRef[] = [];
  IMPORT_RE.lastIndex = 0;
  for (;;) {
    const m = IMPORT_RE.exec(source);
    if (!m) break;
    const specifier = m[1]!;
    const line = source.slice(0, m.index).split('\n').length + (m[0].startsWith('\n') ? 1 : 0);
    refs.push({ specifier, line });
  }
  return refs;
}

// ---------------------------------------------------------------------------
// Specifier resolution
// ---------------------------------------------------------------------------

const ALIAS_MAP: Record<string, string> = {
  '@app/': 'app/',
  '@api/': 'api/',
  '@infra/': 'infra/',
  '@modules/': 'modules/',
  '@shared/': 'shared/',
};

type ResolvedImport =
  | { kind: 'internal'; srcRelPosix: string }
  | { kind: 'external'; pkg: string }
  | { kind: 'node' };

function resolveSpecifier(fromAbs: string, specifier: string): ResolvedImport {
  if (specifier.startsWith('node:')) return { kind: 'node' };

  // Alias
  for (const [alias, sub] of Object.entries(ALIAS_MAP)) {
    if (specifier.startsWith(alias)) {
      const rest = specifier.slice(alias.length).replace(/\.js$/, '');
      return { kind: 'internal', srcRelPosix: toPosix(sub + rest) };
    }
  }

  // Relative
  if (specifier.startsWith('.')) {
    const abs = resolve(dirname(fromAbs), specifier);
    const rel = toPosix(relative(SRC_ROOT, abs)).replace(/\.js$/, '');
    return { kind: 'internal', srcRelPosix: rel };
  }

  // Bare package
  const parts = specifier.split('/');
  const pkg =
    specifier.startsWith('@') && parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0]!;
  return { kind: 'external', pkg };
}

function resolveInternalFile(srcRelPosix: string): string | null {
  const candidates = [
    join(SRC_ROOT, srcRelPosix + '.ts'),
    join(SRC_ROOT, srcRelPosix, 'index.ts'),
    join(SRC_ROOT, srcRelPosix),
  ];
  for (const c of candidates) {
    try {
      const s = statSync(c);
      if (s.isFile()) return c;
    } catch {
      /* ignore */
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Checking
// ---------------------------------------------------------------------------

interface Violation {
  file: string;
  line: number;
  message: string;
}

function isPackageBannedInPure(pkg: string): boolean {
  return BANNED_IN_PURE.some((p) => pkg === p || pkg.startsWith(p));
}

function isPackageAlwaysAllowed(pkg: string): boolean {
  return ALWAYS_ALLOWED_PACKAGES.some((p) => pkg === p || pkg.startsWith(p + '/'));
}

function checkFile(file: FileInfo, refs: ImportRef[], violations: Violation[]): void {
  const allowed = new Set<Layer>(ALLOWED[file.layer]);

  for (const ref of refs) {
    const resolved = resolveSpecifier(file.absPath, ref.specifier);

    if (resolved.kind === 'node') continue;

    if (resolved.kind === 'external') {
      if (isPackageAlwaysAllowed(resolved.pkg)) continue;
      if (PURE_LAYERS.has(file.layer) && isPackageBannedInPure(resolved.pkg)) {
        violations.push({
          file: file.relPath,
          line: ref.line,
          message: `layer \`${file.layer}\` may not import framework package \`${resolved.pkg}\` (import: '${ref.specifier}')`,
        });
      }
      continue;
    }

    const targetFile = resolveInternalFile(resolved.srcRelPosix);
    if (!targetFile) {
      violations.push({
        file: file.relPath,
        line: ref.line,
        message: `unresolvable import '${ref.specifier}' (resolved to src/${resolved.srcRelPosix})`,
      });
      continue;
    }

    const targetRel = toPosix(relative(SRC_ROOT, targetFile));
    const { layer: targetLayer, moduleName: targetModule } = classify(targetRel);

    if (targetLayer === 'unknown') {
      violations.push({
        file: file.relPath,
        line: ref.line,
        message: `target file is in an unrecognised layer: ${targetRel}`,
      });
      continue;
    }

    // Cross-module rule -- hard stop.
    if (file.moduleName && targetModule && file.moduleName !== targetModule) {
      violations.push({
        file: file.relPath,
        line: ref.line,
        message: `cross-module import: modules/${file.moduleName} -> modules/${targetModule} (use events/outbox, not direct imports)`,
      });
      continue;
    }

    if (!allowed.has(targetLayer)) {
      violations.push({
        file: file.relPath,
        line: ref.line,
        message: `layer \`${file.layer}\` may not import from layer \`${targetLayer}\` (target: ${targetRel})`,
      });
      continue;
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const files = await walk(SRC_ROOT);
  const infos: FileInfo[] = files.map((abs) => {
    const relPosix = toPosix(relative(SRC_ROOT, abs));
    const { layer, moduleName } = classify(relPosix);
    return {
      absPath: abs,
      relPath: relPosix,
      layer,
      ...(moduleName ? { moduleName } : {}),
    };
  });

  const violations: Violation[] = [];
  const unknowns: FileInfo[] = [];

  for (const info of infos) {
    if (info.layer === 'unknown') {
      unknowns.push(info);
      continue;
    }
    const source = readFileSync(info.absPath, 'utf8');
    const refs = parseImports(source);
    checkFile(info, refs, violations);
  }

  const useColor = process.stdout.isTTY;
  const green = (s: string): string => (useColor ? `\x1b[32m${s}\x1b[0m` : s);
  const red = (s: string): string => (useColor ? `\x1b[31m${s}\x1b[0m` : s);
  const bold = (s: string): string => (useColor ? `\x1b[1m${s}\x1b[0m` : s);

  process.stdout.write(`${bold('architecture.boundaries')} -- scanned ${infos.length} files\n`);

  if (unknowns.length > 0) {
    process.stdout.write(red(`\nUNRECOGNISED LAYER for ${unknowns.length} file(s):\n`));
    for (const u of unknowns) process.stdout.write(`  ${u.relPath}\n`);
  }

  if (violations.length === 0 && unknowns.length === 0) {
    process.stdout.write(green('\nOK: no boundary violations\n'));
    process.exit(0);
  }

  if (violations.length > 0) {
    process.stdout.write(red(`\nFAIL: ${violations.length} boundary violation(s):\n\n`));
    for (const v of violations) {
      process.stdout.write(`  ${v.file}:${v.line}\n    ${v.message}\n\n`);
    }
  }

  process.exit(unknowns.length > 0 ? 2 : 1);
}

main().catch((err) => {
  process.stderr.write(`boundary check failed: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(2);
});
