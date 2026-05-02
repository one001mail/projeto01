# ETAPA 0 — Diagnóstico do Repositório e Plano de Execução

> Documento somente de diagnóstico e planejamento.
> Nenhuma mudança estrutural foi aplicada nesta etapa.
> Aderência ao PROMPT MESTRE: TypeScript + Fastify + Zod + PostgreSQL + Redis +
> Vitest + Pino + Docker Compose, Clean Architecture / DDD modular,
> privacidade por arquitetura, sandbox/mock para qualquer operação sensível.

---

## 1. Diagnóstico do estado atual

### 1.1 Coexistência de dois "backends"

O monorepo possui **dois diretórios de backend** vivos simultaneamente:

| Diretório         | Stack                                | Estado                                    | Quem o executa                  |
| ----------------- | ------------------------------------ | ----------------------------------------- | ------------------------------- |
| `/app/backend/`   | **Python 3 + FastAPI + Motor/Mongo** | Stub do template Emergent — 1 arquivo (`server.py`, 76 linhas) com endpoints `GET /api/` e `POST/GET /api/status` apenas. Sem testes, sem domínio, sem arquitetura. | `supervisord` (porta 8001) — programa `[program:backend]` em arquivo **READONLY** em `/etc/supervisor/conf.d/supervisord.conf`. |
| `/app/backend-node/` | **Node 20 + TypeScript + Fastify + Zod + PG + Redis + Pino + Vitest + Biome + Docker Compose** | Backend real, maduro: composição em `app/`, 3 módulos DDD (`learning-sessions`, `contact-requests`, `pricing`) + módulo `_template`, ports compartilhados, transaction manager + outbox + inbox, validador de fronteiras `tools/check-boundaries.ts`, 11 migrações SQL, **48 testes verdes**, cobertura **78,69 %**, Docker Compose `api + postgres + redis`. | Não está no supervisor — roda manualmente via `yarn dev` ou `docker compose up`. |

### 1.2 Aderência arquitetural do `backend-node/`

Já cumpre, hoje, **a maior parte do PROMPT MESTRE**:

- ✅ TypeScript estrito, ESM, `tsx watch` em dev, `tsc -p tsconfig.build.json` em build.
- ✅ Fastify 4 + Zod 3 + Helmet + CORS + Rate-limit + Sensible.
- ✅ Pino + redação de paths sensíveis (`req.headers.authorization`, `cookie`).
- ✅ Pool `pg` lazy + `ioredis` lazy + healthcheck por adapter.
- ✅ Clean Architecture / DDD modular validada por checador de fronteiras (`tools/check-boundaries.ts`) executado em CI (`.github/workflows/architecture.yml`).
- ✅ Ports compartilhados em `shared/application/ports/` (Clock, UUID, Logger, EventBus, Queue, IdempotencyStore, TransactionManager, DomainEvent).
- ✅ Outbox PG + Inbox PG + EventBus in-memory.
- ✅ TransactionManager PG real, com escopo por `cls/AsyncLocalStorage` (`getCurrentRunner`).
- ✅ Composition root único em `app/dependency-container.ts`, sem `process.env` fora de `app/config.ts`.
- ✅ 11 migrações SQL versionadas, cobrindo: init, learning_sessions, generated_tokens, resource_reservations, scheduler_jobs, audit_logs, outbox_events, inbox_events, idempotency_keys, rate_limits, contact_requests.
- ✅ Docker Compose (api/postgres/redis) + Dockerfile multi-stage `dev`/`prod`.
- ✅ CI gates: typecheck, lint Biome, fronteiras, testes, cobertura ≥ 60 %, build.

### 1.3 O que **falta** para atingir 100 % do PROMPT MESTRE

#### A. Diretório de destino errado
O PROMPT MESTRE exige `backend/`. Hoje o backend real vive em `backend-node/` e `backend/` é ocupado por um stub Python sem relação. **Migração estrutural obrigatória.**

#### B. Tabelas migradas porém **sem módulo**
As migrações 003–006 e 009–010 criaram tabelas que ainda não têm bounded context implementado:

