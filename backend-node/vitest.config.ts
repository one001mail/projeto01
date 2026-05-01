import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts', 'tools/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.integration.test.ts',
        'src/**/*.e2e.test.ts',
        'src/**/index.ts',
      ],
      thresholds: {
        lines: 60,
        statements: 60,
        // domain-only checks are mostly contract tests today; keep
        // function and branch thresholds slightly lower so they
        // can be tightened in follow-up phases without artificially
        // failing the P0 gate.
        functions: 60,
        branches: 60,
      },
    },
    reporters: ['default'],
    pool: 'forks',
  },
  resolve: {
    alias: {
      '@app': resolve(__dirname, 'src/app'),
      '@api': resolve(__dirname, 'src/api'),
      '@infra': resolve(__dirname, 'src/infra'),
      '@modules': resolve(__dirname, 'src/modules'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
});
