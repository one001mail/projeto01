# Event Flow (Outbox / Dispatcher / Inbox)

## Goals

1. **Atomicity** — domain state and the events it produces are persisted in the *same*
   transaction. No "event lost" / "event leaked without state" windows.
2. **At-least-once delivery** with idempotent consumers (the inbox dedupes by
   `eventId`).
3. **Decoupling** — producers know nothing about consumers; consumers subscribe by
   event name on the in-memory `EventBus`.

## Producer side

```
  use case ──> TransactionManager.run(async runner => {
                 await aggregateRepo.save(aggregate, runner);
                 await outbox.append(domainEvent, runner);   // SAME tx
               })
```

- `OutboxStore` (PG): `INSERT INTO outbox (...) VALUES (...)` participates in the
  caller's `pg.PoolClient` runner.
- In sandbox/in-memory mode, `InMemoryOutboxStore` records the entry in a queue
  and exposes the same surface so call sites do not branch.

## Dispatcher

`src/infra/events/outbox-dispatcher.ts` runs as a background worker:

1. Polls the outbox in batches (`OUTBOX_BATCH_SIZE`, every
   `OUTBOX_POLL_INTERVAL_MS` ms).
2. Marks rows as `dispatching`, publishes them to the in-memory `EventBus` for the
   monolith and (later) to an external bus for inter-service delivery.
3. On success → mark `dispatched`. On failure → exponential backoff with
   `OUTBOX_BACKOFF_BASE_MS` × `2^attempt`, capped by `OUTBOX_MAX_ATTEMPTS`.
4. Past `OUTBOX_MAX_ATTEMPTS`, rows go to a dead-letter slot for inspection.

The dispatcher is started/stopped by `src/app/workers.ts` via `startWorkers`.

## Consumer side

```
  app.ctx.eventBus.subscribe('LearningSession.Created', async (evt, ctx) => {
    if (await inbox.alreadyHandled(evt.id, runner)) return;
    await readModelRepo.upsert(...);
    await inbox.markHandled(evt.id, runner);
  });
```

- The **inbox** (`InboxStore`) is a per-consumer table that records `eventId` once
  it is processed, providing idempotency on retries.
- Subscriptions are declared in module `index.ts` via
  `src/infra/events/register-event-handlers.ts`.

## Failure semantics

| Phase                | Crash before                     | Effect                                     |
| -------------------- | -------------------------------- | ------------------------------------------ |
| use case             | tx commit                        | nothing happens — clean retry              |
| use case             | tx commit (after row written)    | dispatcher will eventually pick up row     |
| dispatcher           | publishing                       | retry; outbox still pending                |
| dispatcher           | marking dispatched               | event re-delivered; consumer dedupes (inbox) |
| consumer             | between handler and inbox mark   | consumer re-runs on next delivery; pure handlers must be idempotent |

## Sandbox fallback

When `SANDBOX_ONLY=true` and PG probe fails:

- `OutboxStore`, `InboxStore`, `IdempotencyStore`, `AuditLogStore` switch to
  in-memory implementations.
- The dispatcher continues to work in-process; events stay inside this Node
  process.
- This mode is **never** allowed in `NODE_ENV=production`.

## Files of interest

- `src/infra/events/outbox-store.ts`
- `src/infra/events/in-memory-outbox-store.ts`
- `src/infra/events/outbox-dispatcher.ts`
- `src/infra/events/inbox-store.ts`
- `src/infra/events/in-memory-inbox-store.ts`
- `src/infra/events/event-bus.ts`
- `src/infra/events/register-event-handlers.ts`
- `src/app/workers.ts`



## Master-prompt compatibility flow (SANDBOX / MOCK ONLY)

For architectural parity with the MASTER PROMPT, the following **mock**
event chain is emitted by the F6 sandbox modules. **Every payload carries
`sandbox: true` and every semantic field relating to crypto is clearly
mocked (`mockSessionId`, `mockTxid`, `mock: true`, `notAPayout: true`,
`notAWallet: true`).**

```
blockchain-monitor.deposit-detected            ── mock observation
    └─> deposit-saga.started                    ── mock saga
          ├─> liquidity-pool.liquidity-reserved ── mock reservation
          ├─> address-generator.address-generated ── mock sbx_ token
          ├─> payment-scheduler.payment-scheduled ── mock payout preview
          └─> log-minimizer.logs-minimized       ── retention-driven
                                                    cleanup
```

None of these events imply a real-world side effect. The chain exists to
demonstrate how a production system would compose bounded contexts;
every node in the chain is an in-memory stub gated by the sandbox
contract.