| Migração                       | Tabela                  | Módulo correspondente | Estado              |
| ------------------------------ | ----------------------- | --------------------- | ------------------- |
| `003_generated_tokens.sql`     | `generated_tokens`      | `generated-tokens`    | **ausente**         |
| `004_resource_reservations.sql`| `resource_reservations` | `resource-reservations` | **ausente**       |
| `005_scheduler_jobs.sql`       | `scheduler_jobs`        | (worker / `infra`)    | **sem worker**      |
| `006_audit_logs.sql`           | `audit_logs`            | `audit-logs`          | **ausente**         |
| `009_idempotency_keys.sql`     | `idempotency_keys`      | (middleware HTTP)     | port existe, **adapter PG e middleware ausentes** |
| `010_rate_limits.sql`          | `rate_limits`           | (plugin Fastify)      | plugin nativo já roda em memória; **store PG ausente**, opcional |

#### C. Pipeline de eventos incompleto
- ✅ `OutboxStore` PG existe e use cases já gravam nele dentro da transação.
- ❌ **Não existe dispatcher**: nenhum processo lê linhas pendentes de `outbox_events` e publica no `EventBus`.
- ✅ `InboxStore` PG existe (idempotência de consumo).
- ❌ **Não existe consumer registrado** em `infra/events/register-event-handlers.ts` — o arquivo está vazio/stub.

#### D. Worker de jobs ausente
`scheduler_jobs` foi migrado, mas não há processo `infra/queue/scheduler-worker.ts` que faça `SELECT … FOR UPDATE SKIP LOCKED` e processe jobs (BullMQ é citado no Compose mas não usado — fica `noop-queue`).

#### E. Middlewares HTTP cross-cutting
Existe somente `request-context.middleware.ts`. Faltam:
- `idempotency.middleware.ts` (consome o port `IdempotencyStore` + `idempotency_keys`).
- `audit-log.middleware.ts` (grava `audit_logs.redacted_payload` por requisição mutativa).
- `request-id.middleware.ts` (já feito implicitamente por `genReqId` no Fastify; consolidar).
- `admin-auth.middleware.ts` (proteger `/api/admin/*` — hoje `admin-health` está aberto).

#### F. Ports / adapters sandbox-mock obrigatórios pelo PROMPT MESTRE
O PROMPT MESTRE proíbe blockchain real, transações reais, custódia real e mixing real. Para que a arquitetura seja honesta sobre essa fronteira, é necessário **expor os ports** e fornecer **adapters `noop-sandbox`**:

| Port (em `shared/application/ports/`)              | Adapter sandbox em `infra/`                            | Estado         |
| -------------------------------------------------- | ------------------------------------------------------ | -------------- |
| `BlockchainGateway` (read-only, observação)        | `infra/blockchain/sandbox-blockchain.gateway.ts`        | **ausente**    |
| `TransactionDispatcher` (assinatura/broadcast)     | `infra/blockchain/sandbox-transaction-dispatcher.ts`    | **ausente**    |
| `CustodyService`                                   | `infra/custody/sandbox-custody.service.ts`              | **ausente**    |
| `MixingEngine`                                     | `infra/mixing/sandbox-mixing.engine.ts`                 | **ausente**    |

Cada adapter sandbox deve apenas:
- registrar a chamada em `audit_logs` com payload **já redigido**;
- emitir um evento de domínio explicitando `mode: "sandbox"`;
- nunca abrir socket externo, nunca assinar nada, nunca tocar chave privada.

#### G. Endpoints administrativos sem autenticação
`GET /api/admin/health` está aberto. PROMPT MESTRE exige port `AdminAuth` + adapter `infra/auth/api-key.admin-auth.ts` lendo de `Config.ADMIN_API_KEY`.

#### H. CI / Boundaries / Cobertura
- `.github/workflows/ci.yml` e `architecture.yml` referenciam `backend-node/`. Após migração, todos os caminhos precisam apontar para `backend/`.
- Cobertura global está em **78,69 %** (ok). Meta do PROMPT MESTRE não está explicitada, mas manter ≥ 70 % global e ≥ 90 % em `domain/` é prudente.

#### I. Documentação
- `architecture.md` referencia `backend-node/` em todas as seções de enforcement.
- `README.md` raiz é vazio (uma linha).
- `backend-node/README.md` descreve apenas a fase B1 e está obsoleto.

