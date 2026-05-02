# Privacy Model

This service is an **educational preview**. It must never collect, persist, or
forward personally identifiable information beyond what is strictly required to
demonstrate flows, and any data that does enter the system must be *minimised
at the boundary* before it reaches a store or a log.

## Data classes

| Class                                             | Examples                            | Handling                                  |
| ------------------------------------------------- | ----------------------------------- | ----------------------------------------- |
| **Public**                                        | pricing tiers, fee schedules        | persistent, cacheable, freely loggable    |
| **Operational**                                   | request id, timestamps, status      | persistent, loggable                      |
| **Restricted**                                    | contact email, free-text `message`  | redacted in logs and audit trail; stored only when the use case requires it |
| **Forbidden**                                     | wallet private keys, ID documents   | rejected at validation; never stored      |

## Boundary minimisation

- Every public POST endpoint validates with a strict Zod schema. Unknown fields
  are rejected via `.strict()`.
- Free-text fields are length-capped (`message <= 2000 chars`,
  `subject <= 200`).
- Email addresses are stored as-is **only** in the `contact-requests` module
  for the duration of the demonstration; no notifications are dispatched.
- Wallet/blockchain identifiers are out of scope — the preview never receives
  them.

## Redaction at logging time

Two independent redaction layers cover the same fields:

1. **Pino redaction** (`LOG_REDACT_PATHS`) — strips authorization/cookie
   headers from request logs.
2. **Audit-log redaction** (`AUDIT_REDACT_FIELDS`) — strips body/email/headers
   before the audit row is persisted.

Default `AUDIT_REDACT_FIELDS`:

```
body.email, body.message, body.subject, body.password, body.token,
body.metadata_minimized, headers.authorization, headers.cookie,
headers.x-admin-api-key
```

Both lists are environment-driven; an operator can extend them per deploy
without touching code.

## Retention

See [`logging-retention.md`](./logging-retention.md). The current TTLs:

| Data                          | TTL                       |
| ----------------------------- | ------------------------- |
| Pino HTTP logs                | `LOG_RETENTION_DAYS=7`    |
| Audit-log rows                | matches operational data  |
| Idempotency cache             | `IDEMPOTENCY_TTL_SECONDS` |
| Contact requests (sandbox)    | manual purge — preview-only |

## Subject rights

Although the preview is non-production, every persisted row stores a
`request_id` so that an operator can locate and delete entries belonging to a
specific submission. The `contact-requests` module exposes a deletion path
behind `admin-auth` for that purpose (planned).

## What is intentionally absent

- No analytics, telemetry, or third-party trackers.
- No mailing list / marketing copy.
- No cookies set by the API.
