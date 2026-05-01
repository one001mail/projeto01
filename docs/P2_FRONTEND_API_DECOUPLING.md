# P2 — Frontend API Decoupling

**Goal:** Remove direct Supabase usage from the frontend. Every network
interaction must flow through a single, typed, retry-aware HTTP client that
talks to our own backend via `REACT_APP_BACKEND_URL` + the `/api` prefix
enforced by the Kubernetes ingress.

---

## 1. Checkpoint status

| Gate                                             | Status |
| ------------------------------------------------ | ------ |
| `0` references to `@supabase/supabase-js` in `src` | ✅     |
| `0` references to any `supabase` client/function in `src` | ✅     |
| All feature data flows through `src/shared/api`  | ✅     |
| Uniform error type (`ApiError`) at every call site | ✅     |
| `yarn typecheck`                                 | 0 errors |
| `yarn lint`                                      | 0 errors, 7 pre-existing warnings |
| `yarn test`                                      | 41/41 (8 new) |
| `yarn test:coverage` (domain)                    | 92.34% lines (gate ≥ 60%) |
| `yarn build`                                     | ✅     |

Verification command:

```bash
grep -rn "supabase\|@supabase" /app/frontend/src
# → no output
```

---

## 2. New module: `src/shared/api/`

```
src/shared/api/
├── ApiError.ts          # ApiError class + isApiError + ApiErrorKind
├── endpoints.ts         # Centralized API path map (all /api/*)
├── httpClient.ts        # fetch wrapper: JSON, timeout, retries, normalization
├── httpClient.test.ts   # 8 unit tests (success, serialization, 4xx/5xx,
│                        #  retry policy, network error, query string)
└── index.ts             # Barrel
```

### 2.1 `ApiError`

Single error type across the UI. Every failure mode is normalized to one of:

| `kind`     | Triggered by                                                    | `retriable` |
| ---------- | --------------------------------------------------------------- | ----------- |
| `network`  | `fetch` threw (e.g. `TypeError: Failed to fetch`)               | ✅          |
| `timeout`  | Per-request `AbortController` fired on `timeoutMs`              | ✅          |
| `aborted`  | Caller-supplied `AbortSignal`                                   | ❌          |
| `http`     | Non-2xx response                                                | 5xx only    |
| `parse`    | JSON body failed `JSON.parse`                                   | ❌          |
| `unknown`  | Defensive fallback                                              | ❌          |

Fields: `message`, `kind`, `status?`, `code?`, `details?`, `cause?`.

### 2.2 `httpClient`

```ts
httpClient.get<T>(path, options?)
httpClient.post<T>(path, body?, options?)
httpClient.put<T>(path, body?, options?)
httpClient.patch<T>(path, body?, options?)
httpClient.delete<T>(path, options?)
```

Behavior:

* **Base URL:** `import.meta.env.REACT_APP_BACKEND_URL`, trailing slash
  stripped. Never hardcoded.
* **JSON:** `Accept: application/json` always; `Content-Type: application/json`
  auto-added when a body is present on non-GET methods.
* **Timeout:** default `15 000 ms`; configurable via `timeoutMs` (0 disables).
* **Retries:** exponential backoff (`200ms · 2^n`, configurable).
  * Default attempts: `GET/PUT/DELETE` = 2, `POST/PATCH` = 0.
  * Only retries when `ApiError.retriable === true` (network, timeout, 5xx).
  * Never retries 4xx, aborts, or parse errors.
* **Query params:** `options.query` is URL-encoded and `undefined`/`null`
  values are dropped.
* **Abort support:** caller can pass `AbortSignal`; internal controller is
  linked via `addEventListener('abort', …, { once: true })`.

### 2.3 `endpoints`

```ts
endpoints.mixSessions.create()         // POST  /api/mix-sessions
endpoints.mixSessions.byCode(code)     // GET   /api/mix-sessions/:code
endpoints.sessions.create()            // POST  /api/sessions
endpoints.contactRequests.create()     // POST  /api/contact-requests
endpoints.health()                     // GET   /api/health
```

All paths use the `/api` prefix required by the Kubernetes ingress rule.

---

## 3. Request flow

```
 React component
      │  user action
      ▼
 Feature hook  (useMixingForm / useSessionLookup / useCreateSession / useContactForm)
      │  calls
      ▼
 Feature service  (features/<feature>/services/<feature>Api.ts)
      │  builds typed payload + picks endpoint
      ▼
 shared/api  ─────────────────────────────────────────────┐
   ├── endpoints.ts        (path map, /api/…)             │
   ├── httpClient.ts       (fetch + JSON + timeout +      │
   │                        retry + error normalization)  │
   └── ApiError.ts         (unified failure type)         │
      │                                                   │
      ▼                                                   │
 REACT_APP_BACKEND_URL + /api/<path>                      │
      │  (Kubernetes ingress → backend on :8001)          │
      ▼                                                   │
 Backend service                                          │
      │                                                   │
      └──► success  ─►  typed T returned to hook          │
      └──► failure  ─►  ApiError thrown ──────────────────┘
                          │
                          ▼
                    hook maps to user-facing error state
                    (error.message on useMixingForm, toast,
                     React-Query mutation error, etc.)
```

---

## 4. Removed usages

### 4.1 Deleted files

