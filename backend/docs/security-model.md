# Security Model

Scope: this is a **sandbox-only educational backend**. No real custody, no real
cryptocurrency mixing, no money movement. The security primitives below exist to
protect against accidental misuse of the preview environment, not to certify the
code for production use.

## Threat model (preview/sandbox)

| Risk                                              | Mitigation                                          |
| ------------------------------------------------- | --------------------------------------------------- |
| Public scrapers / abusive clients                 | `@fastify/rate-limit` (default 120 req/min/IP)      |
| Header injection, XSS via JSON error pages        | `@fastify/helmet` lockdown CSP                      |
| CORS misuse from an unknown origin                | `CORS_ORIGINS` allowlist (default `*` in sandbox)   |
| Replay of mutating requests                       | `Idempotency-Key` middleware (24h TTL by default)   |
| Unauthorized admin operations                     | `X-Admin-API-Key` header + constant-time compare    |
| Information leakage in logs / audit trail         | Pino redaction + audit-log dot-path redaction       |
| Runaway requests / oversized bodies               | `REQUEST_TIMEOUT_MS`, `BODY_LIMIT_BYTES`            |
| Concurrent write races                            | TransactionManager + outbox in single PG tx         |

## Layers in order

1. **Transport** — `helmet`, `cors`, request timeouts, body limit. Configured in
   `src/app/register-plugins.ts`.
2. **Rate limit** — `@fastify/rate-limit`, applied app-wide.
3. **Idempotency** — `src/api/http/middlewares/idempotency.middleware.ts`,
   scoped to `/api/learning-sessions` and `/api/contact-requests`.
4. **Admin auth** — `src/api/http/middlewares/admin-auth.middleware.ts`, scoped
   to `/api/admin/*`.
5. **Validation** — every controller validates input with Zod schemas in
   `src/api/http/schemas/`. Anything not in the schema is rejected.
6. **Domain invariants** — enforced in module `domain/` (e.g. status state
   machine, public-code uniqueness check).
7. **Audit log** — global `onResponse` hook for mutating verbs writes a
   redacted entry. See [`logging-retention.md`](./logging-retention.md).

## Admin API key

- `ADMIN_API_KEY` is read once at boot from `Config`.
- If unset → admin endpoints **fail closed** with HTTP 503 + code
  `ADMIN_AUTH_NOT_CONFIGURED`. The endpoints stay registered so probes don't
  silently 404.
- Comparison is constant-time (`crypto.timingSafeEqual`) to defeat timing
  oracles.

## Idempotency contract

- Header: `Idempotency-Key`, max length 200, alphanumeric + `-_`.
- Server stores `(method, path, key)` → `{statusCode, bodyHash, body}` for
  `IDEMPOTENCY_TTL_SECONDS` (default 24 h).
- A repeat request with the same key:
  - same body → returns the cached response (replay).
  - different body → HTTP 409 `IDEMPOTENCY_KEY_REUSED`.

## Secrets management (sandbox)

- All secrets come from `process.env` and pass through Zod validation.
- `.env` is ignored by `.gitignore`; `.env.example` is the canonical template.
- No hardcoded credentials anywhere in the source. Run
  `rg -n 'password|secret|api.?key' src/` periodically to verify.

## What is intentionally absent

- No user authentication / sessions / OAuth (the preview never holds user
  identity).
- No KMS / wallet / signing infrastructure.
- No webhook receivers from payment networks or chains.
- No cookie-based auth or CSRF tokens (API-only, header-driven).