### 1.4 Restrições do ambiente Emergent (RISCO ESTRUTURAL)

O arquivo `/etc/supervisor/conf.d/supervisord.conf` está marcado como **READ-ONLY** e contém:

```
[program:backend]
command=/root/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1 --reload
directory=/app/backend
```

O ingress Kubernetes só roteia `/api/*` para `0.0.0.0:8001` no container — o que hoje é o **stub Python**. Mover o backend Node para `backend/` **não basta**: é preciso resolver o conflito com supervisor, senão o preview deixa de responder.
**Esse risco é tratado em F2 do plano.**

---

## 2. Plano de execução por fases

> Cada fase é independentemente testável.
> Cada fase termina com `yarn ci` verde + checagem manual da rota afetada.
> O backend permanece compilável e iniciável em **toda** transição intermediária.

### F1 — Migração estrutural `backend-node/` → `backend/`
**Objetivo**: PROMPT MESTRE exige o caminho `backend/`. Mover preservando histórico e código útil.

Passos:
1. Mover **todo** o conteúdo de `backend-node/` para `backend/` via `git mv` arquivo-a-arquivo (preserva histórico).
2. Antes de mover, fazer **backup** do stub Python: `mv backend/server.py backend-python-template-stub.py.bak` na raiz, e `mv backend/requirements.txt …`. Os arquivos Python serão removidos definitivamente em F2 quando o substituto estiver pronto.
3. Atualizar:
   - `/app/package.json` — todos os scripts `cd backend-node` → `cd backend`.
   - `.github/workflows/ci.yml` e `.github/workflows/architecture.yml` — caminhos.
   - `architecture.md` — todas as menções a `backend-node`.
   - `frontend/src/shared/api/endpoints.ts` (se houver hardcoding).
   - `docs/P0_*.md`, `docs/P1_*.md`, `docs/P2_*.md`, `docs/P3_*.md`.
   - `Dockerfile` (paths internos), `docker-compose.yml` (volume mounts).
4. Validar: `yarn ci` da raiz precisa passar.

**Critério de aceitação**: zero referências a `backend-node` em `git grep -nE 'backend-node'` (excluindo este documento e changelogs).

### F2 — Compatibilidade com supervisor (Emergent)
**Objetivo**: o ingress só fala com `0.0.0.0:8001` via uvicorn. Precisamos manter o supervisor feliz **sem** rebaixar a arquitetura Node.

Estratégia decidida: **adapter Python "shim"** em `backend/server.py` que faz **apenas** proxy reverso assíncrono para o Fastify.

Passos:
1. Criar `backend/server.py` — FastAPI mínimo que:
   - Sobe Pop em background subprocess (`tsx src/index.ts` ou `node dist/index.js`) em porta interna **8081**.
   - Espera o Fastify ficar `READY` (poll em `/health`).
   - Faz proxy reverso de **todas** as rotas para `http://127.0.0.1:8081` usando `httpx.AsyncClient` em modo `stream`.
   - Encaminha headers, body, query, status, e content-type.
   - Loga via Pino do Fastify; o Python só faz pass-through.
2. Atualizar `backend/requirements.txt`: `fastapi`, `uvicorn[standard]`, `httpx`.
3. Adicionar healthcheck Python em `/health-shim` que retorna `{shim:"ok", upstream:"<status>"}`.
4. Documentar no novo `backend/README.md` que **em produção real** (Vercel/Fly/etc) o supervisor não existe e o `node dist/index.js` roda direto.

**Critério de aceitação**: `curl https://<preview>/api/admin/health` retorna a resposta gerada pelo Fastify.

> **Nota**: nenhum código sensível roda em Python. O shim é puramente um adaptador de processo.

### F3 — Middlewares HTTP cross-cutting
**Objetivo**: completar `api/http/middlewares/`.

