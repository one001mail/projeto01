# `contact-requests` module

## Purpose

Receives generic "contact us" submissions from the marketing pages. Persists
the minimum payload needed to demonstrate the flow — never dispatches email,
never forwards externally.

## HTTP surface

| Method | Path                       | Description                       |
| ------ | -------------------------- | --------------------------------- |
| POST   | `/api/contact-requests`    | Submit a contact request          |

Mutations are protected by the global idempotency middleware
(`Idempotency-Key` header).

## Domain events emitted

| Event name                              | Payload (sketch)                     |
| --------------------------------------- | ------------------------------------ |
| `ContactRequest.Created`                | `{ id, createdAt }`                  |

## Domain events consumed

*(none)*

## Persistence

| Table                  | Purpose                                 |
| ---------------------- | --------------------------------------- |
| `contact_requests`     | aggregate root                          |
| `outbox`               | pending domain events                   |

Fields `email`, `subject`, `message` are stored as-is **only** in the row;
they are redacted out of every log and audit entry.

## Open issues / TODO

- Add a `DELETE /api/contact-requests/:id` admin endpoint for subject-rights
  deletion.
- Add a scheduled cleanup job (retention TTL).
