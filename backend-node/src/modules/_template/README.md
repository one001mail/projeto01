# Bounded-Context Module Rules

Every directory under `src/modules/` (other than this `_template`) is a
**bounded context**. Modules are the unit of cohesion: they own their
domain language, persistence, and HTTP surface end-to-end.

## Layout

```
modules/<name>/
├─ domain/        — entities, value objects, domain services, repository PORTS
├─ application/   — use cases / orchestrators (depend on domain only)
├─ infra/         — driven adapters: repository implementations, clients
└─ index.ts       — public composition: `registerModule(app)` plugin
```

## Dependency rules (enforced by `tools/check-boundaries.ts`)

1. `domain/` imports nothing from `application/` or `infra/`. It is pure.
2. `application/` imports `domain/` and the **ports** it defines. It never
   imports `infra/` directly.
3. `infra/` imports `domain/` and `application/` ports. It never imports
   another module's `domain/` or `application/`.
4. **Cross-module communication goes through the event bus** (or outbox in
   B3). One module does not import another module's internals.
5. `index.ts` is the only externally-importable entry. It wires concrete
   adapters to ports, registers HTTP routes, subscribes to events.

All five rules are verified on every push by
`backend-node/tools/check-boundaries.ts`
(`npm run check:boundaries`). See the top-level `architecture.md` for
the full matrix.

## Adding a new module

1. `cp -r src/modules/_template src/modules/<name>` and rename symbols.
2. Add `<name>` to the registry in `src/app/register-modules.ts`.
3. Replace example entity / use case / repository with your real ones.
4. Add a route under `<name>/infra/http/` if the module exposes one.
