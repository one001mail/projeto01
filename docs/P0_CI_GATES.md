# P0 — Baseline & CI Gates — Report

This document captures the results of the **P0 baseline gates** that
every subsequent phase must pass.

## 1. CI configuration

GitHub Actions workflow lives at `.github/workflows/ci.yml`.
It triggers on every push and PR to `main` / `master` and runs four
hard gates as separate jobs (failure of any single job fails the run):

| Job         | Command                                               | Hard gate                                 |
| ----------- | ----------------------------------------------------- | ----------------------------------------- |
| `typecheck` | `yarn typecheck` (frontend + backend-node)            | TS strict mode — zero `tsc` errors        |
| `lint`      | `yarn lint` (ESLint + Biome)                          | Zero lint errors                          |
| `test`      | `yarn test:coverage` (Vitest with `--coverage`)       | Tests pass & coverage threshold ≥ 60%     |
| `build`     | `yarn build` (Vite + tsc) — gated on previous 3 jobs  | Production bundle builds cleanly          |

The previous `architecture.yml` workflow (clean-architecture boundary
checks) is preserved and continues to run independently.

## 2. Scripts

Top-level (`/app/package.json`) — orchestrates both workspaces:

```jsonc
"scripts": {
  "typecheck": "yarn typecheck:frontend && yarn typecheck:backend",
  "lint":      "yarn lint:frontend      && yarn lint:backend",
  "test":      "yarn test:frontend      && yarn test:backend",
  "test:coverage": "yarn test:coverage:frontend && yarn test:coverage:backend",
  "build":     "yarn build:frontend     && yarn build:backend",
  "ci":        "yarn typecheck && yarn lint && yarn test:coverage && yarn build"
}
```

Frontend (`frontend/package.json`):

- `yarn typecheck` → `tsc -b --noEmit`
- `yarn lint`      → `eslint .`
- `yarn test`      → `vitest run`
- `yarn test:coverage` → `vitest run --coverage`
- `yarn build`     → `vite build`

Backend-node (`backend-node/package.json`):

- `yarn typecheck` → `tsc --noEmit`
- `yarn lint`      → `biome check src`
- `yarn test`      → `vitest run`
- `yarn test:coverage` → `vitest run --coverage`
- `yarn build`     → `tsc -p tsconfig.build.json`

## 3. TypeScript strict mode

### Frontend (`frontend/tsconfig.json` and `tsconfig.app.json`)

`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`. Was
previously `false` across the board.

### Backend-node (`backend-node/tsconfig.json`)

Already strict (`strict`, `noImplicitAny`, `noImplicitOverride`,
`noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `useUnknownInCatchVariables`).

Both projects compile with **zero** errors:

```
$ yarn typecheck
$ yarn typecheck:frontend && yarn typecheck:backend
$ cd frontend && yarn typecheck
$ tsc -b --noEmit
$ cd backend-node && yarn typecheck
$ tsc --noEmit
Done in 13.92s.
exit=0
```

## 4. Coverage report (`vitest --coverage`)

Threshold (`>= 60%` per `vitest.config.ts`) is enforced at runtime —
`vitest run --coverage` exits non-zero if any of `lines`, `statements`,
`functions`, `branches` drop below 60%.

### Frontend (domain layer)

| Metric     | %        |
| ---------- | -------- |
| Lines      | **92.34** |
| Statements | **92.34** |
| Functions  | **81.81** |
| Branches   | **86.36** |

8 test files / 33 tests, all passing. New tests added for
`createSessionId`, `validateAddress`, `pricingRules.getFeeTableRows`,
`contactSchema`. HTML, lcov, json-summary reports under
`frontend/coverage/`.

### Backend-node (full src)

| Metric     | %        |
| ---------- | -------- |
| Lines      | **63.43** |
| Statements | **63.43** |
| Functions  | **78.72** |
| Branches   | **77.39** |

7 test files / 25 tests, all passing. HTML, lcov, json-summary reports
under `backend-node/coverage/`.

## 5. Lint

Both linters report **zero errors**:

- ESLint (frontend): 0 errors, 7 warnings (all pre-existing
  `react-refresh/only-export-components` informational notices on
  shadcn/ui primitives — these are warnings only).
- Biome (backend-node): 0 errors, 1 warning (a single `console.error`
  in the pg-pool fallback path; intentionally kept and pre-existing).

CI fails on errors only; warnings do not break the build.

## 6. Build

```
$ yarn build
$ yarn build:frontend && yarn build:backend
$ cd frontend && yarn build
$ vite build
✓ 1817 modules transformed.
dist/index.html                   1.69 kB │ gzip:   0.67 kB
dist/assets/index-*.css          62.88 kB │ gzip:  11.13 kB
dist/assets/index-*.js          708.42 kB │ gzip: 207.78 kB
✓ built in 6.48s
$ cd backend-node && yarn build
$ tsc -p tsconfig.build.json && node -e "...migrations copy..."
Done in 11.13s.
exit=0
```

## 7. Green pipeline proof — local `yarn ci` run

```
$ yarn ci
$ yarn typecheck && yarn lint && yarn test:coverage && yarn build
…
All files (frontend)     |   92.34 |    86.36 |   81.81 |   92.34 |
All files (backend-node) |   63.43 |    77.39 |   78.72 |   63.43 |
…
Done in 44.32s.
exit=0
```

## 8. Checkpoint summary

- [x] CI configured (`.github/workflows/ci.yml`)
- [x] `yarn typecheck`, `yarn lint`, `yarn test`, `yarn build` scripts
      (and `yarn test:coverage`, `yarn ci`)
- [x] TS strict mode enforced — frontend + backend-node
- [x] Coverage report generated (`vitest --coverage`) — both packages
- [x] coverage ≥ 60% in every dimension on both packages (initial)
- [x] no TS errors
- [x] no lint errors

The repo is now ready for subsequent phases: any new code that breaks
typecheck, lint, tests, coverage, or build will fail CI.
