# Backend

Modular Node.js + TypeScript backend built on Fastify, following Clean Architecture / DDD layout.
This directory contains **the foundation only** (Phase B1): bootstrap, config, logging, error
handling, and a health endpoint. Domain modules and infrastructure adapters are scaffolded but
not yet implemented — they are introduced in subsequent phases.

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

## Layout

```
src/
├─ index.ts          # process entry point
├─ app/              # composition root: config, server build, lifecycle
├─ api/              # HTTP adapter: routes, controllers, schemas, presenters
├─ infra/            # framework / driver code: db, cache, logging, etc.
├─ modules/          # bounded contexts (domain + application + infra-per-module)
└─ shared/           # cross-cutting kernels: errors, types, utilities
```

Each future module under `modules/` follows the Clean Architecture rule:
`domain` knows nothing, `application` depends on `domain`, `infra` depends on both.

## Run — local (without Docker)

```bash
cp .env.example .env
npm install
npm run dev          # http://localhost:8081/health
```

You do **not** need Postgres or Redis running for the foundation — connections are lazy and the
health endpoint reports their state.

## Run — Docker Compose

```bash
cp .env.example .env
docker compose up --build
# api → http://localhost:8081
# postgres → localhost:5432 (app/app)
# redis    → localhost:6379
```

## Scripts

| Script                  | Purpose                                       |
| ----------------------- | --------------------------------------------- |
| `npm run dev`           | Hot-reload dev server via `tsx watch`         |
| `npm run build`         | Type-check + emit to `dist/`                  |
| `npm run start`         | Run compiled output                           |
| `npm run typecheck`     | `tsc --noEmit`                                |
| `npm run check:boundaries` | Architecture boundary validator (`tools/check-boundaries.ts`) |
| `npm run check:arch`    | Boundaries + typecheck (local pre-push gate)  |
| `npm run lint`          | Biome lint + format check                     |
| `npm test`              | Run all Vitest suites                         |
| `npm run test:unit`     | Unit tests only                               |
| `npm run test:integration` | Integration tests only                     |
| `npm run test:e2e`      | End-to-end suite under `tests/e2e/`           |
| `npm run migrate`       | Run SQL migrations (stub in this phase)       |

## Endpoints

| Method | Path        | Description                                              |
| ------ | ----------- | -------------------------------------------------------- |
| GET    | `/health`   | Liveness + dependency probe (process, db, redis)         |

## What is real vs stub (phase B1)

| Piece                        | State |
| ---------------------------- | ----- |
| Fastify bootstrap            | real  |
| Env loading + Zod validation | real  |
| Pino logger + redaction      | real  |
| Global error handler         | real  |
| `/health` endpoint           | real  |
| Postgres pool                | real client; pings DB only if `DATABASE_URL` is reachable |
| Redis client                 | real client; ping reported in `/health` |
| Domain modules               | empty placeholders — added in B2+ |
| Migrations runner            | stub script — added in B2 |
| Outbox / event bus           | not yet — added in B3 |
| Auth / rate-limit / idempotency | scaffolding only — added in B4 |

## Next phases

- **B2** — Postgres migrations runner, base repository, outbox table.
- **B3** — In-memory event bus, domain events, outbox dispatcher.
- **B4** — Rate limiting, idempotency middleware, request context, auth.
- **B5** — First real bounded context (domain to be chosen lawfully with the user).
