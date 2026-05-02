# P3 — Backend Endpoints (Node/Fastify)

**Goal:** wire the first real write + read endpoints behind our existing
Clean-Architecture bones (modules, ports, transaction manager, outbox,
controllers/routes/presenters, Zod validation).

## Endpoints delivered

| Method | Path                                     | Module               | Notes                                                |
| ------ | ---------------------------------------- | -------------------- | ---------------------------------------------------- |
| POST   | `/api/learning-sessions`                 | `learning-sessions`  | Creates a session; 201; tx + outbox event            |
| GET    | `/api/learning-sessions/:publicCode`     | `learning-sessions`  | Looks up by public code; 200 / 404 / 422             |
| POST   | `/api/contact-requests`                  | `contact-requests`   | Public intake; 201; tx + outbox; body never echoed   |
| GET    | `/api/pricing`                           | `pricing`            | Static snapshot; 200; `Cache-Control: max-age=60`    |
| GET    | `/api/admin/health`                      | system (api/http)    | 200 when ok / 503 when degraded; full diag payload   |

Verification from a live `buildApp`:

```
├── /health (GET, HEAD)
├── /api/admin/health (GET, HEAD)
├── /api/learning-sessions (POST)
│   └── /:publicCode (GET, HEAD)
├── /api/contact-requests (POST)
├── /api/pricing (GET, HEAD)
```

## Checkpoint

| Gate                              | Result                                 |
| --------------------------------- | -------------------------------------- |
| `yarn typecheck`                  | 0 errors                               |
| `yarn lint` (biome)               | 0 errors                               |
| `yarn check:boundaries`           | 0 violations (78 files scanned)        |
| `yarn test`                       | **48 passed / 48** (+23 new)           |
| `yarn test:coverage`              | 78.69% lines (gate ≥ 60%)              |
| `yarn build`                      | ✅                                     |
| All 5 endpoints routed (no 404)   | ✅ (see route tree above)              |

## Architecture notes

### Three new modules, one new system route

```
src/modules/
├── learning-sessions/
│   ├── domain/                     ← pure
│   │   ├── learning-session.entity.ts
│   │   ├── learning-session.repository.ts   ← port + LearningSessionAlreadyExistsError
│   │   └── public-code.ts                   ← value object (alphabet, length, generator, validator)
│   ├── application/
│   │   ├── create-learning-session.use-case.ts  ← tx + outbox, retry-on-collision
│   │   └── get-learning-session.use-case.ts
│   ├── infra/
│   │   ├── in-memory-learning-session.repository.ts
│   │   ├── pg-learning-session.repository.ts    ← maps PG 23505 → domain error
│   │   └── http/
│   │       ├── schemas.ts          ← Zod (request + response DTO)
│   │       ├── presenter.ts
│   │       ├── controller.ts       ← framework-free
│   │       └── routes.ts           ← Fastify plugin factory
│   └── index.ts                    ← module composition root
├── contact-requests/               ← same shape
└── pricing/                        ← same shape, read-only (no repo)
```

System admin route:

```
src/api/http/
├── schemas/admin-health.schemas.ts
├── controllers/admin-health.controller.ts
├── presenters/admin-health.presenter.ts
└── routes/admin-health.routes.ts
```

### AppContext extended

`tm: TransactionManager` and `outbox: OutboxStore` are now decorated onto
every Fastify instance via `AppContext`. Modules pull them at registration
time and pass them into use cases. This keeps transaction + outbox wiring
a single-source-of-truth instead of each module instantiating its own.

```ts
// dependency-container.ts
const tm = new PgTransactionManager(pg);
const outbox = createPgOutboxStore({
  defaultRunner: () => tm.getCurrentRunner(),
});
return { config, pg, redis, eventBus, queue, tm, outbox, dispose };
```

### Write-path invariants (learning-sessions, contact-requests)

Both write use cases do **exactly** the following inside a single
`tm.runInTransaction(...)`:

1. Persist the aggregate via its repository (port).
2. `outbox.save(event, runner)` with the ambient transaction runner.

→ Either both rows land (domain + outbox row) or neither does.

Emitted events:

| Event name                     | Triggered by                      | Payload                                       |
| ------------------------------ | --------------------------------- | --------------------------------------------- |
| `learning-sessions.created`    | successful POST /learning-sessions| `{id, publicCode, status, subject, inputValue, createdAt, expiresAt}` |
| `contact-requests.submitted`   | successful POST /contact-requests | `{id, email, subjectPresent, messageLength, createdAt}` — **body never echoed** |

### Request validation (Zod)

Every endpoint validates its input through a Zod schema in
`infra/http/schemas.ts`. The global Fastify error handler maps `ZodError`
to a 422 `{ error: { code: "VALIDATION_FAILED", ... } }` envelope. Body
schemas use `.strict()` so unknown keys are rejected.

