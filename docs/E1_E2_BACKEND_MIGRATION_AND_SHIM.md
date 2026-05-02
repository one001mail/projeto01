# Etapas F1 + F2 — Migração `backend-node` → `backend` + Shim Python

> Saída do bloco F1+F2 do PROMPT MESTRE.
> Ambas executadas no mesmo passo porque uma sem a outra derruba o preview.

## 1. Arquivos criados

| Caminho                                         | Propósito                                                  |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `backend/server.py`                             | Shim FastAPI: reverse-proxy puro para Fastify em `127.0.0.1:8081`. Sem business logic. |
| `backend/requirements.txt`                      | Dependências do shim apenas (`fastapi`, `uvicorn[standard]`, `httpx`). |
| `backend/scripts/start-shim.sh`                 | Helper opcional para rodar o shim fora do supervisord.     |
| `docs/E1_E2_BACKEND_MIGRATION_AND_SHIM.md`      | Este documento.                                            |

## 2. Arquivos movidos (git mv)

112 arquivos rastreados pelo git foram movidos de `backend-node/**` para
`backend/**`, preservando histórico:

```
backend-node/.gitignore                                   → backend/.gitignore
backend-node/Dockerfile                                   → backend/Dockerfile
backend-node/README.md                                    → backend/README.md
backend-node/biome.json                                   → backend/biome.json
backend-node/docker-compose.yml                           → backend/docker-compose.yml
backend-node/package.json                                 → backend/package.json
backend-node/src/api/http/controllers/...                 → backend/src/api/http/controllers/...
backend-node/src/api/http/routes/...                      → backend/src/api/http/routes/...
backend-node/src/app/...                                  → backend/src/app/...
backend-node/src/infra/...                                → backend/src/infra/...
backend-node/src/modules/_template/...                    → backend/src/modules/_template/...
backend-node/src/modules/contact-requests/...             → backend/src/modules/contact-requests/...
backend-node/src/modules/learning-sessions/...            → backend/src/modules/learning-sessions/...
backend-node/src/modules/pricing/...                      → backend/src/modules/pricing/...
backend-node/src/shared/...                               → backend/src/shared/...
backend-node/tools/check-boundaries.ts                    → backend/tools/check-boundaries.ts
backend-node/tools/check-boundaries.test.ts               → backend/tools/check-boundaries.test.ts
backend-node/tsconfig.{json,build.json}                   → backend/tsconfig.*
backend-node/vitest.config.ts                             → backend/vitest.config.ts
```

## 3. Arquivos modificados

| Caminho                                           | Mudança                                                      |
| ------------------------------------------------- | ------------------------------------------------------------ |
| `package.json` (raiz)                             | Todos os scripts `backend-node` → `backend`. Adicionado `check:boundaries` e `check:arch` na raiz. |
| `.github/workflows/ci.yml`                        | `working-directory: backend-node` → `backend`; nomes de jobs/artefatos. |
| `.github/workflows/architecture.yml`              | `paths: backend-node/**` → `backend/**`; cache npm → yarn.   |
| `architecture.md`                                 | Todas as referências `backend-node` → `backend`.             |
| `backend/src/app/config.ts`                       | `PORT` default `8080` → `8081` (libera 8080 e mantém 8001 para o shim). |
| `backend/Dockerfile`                              | `EXPOSE 8080` → `EXPOSE 8081` (dev e prod).                  |
| `backend/docker-compose.yml`                      | `PORT: 8080` → `8081`, `'8080:8080'` → `'8081:8081'`.        |
| `backend/package.json`                            | Novo script `dev:no-watch` (usado pelo shim quando `dist/` não existe). |
| `backend/README.md`                               | URL local `:8080` → `:8081`.                                 |
| `backend/src/modules/_template/README.md`         | Referências `backend-node` → `backend`.                      |
| `docs/P0_CI_GATES.md`                             | Referências `backend-node` → `backend`.                      |
| `test_result.md`                                  | Adicionada entrada de comunicação F1+F2 no histórico.        |

## 4. Arquivos removidos

| Caminho                       | Motivo                                                      |
| ----------------------------- | ----------------------------------------------------------- |
| `backend/server.py` (Python stub original, 76 linhas)   | Substituído pelo shim FastAPI proxy.        |
| `backend/requirements.txt` (Mongo motor + FastAPI antigos) | Substituído por dependências do shim. |
| `backend-node/` (diretório inteiro)                       | Conteúdo migrado para `backend/`.   |

## 5. Comandos executados

```bash
# F1 — migração
git rm backend/server.py backend/requirements.txt
for f in $(git ls-files backend-node/); do
  target="backend/${f#backend-node/}"
  mkdir -p "$(dirname "$target")"
  git mv "$f" "$target"
done
find backend-node -type d -empty -delete

# F2 — shim + envs
# (criação de arquivos via bulk_file_writer; substituições via search_replace)
sed -i 's|backend-node/|backend/|g; s|backend-node|backend|g' \
  architecture.md backend/src/modules/_template/README.md docs/P0_CI_GATES.md
sed -i 's|8080|8081|g' backend/README.md

# Validação ponta-a-ponta
sudo supervisorctl restart backend
curl http://127.0.0.1:8001/health-shim          # 200
curl http://127.0.0.1:8001/health               # 200 (proxy → Fastify)
curl http://127.0.0.1:8001/api/admin/health     # 503 degraded (sem PG/Redis)
curl http://127.0.0.1:8001/api/pricing          # 200 (payload completo)
curl https://<preview>/api/pricing              # 200 via ingress externo
```

