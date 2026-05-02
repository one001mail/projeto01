# projeto01 — Sandbox / Educational Monorepo

> ⚠️ **Important Safety Notice**
>
> **This project is an educational sandbox.** It does **not** implement real
> cryptocurrency mixing, custody, wallet generation, blockchain monitoring,
> transaction broadcasting, liquidity movement, or payment execution. Every
> sensitive flow is **mock-only** and **non-operational**. No real funds, no
> real anonymity, no production use.

## Purpose

- Demonstrate a modular, Clean-Architecture / DDD backend (TypeScript +
  Fastify + Vitest) paired with a React (Vite) frontend.
- Illustrate, **in a safe and non-functional way**, how a real system might
  decompose into bounded contexts (address generation, blockchain
  monitoring, saga orchestration, liquidity pool, log minimization, payment
  scheduling) without ever touching money, keys or blockchains.
- Serve as a reference for architectural patterns (transaction outbox,
  event bus, idempotency, audit-log redaction, sandbox fallbacks).

## Repository layout

```
projeto01/
├─ backend/     # Node.js + TypeScript (Fastify, DDD, Vitest)
├─ frontend/    # React + Vite
└─ docs/        # architecture notes, playbooks
```

## Getting started

### Backend

```bash
cd backend
yarn install
yarn typecheck
yarn check:boundaries
yarn test
yarn dev          # starts the Fastify server (default :8081)
```

### Frontend

```bash
cd frontend
yarn install
yarn dev
```

## Architecture highlights

- **Bounded contexts** live under `backend/src/modules/`. Each module owns
  its `domain/`, `application/`, `infra/`, and `index.ts` composition root.
- **Cross-module communication goes through events only**; direct imports
  between modules are rejected at build time by
  `backend/tools/check-boundaries.ts`.
- **Sandbox contract** (non-negotiable): every module whose name or
  responsibility hints at a sensitive operation (mixing, deposits, payouts,
  blockchain, wallets) is implemented as a **mock**. The MASTER PROMPT
  forbids real operations; the check-boundaries tool keeps the boundaries
  honest.

## Master-prompt compatibility modules

For architectural parity with the MASTER PROMPT, `backend/src/modules/`
includes the following **SANDBOX / MOCK-ONLY** modules:

| Module              | Purpose (MOCK only)                                        |
| ------------------- | ---------------------------------------------------------- |
| `address-generator` | Issues opaque `sbx_*` tokens — not wallets, not addresses. |
| `blockchain-monitor`| Polls an in-memory provider — no real RPC / mempool.       |
| `deposit-saga`      | Mock state machine for educational orchestration.          |
| `liquidity-pool`    | Unitless mock slots — no real liquidity, no balances.      |
| `log-minimizer`     | Privacy-by-design redaction & retention windows.           |
| `payment-scheduler` | Mock scheduled events — no real payouts, no broadcast.     |

Each module ships a dedicated doc under `backend/docs/modules/*.md` that
restates the safety contract and the production gap.

## What this project does NOT do

- ❌ Mix or tumble real cryptocurrency.
- ❌ Generate wallets, private keys, or seed phrases.
- ❌ Connect to Bitcoin, Ethereum, mempool, RPC, block explorers.
- ❌ Broadcast transactions.
- ❌ Move funds, custody assets, or route liquidity.
- ❌ Provide anonymity guarantees.

## License / Use

Educational use only. Not suitable for production financial workloads.
