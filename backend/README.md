# Backend

> ⚠️ **Important Safety Notice**
>
> This backend is an **educational sandbox**. It does **not** implement real
> cryptocurrency mixing, custody, wallet generation, blockchain monitoring,
> transaction broadcasting, liquidity movement, or payment execution. Every
> sensitive flow is **mock-only** and **non-operational**. The codebase
> demonstrates architectural patterns (DDD, Clean Architecture, outbox,
> idempotency, audit redaction) — **not** an operational mixer.
>
> The following modules under `src/modules/` are explicitly **SANDBOX /
> MOCK-ONLY**, and must remain so:
> `address-generator`, `blockchain-monitor`, `deposit-saga`,
> `liquidity-pool`, `log-minimizer`, `payment-scheduler`.
>
> See `docs/modules/*.md` for the per-module safety contract.



Modular **Node.js + TypeScript** backend built on **Fastify**, following Clean
Architecture / DDD layout. Bootstrapped under a thin Python/FastAPI compatibility
shim (`server.py`) so it can run inside the read-only `supervisord` of the
preview environment without changing the supervisor config.

## Stack

| Concern        | Tech                              |
| -------------- | --------------------------------- |
| Runtime        | Node.js 20 LTS                    |
| Language       | TypeScript 5 (strict)             |
| HTTP framework | Fastify 4 + Zod                   |
| Persistence    | PostgreSQL 16 (`pg`)              |
| Cache / pubsub | Redis 7 (`ioredis`)               |
| Logging        | Pino (+ pino-pretty for dev)      |
| Tests          | Vitest                            |
| Lint / format  | Biome                             |
| Container      | Docker + docker-compose           |

## Mandatory layout

```
backend/
├─ package.json
├─ tsconfig.json
├─ tsconfig.build.json
├─ .env.example
├─ .gitignore
├─ biome.json
├─ vitest.config.ts
├─ docker-compose.yml
├─ Dockerfile
├─ README.md
├─ docs/
│  ├─ architecture-overview.md
│  ├─ module-dependencies.md
│  ├─ event-flow.md
│  ├─ security-model.md
│  ├─ privacy-model.md
│  ├─ logging-retention.md
│  └─ modules/
├─ src/
│  ├─ index.ts                     # process entrypoint
│  ├─ api/                         # HTTP adapter (routes, controllers, middlewares, schemas, presenters)
│  ├─ app/                         # composition root
│  │  ├─ build-app.ts
│  │  ├─ register-plugins.ts
│  │  ├─ register-routes.ts
│  │  ├─ register-modules.ts
│  │  ├─ app-context.ts
│  │  ├─ dependency-container.ts
│  │  ├─ config.ts
│  │  ├─ lifecycle.ts
│  │  └─ workers.ts
│  ├─ infra/                       # shared adapters: pg, redis, events, queue, audit, idempotency, ...
│  ├─ modules/                     # bounded contexts (domain + application + infra-per-module)
│  └─ shared/                      # cross-cutting kernels: errors, types, ports, redaction
└─ tests/
   ├─ unit/
   ├─ integration/
   └─ e2e/
```

Inner unit tests stay co-located with source as `src/**/*.test.ts`. The
`tests/` folder hosts boundary-spanning suites (full Fastify boot via
`buildApp`).

## Bootstrap (composition root)

Entry: `src/index.ts` → `buildApp(config)`.

1. `loadConfig()` reads `.env`, validates with Zod (`src/app/config.ts`).
2. `createContainer(config)` builds infra adapters, probes Postgres, picks
   PG-backed or in-memory stores (sandbox fallback).
3. Fastify is instantiated with logger / body limits / request id.
4. `attachAppContext(app, container)` decorates `app.ctx`.
5. `registerPlugins(app, config)` mounts `sensible`, `helmet`, `cors`,
   `rate-limit`, the global error handler, and the audit-log middleware.
6. `registerRoutes(app)` mounts system routes (`/health`, `/api/admin/*`).
7. `registerModules(app)` invokes every bounded context's `registerModule`
   plugin.
8. `startWorkers({...})` boots background workers when `WORKERS_ENABLED=true`.

## Run — local (without Docker)

```bash
cp .env.example .env
yarn install
yarn dev          # http://localhost:8081/health
```

You do **not** need Postgres or Redis running for the foundation — connections
are lazy and the health endpoint reports their state. With `SANDBOX_ONLY=true`
(default in preview), unreachable PG triggers in-memory adapters.

## Run — under the preview shim

The Emergent preview's `supervisord` invokes:

```
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1 --reload
```

`server.py` is a transparent reverse-proxy that spawns the Node app on
loopback `127.0.0.1:8081` and forwards every request to it. Curl any path on
`:8001` and the Fastify response comes back.

## Run — Docker Compose

```bash
cp .env.example .env
docker compose up --build
# api → http://localhost:8081
# postgres → localhost:5432 (app/app)
# redis    → localhost:6379
```

## Scripts

| Script                     | Purpose                                                 |
| -------------------------- | ------------------------------------------------------- |
| `yarn dev`                 | Hot-reload dev server via `tsx watch`                   |
| `yarn dev:no-watch`        | Single-process dev server (used by the preview shim)    |
| `yarn build`               | Type-check + emit to `dist/`                            |
| `yarn start`               | Run compiled output                                     |
| `yarn typecheck`           | `tsc --noEmit`                                          |
| `yarn check:boundaries`    | Architecture boundary validator (`tools/check-boundaries.ts`) |
| `yarn check:arch`          | Boundaries + typecheck (local pre-push gate)            |
| `yarn lint`                | Biome lint + format check                               |
| `yarn lint:fix`            | Biome auto-fix                                          |
| `yarn test`                | Run all Vitest suites                                   |
| `yarn test:unit`           | Unit tests only                                         |
| `yarn test:integration`    | Integration tests only                                  |
| `yarn test:e2e`            | End-to-end suite under `tests/e2e/`                     |
| `yarn test:coverage`       | All tests + coverage thresholds                         |
| `yarn migrate`             | Run SQL migrations                                      |

## Endpoints (system)

| Method | Path                  | Description                                      |
| ------ | --------------------- | ------------------------------------------------ |
| GET    | `/health`             | Liveness + dependency probe (process, db, redis) |
| GET    | `/api/admin/health`   | Same probe gated by `X-Admin-API-Key`            |

Domain endpoints live under `src/modules/<ctx>/` and are documented per-module
in [`docs/modules/`](./docs/modules/README.md).

## Documentation

- [`docs/architecture-overview.md`](./docs/architecture-overview.md)
- [`docs/module-dependencies.md`](./docs/module-dependencies.md)
- [`docs/event-flow.md`](./docs/event-flow.md)
- [`docs/security-model.md`](./docs/security-model.md)
- [`docs/privacy-model.md`](./docs/privacy-model.md)
- [`docs/logging-retention.md`](./docs/logging-retention.md)
- [`docs/modules/`](./docs/modules/README.md) — per-module reference

## Validation checklist

- `yarn typecheck` → 0 errors
- `yarn lint` → 0 errors
- `yarn check:boundaries` → 0 violations
- `yarn test` → all suites green
- `yarn build` → emits `dist/`
- `GET /health` → 200, body `{ status, uptimeSeconds, timestamp, version, checks }`
