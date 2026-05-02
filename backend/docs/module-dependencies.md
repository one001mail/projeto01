# Module Dependencies

Allowed import directions, enforced by `tools/check-boundaries.ts`.

## Inside a module (`src/modules/<ctx>/`)

```
  domain  ◀────────  application  ◀────────  infra
     ▲                   ▲                    ▲
     │                   │                    │
     └────────  api/<ctx>.routes.ts  ─────────┘
```

Only the module's own `index.ts` is allowed to import all four sublayers; it is the
composition seam exposed to `app/register-modules.ts`.

## Cross-module rules

- A module **must not** import from another module's folder. Period.
- Cross-module collaboration goes through:
  1. Domain events on the in-memory `EventBus` (synchronous side effects); or
  2. The transactional **outbox** + dispatcher → external bus / **inbox** of the consumer.

## Shared kernels (`src/shared/`)

| Folder                              | Allowed importers              | Notes                                   |
| ----------------------------------- | ------------------------------ | --------------------------------------- |
| `shared/errors`                     | every layer                    | `AppError` + error codes                |
| `shared/types`                      | every layer                    | `Result<T, E>` etc.                     |
| `shared/application/ports`          | `application`, `infra`, `api`  | port interfaces (TM, queue, idempotency)|
| `shared/application/redaction.ts`   | `application`, `infra`, `api`  | pure dot-path redactor                  |
| `shared/application/testing/*`      | tests only                     | helpers (deterministic clock, fakes)    |

## Infra (`src/infra/`)

Infra is **shared** across modules and is the only place allowed to import driver libs
(`pg`, `ioredis`, `pino`, ...). Each adapter implements a port from
`shared/application/ports/*.ts`. Modules consume the *port*, never the adapter.

## API (`src/api/http/`)

The HTTP adapter:

- Imports Fastify types and the application/* layer.
- Never imports infra directly — it goes through `app.ctx`, populated by the container.
- Owns `routes/`, `controllers/`, `presenters/`, `middlewares/`, `schemas/`.

## App (`src/app/`)

The composition root. The **only** layer allowed to import from every other layer:

- `app-context.ts` — typed bag of dependencies decorated onto Fastify.
- `dependency-container.ts` — concrete wiring (infra adapters → ports).
- `build-app.ts` — orchestrates the bootstrap order.
- `register-plugins.ts`, `register-routes.ts`, `register-modules.ts` — wiring helpers.
- `lifecycle.ts` — graceful shutdown handlers.
- `workers.ts` — background workers registry.

## Failing patterns (will break `check:boundaries`)

- `import 'fastify'` outside `src/app/` and `src/api/`.
- `import 'pg'` outside `src/infra/` (or its tests).
- `import '../some-other-module/...'` from inside a module.
- `import 'src/api/...'` from `src/modules/<ctx>/domain` or `application`.

Run `yarn check:boundaries` locally before pushing.
