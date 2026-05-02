# `deposit-saga` module

**Status:** SANDBOX / MOCK educational orchestrator.

## Responsibility

Orchestrates the mock state machine
`STARTED → ACCEPTED → ROUTED → COMPLETED (or FAILED)` for a sandbox
session. Demonstrates how a saga would coordinate multiple bounded
contexts in a real system without actually performing any side effect.

## Sandbox classification

- **Sandbox:** yes.
- **Mock-only:** yes.
- **Touches real blockchain:** **no**.
- **Moves funds:** **no**.
- **Settles payments:** **no**.

## What it does

- Persists saga state transitions through a repository port.
- Raises in-memory domain events on every transition.
- Rejects invalid transitions at the entity layer.
- Supports compensation: any non-terminal state may be forced to
  `FAILED` with a reason.

## What it explicitly does NOT do

- Does NOT talk to any blockchain.
- Does NOT send emails, SMS, or webhooks.
- Does NOT broadcast transactions.

## Events

- Publishes: `deposit-saga.started`, `deposit-saga.accepted`,
  `deposit-saga.routed`, `deposit-saga.failed`, `deposit-saga.completed`.
- Consumes: none (but a real system would consume
  `blockchain-monitor.deposit-detected` to drive `ACCEPTED`).

## Production gaps

- No outbox-backed cross-module event publication is wired yet; events are
  local to the aggregate. Adding outbox integration is a future task.
