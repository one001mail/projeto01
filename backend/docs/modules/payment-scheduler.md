# `payment-scheduler` module

**Status:** SANDBOX / MOCK ONLY — **NO REAL PAYOUTS**.

## Responsibility

Schedules mock educational events that *look* like payouts but never
actually move funds.

## Sandbox classification

- **Sandbox:** yes.
- **Mock-only:** yes.
- **Real payouts:** **no**.
- **Broadcasts transactions:** **no**.
- **Wallet integration:** **no**.

## What it does

- Accepts a `schedulePayments({ amount, delaySeconds, priority })` command.
- Enforces invariants on amount / delay.
- Transitions through `scheduled → released` (or `failed`).
- Publishes mock events tagged with `notAPayout: true`.

## What it explicitly does NOT do

- Does NOT connect to any payment processor.
- Does NOT send money.
- Does NOT store card / bank credentials.
- Does NOT interact with any wallet or blockchain.

## Events

- Publishes: `payment-scheduler.payment-scheduled`,
  `payment-scheduler.payment-released`,
  `payment-scheduler.payment-failed`.
