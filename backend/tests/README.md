# `backend/tests/`

This folder hosts boundary-spanning suites. Inner unit tests stay co-located with
source files (`src/**/*.test.ts`) so they move with the code they cover.

```
tests/
├─ unit/         # cross-cutting unit suites (no IO, no Fastify boot)
├─ integration/  # adapter + middleware suites that may use in-memory infra
└─ e2e/          # full Fastify boot (`buildApp` + `inject`)
```

## Conventions

- File names end with `*.test.ts`.
- E2E suites must call `await app.close()` in `afterAll` to release resources.
- Integration suites prefer in-memory adapters; if a real PG/Redis is required,
  gate the suite behind `if (!process.env.DATABASE_URL) test.skip(...)`.
- Unit suites must be free of Fastify, `pg`, `ioredis`, and timer side effects.

## Running

```bash
yarn test                 # everything
yarn test:unit            # excludes *.integration.test.ts and *.e2e.test.ts
yarn test:integration     # name-filtered
yarn test:e2e             # this folder
yarn test:coverage        # with v8 coverage and the global gate
```

Coverage thresholds live in `vitest.config.ts`.
