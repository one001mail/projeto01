#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  P0 — BASELINE & CI GATES
  Establish hard gates so every next phase is verifiable.
  Implement: GitHub Actions CI (typecheck, lint, test, build), yarn scripts,
  TS strict mode, vitest coverage with >= 60% threshold.

backend:
  - task: "backend-node TS strict mode + vitest coverage"
    implemented: true
    working: true
    file: "backend-node/tsconfig.json, backend-node/vitest.config.ts, backend-node/package.json"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          backend-node already strict; added test:coverage script,
          coverage thresholds (60% all dims), @vitest/coverage-v8 dep.
          Fixed 4 biome lint errors (non-null assertions, template literal).
          Removed 'tests' arg from biome lint (folder doesn't exist).
          Local result: tests 25/25 pass, coverage L=63.43% F=78.72%
          B=77.39% S=63.43%, all gates pass.

frontend:
  - task: "frontend TS strict mode + typecheck script"
    implemented: true
    working: true
    file: "frontend/tsconfig.json, frontend/tsconfig.app.json, frontend/package.json"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Enabled strict, noImplicitAny, strictNullChecks in both root and
          app tsconfig (was false). Added `yarn typecheck` script (tsc -b
          --noEmit). Zero TS errors after enabling strict.
  - task: "frontend ESLint cleanliness"
    implemented: true
    working: true
    file: "frontend/eslint.config.js, multiple src files"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Fixed 8 ESLint errors: empty interfaces -> type aliases
          (command.tsx, textarea.tsx); err: any -> err: unknown with
          instanceof Error guards (useMixingForm, useSessionLookup,
          NewSession); require -> import (tailwind.config.ts);
          unused _props (calendar.tsx); ignore supabase/** Deno files.
          Lint passes with 0 errors (7 informational warnings remain).
  - task: "frontend vitest coverage"
    implemented: true
    working: true
    file: "frontend/vitest.config.ts, frontend/src/test/*.test.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Added @vitest/coverage-v8@3.2.4. Coverage scoped to domain layer
          with 60% thresholds. Added 4 new test files (createSessionId,
          validateAddress, pricingRules, contactSchema) bringing total
          tests from 15 to 33, coverage to L=92.34% F=81.81% B=86.36%
          S=92.34%.

  - task: "Root workspace scripts"
    implemented: true
    working: true
    file: "package.json"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Created /app/package.json with typecheck/lint/test/test:coverage/
          build/ci scripts that fan out to both workspaces. `yarn ci`
          runs the full P0 gate set in 44s locally with exit 0.
  - task: "GitHub Actions CI workflow"
    implemented: true
    working: "NA"
    file: ".github/workflows/ci.yml"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: |
          New ci.yml runs 4 parallel jobs (typecheck, lint, test, build)
          with build gated on the previous three. Coverage artifacts
          uploaded. Cannot run on GitHub from this sandbox — all gates
          verified locally via `yarn ci`.

  - task: "P1 frontend feature architecture refactor"
    implemented: true
    working: true
    file: "frontend/src/features/**, frontend/src/shared/layout/**, frontend/src/shared/ui/GlobalDisclaimerBanner.tsx, frontend/src/App.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Refactored /app/frontend/src into feature-based architecture.
          Each of home/how-it-works/mixing/fees/faq/contact (+ session)
          now exposes components/, hooks/, services/, content/ + index.ts
          barrel. Pages are thin composition — all business logic lives
          in feature hooks/services. Global disclaimer banner added at
          top of Layout, visible on every page. Removed misleading copy
          from footer ("privacy-focused mixing service" → "demonstração
          educacional"). Accessibility pass: skip link, aria-labels on
          nav/buttons, aria-current on active link, aria-invalid/
          aria-describedby on form fields, aria-live on result regions,
          semantic ol/ul/dl/fieldset/legend, role=alert/status, aria-
          hidden on decorative icons. Verified: typecheck=0, lint=0
          errors (7 pre-existing shadcn warnings), all 33 vitest tests
          pass, `yarn build` succeeds. Home + Mixing pages render
          correctly, global banner visible, inline validation still
          triggers "Insira um valor válido." on empty submit.


  - task: "P2 frontend API decoupling (shared/api + Supabase removal)"
    implemented: true
    working: true
    file: "frontend/src/shared/api/**, frontend/src/features/*/services/*.ts, frontend/package.json"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Created src/shared/api/ with httpClient (fetch wrapper: JSON,
          timeout via AbortController, exponential backoff retries on
          5xx/network/timeout for idempotent methods only, query param
          handling), ApiError (unified kind+status+code+details), and
          endpoints (centralized /api/* path map). Rewrote mixingApi,
          sessionsApi, contactApi to go through httpClient. Deleted
          src/integrations/supabase/{client,types}.ts and removed
          @supabase/supabase-js from package.json; yarn.lock regenerated.
          grep for supabase/@supabase in src returns zero matches. All
          gates green: typecheck 0 errors, lint 0 errors (7 pre-existing
          shadcn warnings), 41/41 vitest tests (8 new httpClient tests),
          domain coverage 92.34% lines (gate >=60%), yarn build ok.
          Full report at /app/docs/P2_FRONTEND_API_DECOUPLING.md.

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      P0 baseline gates set up. All four hard gates verified locally:
      typecheck (zero errors, strict mode on), lint (zero errors),
      test:coverage (33 frontend + 25 backend tests passing, both
      coverage totals above the 60% threshold), build (frontend Vite
      bundle + backend tsc dist).
      Full report at /app/docs/P0_CI_GATES.md.
      No backend testing agent run needed — pure tooling/CI change.
  - agent: "main"
    message: |
      P1 frontend feature architecture refactor complete. See
      /app/docs/P1_FRONTEND_ARCHITECTURE.md for the new tree, full
      moved-file list, and UX improvements. No backend changes; all
      local gates remain green (typecheck, lint, 33/33 tests, build).
  - agent: "main"
    message: |
      P3 backend endpoints delivered on Node/Fastify. Three new modules
      under Clean-Architecture boundaries (learning-sessions,
      contact-requests, pricing) + system admin-health route. All 5
      target endpoints live:
        POST /api/learning-sessions
        GET  /api/learning-sessions/:publicCode
        POST /api/contact-requests
        GET  /api/pricing
        GET  /api/admin/health
      Write paths use TransactionManager + OutboxStore (single tx:
      aggregate + event). Zod on every request. Gates: typecheck 0,
      lint 0, boundary check 0 violations, 48/48 tests, coverage 78.69%,
      build ok. Full report /app/docs/P3_BACKEND_ENDPOINTS.md.

      HEADS UP (P4 needed): P2 frontend endpoints.ts still points to
      /api/mix-sessions and /api/sessions, which no longer match the
      backend (now /api/learning-sessions). A small frontend patch is
      required before end-to-end flows work in the browser.
      Migration 011_contact_requests.sql needs to be applied with
      `yarn migrate` against the target DB.
  - agent: "main"
    message: |
      ETAPA F1+F2 concluida (PROMPT MESTRE).
      F1 - Migracao estrutural: 112 arquivos movidos via `git mv` de
      `backend-node/` para `backend/`. Diretorio `backend-node/`
      removido. Stub Python original (server.py + requirements.txt)
      removido. Todas as referencias a `backend-node` em
      package.json (raiz), .github/workflows/ci.yml, architecture.yml,
      architecture.md, docs/P0_CI_GATES.md e backend/src/modules/_template
      atualizadas para `backend/`.
      F2 - Shim Python/FastAPI: criado `/app/backend/server.py` como
      reverse-proxy puro (sem business logic) para Fastify em
      127.0.0.1:8081, mantendo o supervisord read-only feliz.
      Adicionados `requirements.txt` (fastapi/uvicorn/httpx) e
      `scripts/start-shim.sh`. Backend Fastify: HOST default 0.0.0.0,
      PORT default 8081 (era 8080); Dockerfile/docker-compose
      atualizados; novo script `dev:no-watch` no package.json.
      Validacao: `sudo supervisorctl restart backend` -> RUNNING.
      Curl externo (preview Emergent) em /api/pricing -> 200 OK.
      `/api/admin/health` -> 503 (degraded por ausencia de PG/Redis,
      esperado). Health-shim probe -> 200 com upstream:ok.
      Gates raiz: yarn typecheck 0, yarn lint 0 errors,
      yarn test:coverage 48/48 tests passa, yarn build ok.
      Sandbox-only: nenhum endpoint sensivel implementado. Proxima
      fase: F3 (idempotency + audit-log + admin-auth middlewares).
