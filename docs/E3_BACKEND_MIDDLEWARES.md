# Etapa F3 — Middlewares HTTP cross-cutting

> Saída do bloco F3 do PROMPT MESTRE.
> Idempotência, audit-log e admin-auth implementados como Fastify plugins
> (encapsulados via `fastify-plugin` para que os hooks valham na escopo
> de registro), com adapters PG e in-memory atrás de ports.

---

## 1. Arquivos criados

| Caminho                                                              | Camada            | Propósito |
| -------------------------------------------------------------------- | ----------------- | --------- |
| `backend/src/shared/application/ports/audit-log.port.ts`             | shared-port       | Port `AuditLogStore` (`record(entry)`). |
| `backend/src/shared/application/redaction.ts`                        | shared-application| Função pura `redactPayload` (paths dot-separados, suporte a wildcard `*`). |
| `backend/src/shared/application/redaction.test.ts`                   | shared-application| 8 testes de redação (clones, paths exatos, wildcards, arrays, edge cases). |
| `backend/src/infra/idempotency/in-memory-idempotency.store.ts`       | infra             | Adapter in-memory do port `IdempotencyStore`, usado em testes. |
| `backend/src/infra/idempotency/pg-idempotency.store.ts`              | infra             | Adapter PG do port; usa `idempotency_keys` (migração 009). |
| `backend/src/infra/audit/in-memory-audit-log.store.ts`               | infra             | Adapter in-memory do port `AuditLogStore`. |
| `backend/src/infra/audit/pg-audit-log.store.ts`                      | infra             | Adapter PG do port; usa `audit_logs` (migração 006). Erros engolidos com `logger.warn`. |
| `backend/src/infra/auth/api-key.admin-auth.ts`                       | infra             | Comparação constante (`timingSafeEqual`) de API key. |
| `backend/src/api/http/middlewares/idempotency.middleware.ts`         | api               | Plugin Fastify (`preHandler` + `onSend`). Header `Idempotency-Key`. |
| `backend/src/api/http/middlewares/audit-log.middleware.ts`           | api               | Plugin Fastify (`onResponse`). Aplica redação e grava 1 linha por mutação 2xx. |
| `backend/src/api/http/middlewares/admin-auth.middleware.ts`          | api               | Plugin Fastify (`onRequest`). 503 sem config / 401 sem header / 200 com header válido. |
| `backend/src/api/http/middlewares/middlewares.test.ts`               | api (test)        | 10 testes de integração via `app.inject()` cobrindo todos os 6 cenários exigidos. |

## 2. Arquivos modificados

| Caminho                                                | Mudança |
| ------------------------------------------------------ | ------- |
| `backend/src/shared/errors/error-codes.ts`             | + `SERVICE_UNAVAILABLE`. |
| `backend/src/shared/errors/app-error.ts`               | + `AppError.serviceUnavailable(message)` → 503. |
| `backend/src/shared/application/ports/index.ts`        | re-export do `audit-log.port`. |
| `backend/src/app/config.ts`                            | + `ADMIN_API_KEY` (optional, fail-closed), `IDEMPOTENCY_TTL_SECONDS` (default 86400), `AUDIT_REDACT_FIELDS` (default lista de paths sensíveis). |
| `backend/src/app/app-context.ts`                       | + `idempotency: IdempotencyStore`, `auditLog: AuditLogStore`. |
| `backend/src/app/dependency-container.ts`              | construção de `createPgIdempotencyStore` + `createPgAuditLogStore` no container. |
| `backend/src/app/register-plugins.ts`                  | + registro global do `auditLogMiddleware`; + `@fastify/rate-limit`. |
| `backend/src/app/register-routes.ts`                   | wrap `/api/admin/*` em scope com `adminAuthMiddleware` antes das rotas. |
| `backend/src/api/http/routes/admin-health.routes.ts`   | path interno `/admin/health` → `/health` (o prefixo `/admin` agora vem do scope externo). |
| `backend/src/api/http/routes/admin-health.routes.test.ts` | reescrita: testa 401 sem header e envelope válido com header. |
| `backend/src/modules/learning-sessions/index.ts`       | registra `idempotencyMiddleware` no scope `/api` antes das rotas do módulo. |
| `backend/src/modules/contact-requests/index.ts`        | idem. |
| `backend/tools/check-boundaries.ts`                    | regra `module-root` agora aceita importar de `api/` (motivo: módulo é composição e precisa wirar middlewares do seu próprio surface HTTP). |
| `backend/.env`                                         | + `ADMIN_API_KEY="dev-admin-sandbox-key-please-change"` (sandbox; deve ser substituída em prod). |

