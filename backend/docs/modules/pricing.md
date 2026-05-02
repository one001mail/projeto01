# `pricing` module

## Purpose

Serves the public fee/pricing schedule used by the front-end "how it works" and
"fees" pages. Read-only; no mutations.

## HTTP surface

| Method | Path             | Description                              |
| ------ | ---------------- | ---------------------------------------- |
| GET    | `/api/pricing`   | Returns the current pricing tiers        |

## Domain events emitted

*(none — read-only)*

## Domain events consumed

*(none)*

## Persistence

Deterministic in-process source today. Future: backed by a config table or a
cached read-model that another module updates via events.

## Open issues / TODO

- Move source data into a config repository.
- Add cache-control headers (already public + immutable per deploy).