## 6. Resultado dos gates

| Gate                                      | Resultado                       |
| ----------------------------------------- | ------------------------------- |
| `cd backend && yarn typecheck`            | ✅ 0 erros                      |
| `cd backend && yarn lint` (Biome)         | ✅ 89 arquivos, 0 erros         |
| `cd backend && yarn check:boundaries`     | ✅ 78 arquivos, 0 violações     |
| `cd backend && yarn test`                 | ✅ 12 suítes, **48/48** passando |
| `yarn typecheck` (raiz)                   | ✅ frontend + backend           |
| `yarn lint` (raiz)                        | ✅ 0 erros (7 warnings shadcn pré-existentes) |
| `yarn test:coverage` (raiz)               | ✅ frontend 92,34% / backend 78,69% — ambos ≥ 60% |
| `yarn build` (raiz)                       | ✅ frontend Vite + backend tsc  |
| `sudo supervisorctl status backend`       | ✅ RUNNING                      |
| Preview ingress `/api/pricing`            | ✅ HTTP 200 com payload válido  |

## 7. Pipeline final em produção (Emergent)

```
[ Cliente HTTPS ]
        │
        ▼
[ Kubernetes ingress ] ─── /api/* ─→ container:8001
        │
        ▼
[ supervisord ]
   command: uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   directory: /app/backend
        │  spawn (lifespan)
        ▼
[ Python FastAPI shim — server.py ]
   - lifespan startup: spawn `node dist/index.js` ou `tsx src/index.ts`
   - waits for /health on 127.0.0.1:8081
   - reverse-proxy: streams req/res, preserves headers (minus hop-by-hop)
        │
        ▼
[ Node 20 + Fastify 4 ]
   listening on 127.0.0.1:8081
   Clean Architecture / DDD
   módulos: _template, learning-sessions, contact-requests, pricing
   ports: Clock, UUID, Logger, EventBus, Queue, IdempotencyStore, TM
```

## 8. Riscos restantes

| #  | Risco                                                                | Severidade | Notas                                                              |
| -- | -------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------ |
| R1 | Postgres / Redis ausentes no preview Emergent → endpoints com escrita falham (admin-health já reporta `degraded`). | Médio | Será resolvido em F3/F4 quando exigirmos um path para integração; por enquanto aceitável (apenas ler `/api/pricing` funciona). |
| R2 | uvicorn `--reload` reinicia toda vez que server.py muda; o subprocess Fastify é morto junto e re-spawnado (~3s). | Baixo | Aceitável em dev. Em produção real fora do supervisor, usar `node dist/index.js` direto. |
| R3 | Frontend `shared/api/endpoints.ts` ainda referencia rotas legadas `/api/mix-sessions`. | Médio | Será corrigido em fase posterior (P4 identificada no diagnóstico). Não bloqueia F3. |
| R4 | Migração `011_contact_requests.sql` pendente no DB do preview (sem PG nada disso importa). | Baixo | Será aplicada em F4 com worker `migrate`. |
| R5 | Workers de outbox/scheduler ainda inexistentes — `WORKERS_ENABLED` não tem efeito. | Baixo | Endereçado em F4. |

## 9. O que continua **sandbox/mock** (cláusula obrigatória)

Nenhum endpoint sensível foi implementado nesta fase. Continuam em
sandbox/mock por design (a serem expressos como ports + adapters
`sandbox-*` na **F6**):

- ❌ Nenhum gateway de blockchain — não existirá adapter de leitura externa.
- ❌ Nenhum dispatcher de transação — adapter terá apenas `simulate`.
- ❌ Nenhuma custódia real — adapter terá apenas `quoteSegregation`.
- ❌ Nenhuma engine de mixing operacional — adapter retornará texto educacional.
- ❌ Nenhuma chave privada persistida — proibido por contrato.
- ❌ Nenhuma rota nova exposta nesta fase — superfície permanece a do P3:
  `POST /api/learning-sessions`, `GET /api/learning-sessions/:publicCode`,
  `POST /api/contact-requests`, `GET /api/pricing`, `GET /api/admin/health`.

## 10. Próximo passo técnico (F3)

Implementar middlewares HTTP cross-cutting em `backend/src/api/http/middlewares/`:

1. `idempotency.middleware.ts` (`Idempotency-Key`) consumindo o port
   `IdempotencyStore` + adapter PG `infra/idempotency/pg-idempotency.store.ts`.
2. `audit-log.middleware.ts` gravando `audit_logs.redacted_payload`
   para verbos mutativos (será ligado ao módulo `audit-logs` em F5).
3. `admin-auth.middleware.ts` exigindo `x-admin-api-key` em
   `/api/admin/*` (rejeita 503 quando `Config.ADMIN_API_KEY` ausente —
   "modo aberto" silencioso é proibido).

Critério de aceitação F3: testes vitest demonstrando idempotência por
chave, geração de 1 linha em `audit_logs` por mutação, e bloqueio de
admin sem header.