| Path                                           | Why                       |
| ---------------------------------------------- | ------------------------- |
| `src/integrations/supabase/client.ts`          | No longer imported        |
| `src/integrations/supabase/types.ts`           | No longer imported        |
| `src/integrations/` (empty after removal)      | Folder removed            |

### 4.2 Dropped dependency

| Package                 | Action             |
| ----------------------- | ------------------ |
| `@supabase/supabase-js` | Removed from `package.json` + lockfile regenerated via `yarn install` |

### 4.3 Rewritten call sites

| File                                              | Before (Supabase)                                         | After (shared/api)                                    |
| ------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------- |
| `features/mixing/services/mixingApi.ts`           | `supabase.functions.invoke("mix-session", …)`             | `httpClient.post(endpoints.mixSessions.create(), …)`  |
| `features/mixing/services/mixingApi.ts`           | `fetch('https://<proj>.supabase.co/functions/v1/mix-session?session_code=…', { headers: apikey/Authorization })` | `httpClient.get(endpoints.mixSessions.byCode(code))`  |
| `features/session/services/sessionsApi.ts`        | `supabase.functions.invoke("sessions", …)`                | `httpClient.post(endpoints.sessions.create(), …)`     |
| `features/contact/services/contactApi.ts`         | `supabase.from("contact_requests").insert(...)`           | `httpClient.post(endpoints.contactRequests.create(), …)` |

Legacy env variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID` are now **unused**. They are left in
`frontend/.env` to avoid modifying that file (protected) but are referenced
from nowhere in `src/`.

---

## 5. Updated hooks

No hook signatures changed — all services expose the same function names
and return types they did before, so the React layer is unchanged.

| Hook                                               | Service calls (now via httpClient)                    |
| -------------------------------------------------- | ----------------------------------------------------- |
| `features/mixing/hooks/useMixingForm.ts`           | `createMixSession(payload)`                           |
| `features/mixing/hooks/useSessionLookup.ts`        | `lookupMixSession(code)`                              |
| `features/session/hooks/useCreateSession.ts`       | `createSession(payload)` (wrapped in React-Query mutation) |
| `features/contact/hooks/useContactForm.ts`         | `submitContactRequest(data)`                          |

Each hook already catches failures with `err instanceof Error`; since
`ApiError extends Error`, the existing error-message propagation works
as-is. `sessionsApi.ts` additionally re-throws as a plain `Error` to keep
React-Query's `Error` generic stable.

---

## 6. Standardized error handling

Every call site now receives exactly one error shape:

```ts
try {
  const session = await createMixSession(payload);
} catch (err) {
  // err is ApiError (or a plain Error whose message came from ApiError)
  //   err.kind     → 'http' | 'network' | 'timeout' | …
  //   err.status   → number for HTTP failures
  //   err.code     → backend error_code/code when provided
  //   err.message  → server-provided message, falling back to `HTTP <status>`
  //   err.retriable→ whether the client will/did retry
}
```

This replaces three separate error idioms (Supabase `{ data, error }`
tuples, custom `fetch` + `res.ok` checks, Postgrest `error` objects) with
one.

---

## 7. Tests added

`src/shared/api/httpClient.test.ts` — 8 specs:

1. Parses JSON success response.
2. Serializes POST body as JSON and sets `Content-Type`.
3. Normalizes 4xx into `ApiError` (`status`, `code`, `message`).
4. Does **not** retry non-idempotent POST on 500 by default.
5. Retries GET on transient 5xx up to default retry count (3 fetch calls,
   final 200).
6. Retries on network errors and eventually throws an `ApiError` of
   kind `network`.
7. Does **not** retry 4xx HTTP errors even when `retries: 3`.
8. Query strings: URL-encoded, drops `undefined`, keeps typed values.

All 8 pass. Total suite: 41/41.

---

## 8. Files touched (summary)

Created:

* `frontend/src/shared/api/ApiError.ts`
* `frontend/src/shared/api/endpoints.ts`
* `frontend/src/shared/api/httpClient.ts`
* `frontend/src/shared/api/index.ts`
* `frontend/src/shared/api/httpClient.test.ts`
* `docs/P2_FRONTEND_API_DECOUPLING.md` (this file)

Rewritten:

* `frontend/src/features/mixing/services/mixingApi.ts`
* `frontend/src/features/session/services/sessionsApi.ts`
* `frontend/src/features/contact/services/contactApi.ts`

Deleted:

* `frontend/src/integrations/supabase/client.ts`
* `frontend/src/integrations/supabase/types.ts`
* `frontend/src/integrations/` (empty directory)

Modified:

* `frontend/package.json` — removed `@supabase/supabase-js`
* `frontend/yarn.lock` — regenerated

---

## 9. Follow-ups (out of scope for P2)

1. Backend endpoints `/api/mix-sessions`, `/api/mix-sessions/:code`,
   `/api/sessions`, `/api/contact-requests` need to be implemented on the
   Node/Fastify backend (currently only `GET /health` is live). The
   frontend is now wired and ready — only server-side work remains.
2. The unused `VITE_SUPABASE_*` entries in `frontend/.env` can be removed
   in a dedicated env-cleanup task (left untouched here to keep this phase
   zero-config-surface).
3. React-Query wrappers for mixing calls can be added for cache/retry
   parity with `useCreateSession`.