## 3. Comandos executados

```bash
# Implementação (bulk_file_writer + search_replace)

cd /app/backend
yarn typecheck                    # 0 erros
yarn lint                         # 0 erros
yarn check:boundaries             # 88 arquivos, 0 violações
yarn test                         # 14 suítes / 66 testes (era 12 / 48 antes do F3)
yarn build                        # ok

cd /app
yarn typecheck                    # frontend + backend ok
yarn lint                         # 0 erros
yarn test:coverage                # frontend 92,34% / backend 78,49% (gate 60%)
yarn build                        # ok

# Validação live via shim
sudo supervisorctl restart backend
curl http://127.0.0.1:8001/api/admin/health                         # 401 (sem header)
curl -H "x-admin-api-key: wrong" http://127.0.0.1:8001/api/admin/health  # 401
curl -H "x-admin-api-key: <correta>" http://127.0.0.1:8001/api/admin/health
                                                                    # 200/503 com envelope (degraded sem PG/Redis, esperado)
```

## 4. Endpoints impactados

| Endpoint                                  | Antes               | Depois                                                                    |
| ----------------------------------------- | ------------------- | ------------------------------------------------------------------------- |
| `GET /api/admin/health`                   | aberto              | exige `x-admin-api-key`. 503 quando `ADMIN_API_KEY` não está configurado. |
| `POST /api/learning-sessions`             | sem idempotência    | idempotente via `Idempotency-Key`; auditado em `audit_logs` (mutativo).   |
| `POST /api/contact-requests`              | sem idempotência    | idempotente via `Idempotency-Key`; auditado em `audit_logs`.              |
| `GET /api/learning-sessions/:publicCode`  | inalterado          | inalterado (GET — não eligível a idempotência nem auditoria).             |
| `GET /api/pricing`                        | inalterado          | inalterado.                                                               |

## 5. Exemplos de comportamento

### 5.1 Idempotência (resposta cacheada e replay marcado)

```http
POST /api/learning-sessions HTTP/1.1
Idempotency-Key: 9f0a-3c7e-4b2d
Content-Type: application/json

{"subject": "demo", "currency": "BTC"}
```

Primeira chamada:
```http
HTTP/1.1 201 Created
Content-Type: application/json
{"session": { "publicCode": "LS-...", ... }}
```

Segunda chamada (mesmo key, mesmo body):
```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
idempotent-replay: true
{"session": { "publicCode": "LS-...", ... }}     ← idêntica à primeira
```

Use case **não** roda novamente. Nada é gravado em outbox/audit_logs duas vezes.

Mesmo key, body diferente:
```http
HTTP/1.1 409 Conflict
{"error":{
  "code":"CONFLICT",
  "message":"Idempotency-Key was already used with a different request payload",
  "details":{"code":"IDEMPOTENCY_KEY_MISMATCH","key":"9f0a-3c7e-4b2d"}
}}
```

### 5.2 Audit log (1 linha por mutação 2xx, payload redigido)

`POST /api/contact-requests` com `{email, message, subject, name}` produz exatamente 1 row:

```json
{
  "scope": "http",
  "action": "POST /api/contact-requests",
  "request_id": "req-9f3...",
  "redacted_payload": {
    "method": "POST",
    "path": "/api/contact-requests",
    "statusCode": 202,
    "ip": "10.0.0.1",
    "headers": { "content-type": "application/json", "user-agent": "..." },
    "body": {
      "name": "Joana",
      "email": "<redacted>",
      "subject": "<redacted>",
      "message": "<redacted>"
    },
    "query": null,
    "params": null,
    "idempotencyReplay": false
  }
}
```

Notas:
- Headers sensíveis (`authorization`, `cookie`, `x-admin-api-key`) **não chegam** ao store: são removidos pelo allowlist `SAFE_HEADER_KEYS` antes da redação.
- Falha do PG **não** quebra o request — `pg-audit-log.store.ts` faz `try/catch` + `logger.warn`.

### 5.3 Admin auth

| Cenário                                       | Resposta                                                            |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `ADMIN_API_KEY` ausente / vazia               | 503 `SERVICE_UNAVAILABLE` ("Admin endpoint disabled")               |
| `ADMIN_API_KEY` configurada, header ausente   | 401 `UNAUTHORIZED` ("Missing or invalid admin API key")             |
| `ADMIN_API_KEY` configurada, header errado    | 401 `UNAUTHORIZED`                                                  |
| `ADMIN_API_KEY` configurada, header correto   | 200 com envelope normal; `req.actorId = 'admin-api-key'` para audit |