### Layering / controllers

Routes do only HTTP plumbing: parse via Zod → call controller →
presenter → `reply.code(...).send(...)`. Controllers (`infra/http/
controller.ts`) have **no** Fastify imports; they call the use case and
translate domain errors (`kind: 'NOT_FOUND'` → `AppError.notFound(...)`,
`kind: 'INVALID_INPUT'` → `AppError.badRequest(...)`, `kind: 'COLLISION'`
→ `AppError.conflict(...)`). Presenters shape the public DTO (dates →
ISO strings, sensitive fields dropped).

## Files touched

### Created (30)

Migration:
* `src/infra/db/migrations/011_contact_requests.sql`

learning-sessions module:
* `src/modules/learning-sessions/domain/learning-session.entity.ts`
* `src/modules/learning-sessions/domain/learning-session.repository.ts`
* `src/modules/learning-sessions/domain/public-code.ts`
* `src/modules/learning-sessions/domain/public-code.test.ts`
* `src/modules/learning-sessions/application/create-learning-session.use-case.ts`
* `src/modules/learning-sessions/application/get-learning-session.use-case.ts`
* `src/modules/learning-sessions/infra/in-memory-learning-session.repository.ts`
* `src/modules/learning-sessions/infra/pg-learning-session.repository.ts`
* `src/modules/learning-sessions/infra/http/schemas.ts`
* `src/modules/learning-sessions/infra/http/presenter.ts`
* `src/modules/learning-sessions/infra/http/controller.ts`
* `src/modules/learning-sessions/infra/http/routes.ts`
* `src/modules/learning-sessions/index.ts`
* `src/modules/learning-sessions/learning-sessions.test.ts`

contact-requests module:
* `src/modules/contact-requests/domain/contact-request.entity.ts`
* `src/modules/contact-requests/domain/contact-request.repository.ts`
* `src/modules/contact-requests/application/submit-contact-request.use-case.ts`
* `src/modules/contact-requests/infra/in-memory-contact-request.repository.ts`
* `src/modules/contact-requests/infra/pg-contact-request.repository.ts`
* `src/modules/contact-requests/infra/http/schemas.ts`
* `src/modules/contact-requests/infra/http/presenter.ts`
* `src/modules/contact-requests/infra/http/controller.ts`
* `src/modules/contact-requests/infra/http/routes.ts`
* `src/modules/contact-requests/index.ts`
* `src/modules/contact-requests/contact-requests.test.ts`

pricing module:
* `src/modules/pricing/domain/pricing.ts`
* `src/modules/pricing/application/get-pricing.use-case.ts`
* `src/modules/pricing/infra/http/schemas.ts`
* `src/modules/pricing/infra/http/presenter.ts`
* `src/modules/pricing/infra/http/controller.ts`
* `src/modules/pricing/infra/http/routes.ts`
* `src/modules/pricing/index.ts`
* `src/modules/pricing/pricing.test.ts`

System:
* `src/api/http/schemas/admin-health.schemas.ts`
* `src/api/http/controllers/admin-health.controller.ts`
* `src/api/http/presenters/admin-health.presenter.ts`
* `src/api/http/routes/admin-health.routes.ts`
* `src/api/http/routes/admin-health.routes.test.ts`

Test doubles (pure):
* `src/shared/application/testing/fakes.ts`

Docs:
* `docs/P3_BACKEND_ENDPOINTS.md` (this file)

### Modified (3)

* `src/app/app-context.ts` — added `tm`, `outbox` to `AppContext`
* `src/app/dependency-container.ts` — wire `PgTransactionManager` + `createPgOutboxStore`
* `src/app/register-modules.ts` — register 3 new modules
* `src/app/register-routes.ts` — mount `/api/admin/health`

## Caveats & follow-ups

1. **Frontend endpoint mismatch (P4):** P2 wired the frontend to
   `/api/mix-sessions`, `/api/mix-sessions/:code`, `/api/sessions`, and
   `/api/contact-requests`. The new backend paths are
   `/api/learning-sessions`, `/api/learning-sessions/:publicCode`, and
   `/api/contact-requests`. A small P4 patch to
   `frontend/src/shared/api/endpoints.ts` is required before end-to-end
   flows work in the browser. `/api/contact-requests` already aligns.
2. **DB migrations:** `011_contact_requests.sql` must be run against the
   target database via `yarn migrate`. The migration depends on `citext`
   (already provided by `001_init.sql`).
3. **Admin health auth:** `/api/admin/health` is currently unauthenticated.
   In production it must be restricted by the gateway (allowlist or basic
   auth); the endpoint itself intentionally doesn't leak secrets.
4. **Pricing source:** `CURRENT_PRICING` is a static constant. If pricing
   needs to become dynamic (admin-editable), introduce a repository and
   promote the snapshot to a persisted aggregate.
