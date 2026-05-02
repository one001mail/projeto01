# `log-minimizer` module

**Status:** Privacy-by-design; sandbox-safe.

## Responsibility

- Redacts log payloads by dotted path.
- Enforces a retention window on log records (hard cutoff per scope).
- Documents the minimization contract so audits can verify compliance.

## What it explicitly does NOT do

- Does NOT delete logs with the intent of obscuring suspicious activity.
- Does NOT bypass audit trails.
- Does NOT exfiltrate data.

## Contract

> Logs are minimized **by design**, never **anti-forensically**. Redaction
> obscures values that must not be stored (emails, auth tokens, PII) but
> preserves the structure needed to debug and audit the system.

## Events

- Publishes: `log-minimizer.logs-minimized`.

## Dependencies

- Consumes `shared/application/redaction.ts` **at the application layer**
  only; the domain service accepts the redaction function as a parameter
  to preserve Clean-Architecture boundaries.