Arquivos a criar:
- `api/http/middlewares/idempotency.middleware.ts` — Fastify hook `preHandler` que lê `Idempotency-Key`, consulta `IdempotencyStore` (port), retorna resposta cacheada se hit.
- `api/http/middlewares/audit-log.middleware.ts` — `onResponse` hook que grava `audit_logs.redacted_payload` para verbos `POST/PUT/PATCH/DELETE`. Usa redator centralizado (lista de paths sensíveis vinda de `Config`).
- `api/http/middlewares/admin-auth.middleware.ts` — checa `x-admin-api-key` contra `Config.ADMIN_API_KEY`. Sem chave configurada → middleware rejeita 503 (não permite "modo aberto" silencioso).
- `infra/idempotency/pg-idempotency.store.ts` — adapter PG que implementa o port (port em `shared/application/ports/idempotency-store.port.ts` já existe).
- `infra/auth/api-key.admin-auth.ts` — adapter sandbox que valida API key constante.

Aplicar middlewares:
- `idempotency` apenas em rotas marcadas (`POST /api/learning-sessions`, `POST /api/contact-requests`).
- `audit-log` em todas mutativas.
- `admin-auth` no plugin `/api/admin/*`.

**Critério de aceitação**: testes integrados (vitest) demonstrando: header repetido devolve corpo cacheado; rotas mutativas geram 1 linha em `audit_logs`; `/api/admin/health` exige header.

### F4 — Outbox Dispatcher + Scheduler Worker
**Objetivo**: fechar o pipeline assíncrono.

Arquivos a criar:
- `infra/events/outbox-dispatcher.ts` — loop que faz `SELECT … FOR UPDATE SKIP LOCKED LIMIT N`, publica no `EventBus`, marca `dispatched_at`. Backoff exponencial em falha.
- `infra/queue/scheduler-worker.ts` — substitui `noop-queue` para jobs reais. Lê de `scheduler_jobs`, despacha por `job_type` em handlers registrados.
- `infra/events/register-event-handlers.ts` — passa a registrar consumers reais (cross-module via inbox).

Lifecycle:
- `app/lifecycle.ts` ganha `startBackgroundWorkers()` chamado após `app.ready()` e parado em `onClose`.
- Em `NODE_ENV=test` os workers não iniciam (controlado por `Config.WORKERS_ENABLED`).

**Critério de aceitação**: teste de integração `outbox-dispatcher.test.ts` que emite evento via use case, espera o dispatcher rodar, valida `dispatched_at != null` e que o handler consumiu (asserção em fake event-bus subscriber).

### F5 — Módulos faltantes (DDD modular completa)
**Objetivo**: cobrir o que as migrações 003–006 prometem, mantendo isolamento de bounded context.

Novos bounded contexts (cada um com `domain/`, `application/`, `infra/`, `index.ts`, testes):

1. `modules/audit-logs/`
   - `domain`: `AuditLog` entity, `Redactor` value object, `AuditLogRepository` port.
   - `application`: `RecordAuditLogUseCase` (chamada pelo middleware F3).
   - `infra`: PG repository + rota interna `GET /api/admin/audit-logs?scope=…&since=…` (gated por admin-auth).

2. `modules/generated-tokens/`
   - Token sandbox opaco com TTL. Usos: convites de demo, links curtos.
   - Endpoints: `POST /api/generated-tokens` (admin), `GET /api/generated-tokens/:token` (público, retorna apenas `metadata_minimized`).

3. `modules/resource-reservations/`
   - Sandbox: ao criar `learning-session`, opcionalmente reserva uma cota numérica abstrata.
   - Listener para `learning-sessions.created` (via inbox) cria reserva.
   - Endpoints: `GET /api/learning-sessions/:publicCode/reservations`.

4. (Opcional, recomendado) `modules/health-aggregator/` — consolida probes de DB, Redis, outbox-lag, scheduler-lag para `/api/admin/health` em vez de o controller fazer queries diretas.

**Critério de aceitação**: `check:boundaries` zero violações; cada módulo com ≥ 1 teste use-case + ≥ 1 teste de rota; nenhum import cross-module direto (cross só por evento).

### F6 — Sandbox/Mock declarado das operações sensíveis
**Objetivo**: a regra do PROMPT MESTRE — nada de blockchain real, custódia real, mixing real, transações reais — precisa ficar **explícita na arquitetura**.

