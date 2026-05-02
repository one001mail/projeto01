# `liquidity-pool` module

**Status:** SANDBOX / MOCK resource allocation.

## Responsibility

Models **mock**, unitless, integer "slots" in a simulated allocation
pool. Demonstrates reserve / release semantics with strict invariants
(you cannot reserve more than available; you cannot release more than
reserved).

## Sandbox classification

- **Sandbox:** yes.
- **Mock-only:** yes.
- **Real liquidity:** **no**.
- **Wallet balance:** **no**.
- **Spendable asset accounting:** **no**.

## Events

- Publishes: `liquidity-pool.liquidity-reserved`,
  `liquidity-pool.liquidity-released`.

## Risks & limitations

- Not a general-purpose resource manager. It exists to back the mix
  session preview; production systems should use a proper inventory
  service.
