# Architecture Overview

> Status: living document. Update whenever a layer boundary changes.

## Goals

- **Modular monolith** ready to be sliced into services without a rewrite.
- **Clean Architecture / DDD** boundaries enforced by `tools/check-boundaries.ts`.
- **Sandbox-only** preview: every PII-sensitive or money-touching path stays out of this codebase by design.

## Stack

| Concern        | Tech                                |
| -------------- | ----------------------------------- |
| Runtime        | Node.js 20 LTS                      |
| Language       | TypeScript 5 (strict)               |
| HTTP framework | Fastify 4 + Zod                     |
| Persistence    | PostgreSQL 16 (`pg`)                |
| Cache / pubsub | Redis 7 (`ioredis`)                 |
| Logging        | Pino (+ pino-pretty in dev)         |
| Tests          | Vitest                              |
| Lint / format  | Biome                               |

## Top-level layout

```
backend/
├─ src/
│  ├─ index.ts                # process entry point
│  ├─ app/                    # composition root (build-app, register-*, container)
│  ├─ api/http/               # transport adapter (routes, controllers, middlewares)
│  ├─ infra/                  # shared infra adapters (pg, redis, events, queue, ...)
│  ├─ modules/<bounded-ctx>/  # domain + application + infra-per-module
│  └─ shared/                 # cross-cutting kernels (errors, types, ports, redaction)
├─ tests/                     # boundary-spanning suites (unit / integration / e2e)
├─ tools/                     # repo tooling (boundary checker, scripts)
└─ docs/                      # this folder
```

## Layer rules (enforced)

1. `domain` knows nothing about HTTP, DB, framework. Pure TypeScript.
2. `application` may import `domain` + `shared/application/ports`. Never `infra`.
3. `infra` may import `domain` + `application` + `shared`. Never `api`.
4. `api` is the only allowed importer of Fastify types.
5. Cross-module communication is **only** through the event bus / outbox. Direct module-to-module imports are forbidden.

Violations fail `yarn check:boundaries` (run in CI).

## Composition root

Entry: `src/index.ts` → `buildApp(config)` (`src/app/build-app.ts`).

1. `createContainer(config)` builds infra adapters once, probes Postgres,
   and decides between PG-backed stores and their in-memory twins
   (`SANDBOX_ONLY=true` and PG unreachable → fallback).
2. `Fastify({...})` is constructed with logger + body limits + req-id.
3. `attachAppContext(app, container)` decorates `app.ctx` so every route
   can read shared dependencies without service locators.
4. `registerPlugins(app, config)` wires `sensible`, `helmet`, `cors`,
   `rate-limit`, the global error handler, and the audit-log middleware.
5. `registerRoutes(app)` mounts system-level routes (`/health`,
   `/api/admin/*`).
6. `registerModules(app)` calls every bounded context's `registerModule`
   plugin in order — modules own their HTTP surface alongside their
   domain.
7. `startWorkers({...})` boots background workers (outbox dispatcher,
   schedulers) when `WORKERS_ENABLED=true`.

## Health and admin

- `GET /health` — public liveness + dependency probe (process, postgres, redis).
- `GET /api/admin/health` — gated by `admin-auth` middleware (`X-Admin-API-Key`).

## Test boundaries

- **Unit** — pure functions, domain rules, controllers with fake adapters.
  Live next to source as `*.test.ts`.
- **Integration** — adapter contracts (PG / Redis stores, middlewares,
  outbox dispatcher) using the in-memory twins or testcontainers.
- **E2E** — `tests/e2e/*` — boot a full Fastify instance and hit it via
  `inject()` to verify request-response envelopes end-to-end.

## Related documents

- [`module-dependencies.md`](./module-dependencies.md) — direction of allowed imports.
- [`event-flow.md`](./event-flow.md) — outbox → dispatcher → inbox lifecycle.
- [`security-model.md`](./security-model.md) — auth, rate-limit, idempotency.
- [`privacy-model.md`](./privacy-model.md) — PII contract and redaction.
- [`logging-retention.md`](./logging-retention.md) — log fields, redaction, retention.