Ports (puros) em `shared/application/ports/`:
- `blockchain-gateway.port.ts` — operações de **leitura** apenas (consultar bloco, transação por hash, saldo público). Nenhum método "send".
- `transaction-dispatcher.port.ts` — `simulate(intent): SimulatedReceipt`. **Sem método `broadcast`**.
- `custody-service.port.ts` — `quoteSegregation(amount, currency): Quote`. Sem `transfer`.
- `mixing-engine.port.ts` — `explainStrategy(input): EducationalExplanation`. Sem `mix`.

Adapters em `infra/`:
- `infra/blockchain/sandbox-blockchain.gateway.ts` — retorna dados estáticos / determinísticos a partir do `publicCode`.
- `infra/blockchain/sandbox-transaction-dispatcher.ts` — gera receipt fake assinado com chave `dev-only` carregada de `.env.example`.
- `infra/custody/sandbox-custody.service.ts` — quote fixo baseado em `pricing`.
- `infra/mixing/sandbox-mixing.engine.ts` — devolve texto educacional estático (vinculado a `learning-sessions.subject`).

Cada adapter:
- declara `mode: "sandbox"` em todas as respostas;
- emite `audit-logs` com payload mínimo;
- **não abre socket externo**.

`Config` recebe flag `SANDBOX_ONLY=true` (default `true`, **imutável em produção** no preview Emergent — o `.env.example` força).

**Critério de aceitação**: teste `sandbox-only.test.ts` valida que toda chamada que tente sair do sandbox lança `AppError.forbidden({code:'SANDBOX_ONLY'})`.

### F7 — Hardening (privacidade + segurança)
**Objetivo**: privacidade por arquitetura, não como afterthought.

- `infra/logging/logger.ts`: estender `LOG_REDACT_PATHS` cobrindo `req.body.email`, `req.body.message`, `req.body.subject`, `res.headers.set-cookie`, `req.body.token`, `*.metadata_minimized`. Garantir que o redator **não** mascara o `request_id`.
- `app/register-plugins.ts`: helmet com CSP estrita (api-only, sem `unsafe-inline`); CORS lendo de `Config.CORS_ORIGINS` (já feito); rate-limit com store Redis.
- `infra/cache/redis-rate-limit.store.ts`: store distribuída para `@fastify/rate-limit`.
- Política de retenção: script `infra/db/retention.ts` que faz `DELETE FROM audit_logs WHERE created_at < now() - interval '$LOG_RETENTION_DAYS days'`. Agendado via `scheduler_jobs` (`job_type='retention.audit-logs'`).
- `Content-Security-Policy: default-src 'none'` para todas respostas JSON.

**Critério de aceitação**: snapshot test de logs verificando que email/mensagem nunca aparecem em texto claro.

### F8 — Testes E2E e cobertura
**Objetivo**: rede de segurança alta.

- Criar `tests/e2e/` com Vitest configurado para subir Postgres + Redis efêmeros (ou mock via testcontainers — a decidir; alternativa: docker-compose `test`).
- E2E happy paths:
  - `POST /api/learning-sessions` → `GET /api/learning-sessions/:publicCode`.
  - `POST /api/contact-requests` → linha em `audit_logs`.
  - `POST /api/learning-sessions` com `Idempotency-Key` repetida → mesmo body, sem duplicar linha.
  - Outbox dispatcher emite evento → handler grava reserva (F5/F4 integrados).
- Subir cobertura global para ≥ 80 % (`thresholds`); domain ≥ 90 %.

### F9 — CI / Docs / Higiene final
**Objetivo**: tudo verde, sem dívidas pendentes.

- `.github/workflows/ci.yml` — caminhos `backend/`; adicionar job `e2e` opcional (gate suave em PR; mandatório em main).
- `.github/workflows/architecture.yml` — caminhos `backend/`.
- `architecture.md` — atualização de paths e tabelas.
- `backend/README.md` — substitui o atual por documento da arquitetura final, com seção "Sandbox-only contract".
- `README.md` (raiz) — passa de uma linha para overview do monorepo.
- Diagrama mermaid do pipeline outbox/inbox/scheduler/audit.

---

## 3. Lista de arquivos que serão criados/modificados (delta total estimado)

### F1 — renomeações (git mv) — ~85 arquivos
- Tudo em `backend-node/**` → `backend/**`.

