# `address-generator` module

**Status:** SANDBOX / MOCK ONLY.

## Responsibility

Issues, stores, revokes and expires **mock address tokens** used as
destination labels in the sandbox mixing preview UI.

## Sandbox classification

- **Sandbox:** yes.
- **Mock-only:** yes.
- **Touches real blockchain:** **no**.
- **Generates wallets:** **no**.
- **Derives keys / seeds:** **no**.
- **Produces spendable addresses:** **no**.

## What it does

- Produces opaque, URL-safe tokens of the form `sbx_<random>`.
- Stores each token with a namespace, an optional correlation id, and an
  expiration.
- Supports revoke / expire transitions.

## What it explicitly does NOT do

- Does NOT derive cryptocurrency addresses.
- Does NOT manage private keys, seed phrases, or wallet descriptors.
- Does NOT interact with Bitcoin, Ethereum or any blockchain client.
- Does NOT sign, build, or broadcast transactions.
- Does NOT promise anonymity.
- Does NOT represent custody.

## Inputs / Outputs

- Input: namespace, optional correlationId, optional TTL.
- Output: `{ id, token, namespace, status, expiresAt, disclaimer }`.

## Events

- Publishes: `address-generator.address-generated`, `address-generator.address-expired`.
- Consumes: none.

## Dependencies

- `shared/domain/*` (pure building blocks).
- `shared/application/ports/uuid.port` (as type).
- `node:crypto` (infra layer only, for random bytes).

## Risks & limitations

- Tokens are not cryptographically bound to any identity; they are plain
  opaque ids used in a sandbox.
- The in-memory repository is for preview only; a persistent adapter is
  required for production — but production is out of scope for this
  educational codebase.

## Production gaps

- No persistence adapter other than in-memory.
- No rate-limiting of token issuance.
- No authentication around issuance (the /api admin routes own that).
