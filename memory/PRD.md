# PRD — projeto01 (SANDBOX / Educational)

## Original problem statement

This repository is an **educational sandbox** that demonstrates a modular
Clean Architecture / DDD backend (TypeScript + Fastify) paired with a
React frontend. The codebase must reach full architectural parity with
the MASTER PROMPT **without** implementing any real cryptocurrency
mixing, custody, wallet generation, blockchain access, transaction
broadcasting, liquidity movement, or payment execution.

Every sensitive module must remain **mock-only**.

## Architecture

```
projeto01/
├─ backend/                          (Node.js + TypeScript + Fastify)
│  └─ src/
│     ├─ api/http/                   routes, schemas, controllers, middlewares, presenters
│     ├─ app/                        build-app, composition root, register-*
│     ├─ infra/
│     │   ├─ auth, cache, config, crypto, db, events,
│     │   ├─ id, idempotency, logging, metrics, queue, time
│     │   └─ queue/definitions/      expire-sessions, poll-blockchain (MOCK),
│     │                               schedule-payments (MOCK), cleanup-logs
│     ├─ modules/                    bounded contexts (DDD)
│     │   ├─ _template
│     │   ├─ learning-sessions       sandbox learning sessions
│     │   ├─ contact-requests        generic contact intake
│     │   ├─ pricing                 read-only snapshot
│     │   ├─ audit-logs              cross-cutting audit records
│     │   ├─ generated-tokens        opaque sandbox identifiers
│     │   ├─ resource-reservations   mock quota/reservations
│     │   ├─ address-generator       SANDBOX MOCK sbx_ tokens (F6)
│     │   ├─ blockchain-monitor      SANDBOX MOCK observations (F6)
│     │   ├─ deposit-saga            SANDBOX saga state machine (F6)
│     │   ├─ liquidity-pool          SANDBOX unitless slots (F6)
│     │   ├─ log-minimizer           Privacy-by-design (F6)
│     │   └─ payment-scheduler       SANDBOX MOCK payouts (F6)
│     └─ shared/
│         ├─ application/ports       Clock, UUID, Logger, EventBus, Queue, TM, Idempotency, AuditLog
│         ├─ domain/                 Entity, AggregateRoot, ValueObject, DomainEvent, Money, Percentage,
│         │                          Address (sbx_), TxId (mocktx_), Timestamp, Ttl, Result
│         ├─ application/            redaction helper
│         ├─ errors/                 AppError, ErrorCode
│         └─ types/                  Result
│
└─ frontend/   React + Vite + Tailwind (home / how-it-works / mixing / fees / faq / contact)
```

## Safety contract (non-negotiable)

- No real crypto mixing, tumbling, anonymization, custody, deposits,
  withdrawals, liquidity movement, blockchain monitoring, or transaction
  broadcasting.
- The following modules must remain MOCK: `address-generator`,
  `blockchain-monitor`, `deposit-saga`, `liquidity-pool`,
  `log-minimizer`, `payment-scheduler`.
- `shared/domain/address.ts` only accepts `sbx_*` tokens.
- `shared/domain/txid.ts` only accepts `mocktx_*` ids.

## What's been implemented

### F5 (prior session) — completed
- `audit-logs`, `generated-tokens`, `resource-reservations` DDD modules.
- Migration `012_resource_reservations_v2.sql`.
- 132 tests green.

### F6 (2026-02) — MASTER PROMPT full parity — completed
- Six sandbox-only modules added (`address-generator`, `blockchain-monitor`,
  `deposit-saga`, `liquidity-pool`, `log-minimizer`, `payment-scheduler`),
  each with domain entities/VOs/policies/events/repositories, application
  use cases, in-memory adapters, and a dedicated test file.
- Shared domain primitives: `entity`, `aggregate-root`, `value-object`,
  `domain-event`, `domain-error`, `result`, `money`, `percentage`,
  `address`, `txid`, `timestamp`, `ttl`.
- Infra stubs added (with real functionality where sandbox-safe):
  `time/system-clock`, `id/uuid-generator`, `metrics/prometheus`,
  `metrics/http-metrics`, `metrics/domain-metrics`, `crypto/hash-service`,
  `crypto/token-service`, `config/env`, `config/app-config`,
  `config/db-config`, `config/redis-config`, `config/auth-config`,
  `config/rate-limit-config`, `config/feature-flags`,
  `auth/jwt-verifier` (NOOP), `auth/role-policy`, `auth/admin-auth`,
  `logging/redact`, `logging/audit-log-serializer`,
  `logging/retention-policy`, `cache/rate-limit-store`,
  `cache/idempotency-store`, `cache/distributed-lock`,
  `queue/job-runner`, `queue/job-dispatcher`,
  `queue/definitions/{expire-sessions,poll-blockchain(MOCK),schedule-payments(MOCK),cleanup-logs}`.
- Compatibility migrations (views) with master-prompt names:
  `013_mix_sessions_compat.sql`, `014_generated_addresses_compat.sql`,
  `015_pool_reservations_compat.sql`.
- Docs: `docs/modules/{address-generator,blockchain-monitor,deposit-saga,
  liquidity-pool,log-minimizer,payment-scheduler}.md`; event-flow doc
  extended with the master-prompt mock chain.
- `register-modules.ts` now registers 13 modules (7 previous + 6 new).
- Root `README.md` rewritten with an explicit safety notice; backend
  README prepended with the same notice.
- Validation: `yarn typecheck`, `yarn check:boundaries`, `yarn lint`,
  `yarn build` all green. Tests: **149/149** passing (up from 132).
- Fastify app boots successfully; all 13 modules register cleanly.

## Prioritized backlog

- **P1** — Expose public HTTP endpoints for the new modules (currently
  only in-process). Proposed: `/api/admin/address-generator`,
  `/api/admin/blockchain-monitor`, `/api/admin/deposit-saga`,
  `/api/admin/liquidity-pool`, `/api/admin/payment-scheduler`
  (all gated by `x-admin-api-key`, consistent with F5).
- **P1** — Refactor the frontend to reflect master-prompt nomenclature
  (`/api/mix-sessions` naming in services/; pricing feature already aligned).
- **P2** — Persistence adapters (pg-backed) for the new modules (outside
  sandbox scope, only needed if the project evolves).
- **P2** — Outbox-driven cross-module event integration
  (`blockchain-monitor.deposit-detected` → `deposit-saga` consumer).
- **P3** — Prometheus exposition route `/metrics`.

## Test credentials

- `ADMIN_API_KEY=dev-admin-sandbox-key-please-change`
  (header `x-admin-api-key`).