### F1 — modificados
- `/app/package.json`
- `/app/architecture.md`
- `/app/.github/workflows/ci.yml`
- `/app/.github/workflows/architecture.yml`
- `/app/docs/P0_CI_GATES.md`, `P1_FRONTEND_ARCHITECTURE.md`, `P2_FRONTEND_API_DECOUPLING.md`, `P3_BACKEND_ENDPOINTS.md`
- `/app/frontend/src/shared/api/endpoints.ts` (se necessário)
- `/app/backend/Dockerfile`, `/app/backend/docker-compose.yml`

### F2 — criados
- `/app/backend/server.py` (shim Python — apenas proxy)
- `/app/backend/requirements.txt` (fastapi, httpx, uvicorn)
- `/app/backend/scripts/start-shim.sh`

### F2 — removidos
- Arquivos Python stub original (após o shim assumir)

### F3 — criados
- `backend/src/api/http/middlewares/idempotency.middleware.ts`
- `backend/src/api/http/middlewares/audit-log.middleware.ts`
- `backend/src/api/http/middlewares/admin-auth.middleware.ts`
- `backend/src/infra/idempotency/pg-idempotency.store.ts`
- `backend/src/infra/idempotency/pg-idempotency.store.test.ts`
- `backend/src/infra/auth/api-key.admin-auth.ts`
- `backend/src/infra/auth/api-key.admin-auth.test.ts`

### F4 — criados
- `backend/src/infra/events/outbox-dispatcher.ts` + `.test.ts`
- `backend/src/infra/queue/scheduler-worker.ts` + `.test.ts`
- `backend/src/infra/events/register-event-handlers.ts` (passa a ter conteúdo)

### F5 — criados (audit-logs)
- `backend/src/modules/audit-logs/domain/audit-log.entity.ts`
- `backend/src/modules/audit-logs/domain/audit-log.repository.ts`
- `backend/src/modules/audit-logs/application/record-audit-log.use-case.ts`
- `backend/src/modules/audit-logs/application/list-audit-logs.use-case.ts`
- `backend/src/modules/audit-logs/infra/pg-audit-log.repository.ts`
- `backend/src/modules/audit-logs/infra/in-memory-audit-log.repository.ts`
- `backend/src/modules/audit-logs/infra/http/{schemas,presenter,controller,routes}.ts`
- `backend/src/modules/audit-logs/index.ts`
- `backend/src/modules/audit-logs/audit-logs.test.ts`

### F5 — criados (generated-tokens)
- Mesma estrutura, ~10 arquivos.

### F5 — criados (resource-reservations)
- Mesma estrutura, ~10 arquivos + `application/handlers/on-learning-session-created.handler.ts`.

### F6 — criados (sandbox ports/adapters)
- 4 ports em `backend/src/shared/application/ports/`
- 4 adapters em `backend/src/infra/{blockchain,custody,mixing}/`
- Testes correspondentes.

### F7 — criados/modificados
- `backend/src/infra/cache/redis-rate-limit.store.ts`
- `backend/src/infra/db/retention.ts`
- `backend/src/app/register-plugins.ts` (CSP, rate-limit Redis)
- `backend/src/infra/logging/logger.ts` (redator estendido)
- `backend/.env.example`

### F8 — criados
- `backend/tests/e2e/learning-sessions.e2e.test.ts`
- `backend/tests/e2e/contact-requests.e2e.test.ts`
- `backend/tests/e2e/idempotency.e2e.test.ts`
- `backend/tests/e2e/outbox-pipeline.e2e.test.ts`
- `backend/tests/e2e/setup.ts`
- `backend/tests/e2e/docker-compose.test.yml`

### F9 — modificados/criados
- `backend/README.md` (reescrita)
- `README.md` (raiz, expansão)
- `architecture.md` (refresh completo)
- `docs/E1_BACKEND_MIGRATION.md`, `E2_BACKEND_MIDDLEWARES.md`, ... (uma por fase ao concluir)

**Total estimado**: ~120 arquivos novos + ~95 renomeações + ~12 modificações de paths.

---

## 4. Lista de riscos