Comparação por `timingSafeEqual` (em `infra/auth/api-key.admin-auth.ts`).

## 6. Resultado dos gates

| Gate                                   | Resultado                                |
| -------------------------------------- | ---------------------------------------- |
| `cd backend && yarn typecheck`         | ✅ 0 erros                               |
| `cd backend && yarn lint`              | ✅ 101 arquivos, 0 erros                 |
| `cd backend && yarn check:boundaries`  | ✅ 88 arquivos, 0 violações              |
| `cd backend && yarn test`              | ✅ 14 suítes / **66 testes** passando    |
| `yarn typecheck` (raiz)                | ✅                                        |
| `yarn lint` (raiz)                     | ✅ 0 erros (7 warnings shadcn pré-existentes no frontend) |
| `yarn test:coverage` (raiz)            | ✅ frontend 92,34 % / backend 78,49 %    |
| `yarn build` (raiz)                    | ✅                                        |
| `supervisorctl restart backend`        | ✅ RUNNING                                |
| `curl preview /api/admin/health`       | ✅ 401 sem header / envelope com header   |

## 7. Riscos restantes

| #  | Risco                                                                         | Severidade | Notas                                                                                  |
| -- | ----------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| R1 | PG ausente no preview Emergent → idempotency-store e audit-log não persistem; rotas mutativas devolvem 500 (`ECONNREFUSED 5432`). | Médio | Esperado fora dos testes; o stack PG/Redis subirá em F4 quando dispatcher/worker forem ligados. |
| R2 | `--reload` do supervisor reinicia o shim (e o Fastify) ao tocar `.py`; durante reload requests podem retornar 502 transitoriamente. | Baixo | Inalterado de F2; documentado no shim. |
| R3 | Race condition em `pg-idempotency.store.ts` quando duas requisições simultâneas usam o mesmo key (ambas observam MISS). | Baixo | A PRIMARY KEY garante apenas um INSERT vence; loser vê MISMATCH na próxima passada. Aceitável no sandbox. |
| R4 | Sem rotação automática de `ADMIN_API_KEY`. | Baixo | Sandbox-only contract; rotação via `.env` + restart é suficiente. |
| R5 | `audit-log` middleware ainda usa rota PG diretamente; se o store falhar, perde-se a linha. | Baixo | Logado via `pino.warn`; reterá padrão "log + drop" até retenção/F7 endurecerem isso. |

## 8. Sandbox/mock — confirmação

Nada foi expandido na superfície sensível. Os middlewares F3 são **transversais** e não tocam nenhum domínio sensível. Continuam **sandbox/mock por design** (a serem materializados em F6):

- ❌ Sem gateway de blockchain
- ❌ Sem `broadcast` de transação
- ❌ Sem custódia real
- ❌ Sem engine de mixing operacional
- ❌ Sem chaves privadas persistidas
- ❌ Nenhuma rota nova exposta — apenas refinamento dos 5 endpoints já existentes

Garantias adicionais introduzidas em F3:
- ✅ Admin endpoints fail closed por contrato (config faltando → 503).
- ✅ Audit-log middleware redige PII por path antes de persistir (lista padrão em `Config.AUDIT_REDACT_FIELDS`; sobrescrevível por env).
- ✅ Hash de requisição em idempotência usa SHA-256 sobre JSON canônico (chaves ordenadas) — não há armazenamento de body bruto na coluna `request_hash`.

## 9. Próximo passo técnico (F4)

Implementar o pipeline assíncrono completo:

1. `infra/events/outbox-dispatcher.ts` — loop `SELECT ... FOR UPDATE SKIP LOCKED LIMIT N`, publica em `EventBus`, marca `dispatched_at`. Backoff exponencial + DLQ por `attempts >= N`.
2. `infra/queue/scheduler-worker.ts` — `scheduler_jobs` real, despacho por `job_type` em handlers registrados.
3. `infra/events/register-event-handlers.ts` — agora popula consumers reais via inbox.
4. `app/lifecycle.ts` — `startBackgroundWorkers()` chamado após `app.ready()` e parado em `onClose`. Gated por `Config.WORKERS_ENABLED` (false em testes).

Critério de aceitação F4: teste de integração que (a) emite evento via use case, (b) deixa o dispatcher correr, (c) confirma `dispatched_at != null` e que um handler consumiu (usando inbox para idempotência).
