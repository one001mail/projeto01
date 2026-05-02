# `learning-sessions` module

## Purpose

Demonstrative "educational session" lifecycle. Each session has a public, opaque
code that the front-end uses to look it up. **No real funds, no real custody.**

## HTTP surface

| Method | Path                                  | Description                              |
| ------ | ------------------------------------- | ---------------------------------------- |
| POST   | `/api/learning-sessions`              | Create a new session, returns publicCode |
| GET    | `/api/learning-sessions/:publicCode`  | Read session by public code              |

Mutations are protected by the global idempotency middleware
(`Idempotency-Key` header).

## Domain events emitted

| Event name                         | Payload (sketch)                          |
| ---------------------------------- | ----------------------------------------- |
| `LearningSession.Created`          | `{ id, publicCode, createdAt }`           |

Events are appended to the outbox in the same transaction as the aggregate.

## Domain events consumed

*(none)*

## Persistence

| Table                  | Purpose                          |
| ---------------------- | -------------------------------- |
| `learning_sessions`    | aggregate root                   |
| `outbox`               | pending domain events            |

In sandbox fallback, both stores are in-memory.

## Open issues / TODO

- Add a status state machine (currently single state).
- Wire a read-model consumer for analytics demos (P5).