| #  | Risco                                                                 | Severidade | Mitigação                                                                                                             |
| -- | --------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| R1 | **Supervisor read-only** insiste em `uvicorn` em `/app/backend/server.py`. Se o Python sumir, todo o ingress `/api/*` cai. | **CRÍTICO**  | F2 mantém `server.py` como shim FastAPI proxy → Fastify em `127.0.0.1:8081`. Validação manual no preview imediatamente após F2. |
| R2 | `git mv` em massa pode quebrar histórico se feito de forma errada.    | Alto       | Mover arquivo-a-arquivo com `git mv`; fazer commits parciais; nunca `rm -rf` antes do `git mv`.                       |
| R3 | Frontend (`shared/api/endpoints.ts`) pode ter URLs obsoletas que quebram o E2E preview. | Médio | Listar endpoints no PR de F1 e validar com `grep` no `frontend/src/`.                                                  |
| R4 | Migrações 011 (contact_requests) ainda não aplicadas no preview DB.   | Médio      | Rodar `yarn migrate` antes de F2 marcar F1 como done.                                                                  |
| R5 | Outbox dispatcher pode entrar em loop infinito com evento envenenado. | Médio      | Tabela já tem `last_error`/`attempts` (migrações). Dispatcher implementa backoff + DLQ por `attempts ≥ N`.            |
| R6 | Workers em background podem subir em ambiente de teste e poluir.      | Médio      | `Config.WORKERS_ENABLED=false` em `NODE_ENV=test`.                                                                     |
| R7 | CORS estrito pode quebrar preview se `CORS_ORIGINS` não estiver setado para a URL do preview Emergent. | Baixo | Manter `*` em dev, lista em prod, e documentar.                                                                       |
| R8 | Cobertura ≥ 80 % é meta agressiva; pode atrasar.                       | Baixo      | Manter gate atual de 60 % em todas as fases; subir gate apenas em F8.                                                  |
| R9 | Postgres/Redis efêmeros no E2E exigem Docker-in-Docker no CI Emergent. | Médio      | Alternativa: testcontainers ou MSW; se inviável, marcar E2E como "manual local + CI externo".                          |
| R10 | Confusão entre o stub Python e o backend real pode levar dev a editar o lugar errado durante a fase de transição. | Baixo | Após F2, manter apenas `server.py` (shim) com cabeçalho gigante: "PROXY ONLY — DO NOT ADD BUSINESS LOGIC HERE".       |

---

## 5. Lista do que **permanecerá explicitamente em sandbox/mock**

> Estes itens **nunca** terão implementação real neste repositório.
> Cada um terá adapter `sandbox-*` e teste de barreira `forbidden-out-of-sandbox.test.ts` que falha o build se um adapter "real" for adicionado sem flag explícita.

| Domínio                    | Port (interface pura)            | Adapter ativo                                | Comportamento                                                |
| -------------------------- | -------------------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| **Blockchain (leitura)**   | `BlockchainGateway`              | `sandbox-blockchain.gateway.ts`              | Retorna dados determinísticos derivados do `publicCode`. Sem rede externa. |
| **Despacho de transação** | `TransactionDispatcher.simulate` | `sandbox-transaction-dispatcher.ts`          | Devolve `SimulatedReceipt` com `mode:"sandbox"`. **Sem método `broadcast`.** |
| **Custódia**               | `CustodyService.quoteSegregation`| `sandbox-custody.service.ts`                 | Quote estática a partir de `pricing`. **Sem `transfer/lock/release`.** |
| **Mixing engine**          | `MixingEngine.explainStrategy`   | `sandbox-mixing.engine.ts`                   | Texto educacional estático. **Sem `mix/route/split/merge`.** |
| **Endereços de rede**      | (config)                         | `Config.SANDBOX_ONLY=true`                   | Builds rejeitam any RPC URL externa não marcada `https://localhost*`. |
| **Chaves privadas**        | n/a                              | n/a                                          | **Proibido o módulo Node `crypto.createSign` com chaves persistidas**; lint rule custom em `tools/check-no-private-keys.ts`. |
| **Custódia em arquivo / KMS / HSM** | n/a                       | n/a                                          | Não existirá adapter. Tentativa de implementar dispara violação de fronteira. |
| **Mempool / pool de mixing** | n/a                            | n/a                                          | Não existirá tabela nem endpoint. Estritamente fora de escopo. |

