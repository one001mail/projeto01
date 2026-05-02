# `_template` module

## Purpose

Reference skeleton showing the canonical Clean-Architecture layout for a new
bounded context. **Not registered as a real domain** — it serves as a
copy-paste starting point.

## Layout

```
modules/_template/
├─ index.ts                # plugin: registers routes + handlers
├─ domain/                 # entities, value objects, invariants — pure TS
├─ application/            # use cases, ports the module needs from infra
├─ infra/                  # adapters: repositories, mappers, query helpers
└─ template.test.ts        # smoke test exercising the wiring
```

## HTTP surface

*(none — the template registers a single sample route)*

## Domain events

*(none)*

## When to copy from this module

- You are starting a new bounded context.
- You want a template that already passes `check:boundaries`.

## TODO

- Keep this module aligned with the latest layering rules.