Garantias arquiteturais que sustentam o sandbox:
- ✅ `check-boundaries` impede `infra/blockchain` (adapter) de ser importado por `domain/`.
- ✅ Cada adapter sandbox loga com `mode: "sandbox"` em `audit_logs`.
- ✅ `Config.SANDBOX_ONLY` é `z.literal(true)` em produção (impossível flipar via env).
- ✅ Teste `tests/sandbox-contract.test.ts` enumera todos os adapters em `infra/{blockchain,custody,mixing}/` e falha se algum nome não começar com `sandbox-`.

---

## 6. Checklist objetivo de aderência ao PROMPT MESTRE

| # | Requisito do PROMPT MESTRE                                  | Hoje | Após o plano |
| - | ----------------------------------------------------------- | ---- | ------------ |
| 1 | Backend em `backend/`                                       | ❌   | ✅ (F1)      |
| 2 | TypeScript estrito                                          | ✅   | ✅           |
| 3 | Fastify                                                     | ✅   | ✅           |
| 4 | Zod em todo request                                         | ✅   | ✅           |
| 5 | PostgreSQL via `pg`                                         | ✅   | ✅           |
| 6 | Redis via `ioredis`                                         | ✅   | ✅           |
| 7 | Pino com redação                                            | ✅   | ✅ ampliada (F7) |
| 8 | Vitest + cobertura                                          | ✅ 78,69 % | ✅ ≥ 80 % (F8) |
| 9 | Docker Compose                                              | ✅   | ✅           |
| 10| Clean Architecture                                          | ✅   | ✅           |
| 11| DDD modular                                                 | ✅ 3 módulos | ✅ 6+ módulos (F5) |
| 12| Boundary checker em CI                                      | ✅   | ✅           |
| 13| Outbox transacional                                         | ✅   | ✅           |
| 14| Outbox dispatcher                                           | ❌   | ✅ (F4)      |
| 15| Inbox + idempotência de consumo                             | parcial | ✅ (F4)   |
| 16| Idempotency-Key middleware                                  | ❌   | ✅ (F3)      |
| 17| Audit logs + middleware                                     | ❌   | ✅ (F3+F5)   |
| 18| Admin auth                                                  | ❌   | ✅ (F3)      |
| 19| Rate-limit distribuído                                      | parcial | ✅ (F7)   |
| 20| Privacidade por arquitetura (redação, retenção)             | parcial | ✅ (F7)   |
| 21| Sem blockchain real                                         | n/a (não existe) | ✅ ports + sandbox-only (F6) |
| 22| Sem transações reais                                        | n/a  | ✅ (F6)      |
| 23| Sem custódia real                                           | n/a  | ✅ (F6)      |
| 24| Sem mixing operacional real                                 | n/a  | ✅ (F6)      |
| 25| Código compilável, exports/imports/factory/bootstrap coerentes | ✅ | ✅           |
| 26| Sem NestJS                                                  | ✅   | ✅           |
| 27| Sem microservices                                           | ✅   | ✅           |
| 28| Não é só README                                             | ✅   | ✅           |
| 29| Não é só pastas vazias                                      | ✅   | ✅           |
| 30| Backend não dentro do front-end                             | ✅   | ✅           |

---

## 7. O que **não** será feito nesta etapa

Conforme o pedido:
- ✋ Não há mudança de código nesta etapa.
- ✋ Não há `git mv`, não há criação de novos módulos.
- ✋ Não há ajuste em `package.json` raiz, em CI, ou em `architecture.md`.
- ✋ Não há decisão arbitrária sobre nomes de módulos: a tabela acima é a proposta a aprovar.

---

## 8. Próximos passos imediatos (precisam de confirmação)

1. **Aprovar este plano** (sim/ajustes).
2. Confirmar a estratégia de **F2 (shim Python)** — alternativa seria pedir ao time Emergent para tornar o supervisor não-readonly, mas não é viável dentro desta pipeline.
3. Confirmar nomes dos novos módulos da F5 (`audit-logs`, `generated-tokens`, `resource-reservations`).
4. Após aprovação, iniciamos por **F1 (migração)** + **F2 (shim)** num único PR conceitual, porque um sem o outro deixa o preview quebrado.
