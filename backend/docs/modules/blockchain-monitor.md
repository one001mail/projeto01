# `blockchain-monitor` module

**Status:** SANDBOX / MOCK ONLY. **NO REAL BLOCKCHAIN ACCESS.**

## Responsibility

Simulates registering, polling and confirming transactions in a fake,
in-memory "chain". No real blockchain, no RPC, no mempool, no explorer.

## Sandbox classification

- **Sandbox:** yes.
- **Mock-only:** yes.
- **Touches real blockchain:** **no**.
- **Accepts real `txid`:** **no** — the module requires the sandbox prefix
  `mocktx_` and rejects anything else.

## What it does

- Registers a **mock** transaction watch.
- Accepts observations from an in-memory `MockBlockchainReaderProvider`.
- Counts confirmations and emits `deposit-detected` / `deposit-confirmed`
  events when a threshold is reached.

## What it explicitly does NOT do

- Does NOT call `mempool.space`, `blockstream.info`, Electrum, Infura,
  Alchemy, QuickNode, Bitcoin Core or any RPC node.
- Does NOT read block headers.
- Does NOT watch real addresses.
- Does NOT observe any real deposit.

## Inputs / Outputs

- Input: `registerTransactionWatch({ id, mockTxid })`.
- Output: `{ id, mockTxid }`, later `{ status, confirmations }`.

## Events

- Publishes: `blockchain-monitor.deposit-detected`,
  `blockchain-monitor.deposit-confirmed`.
- Consumes: none.

## Dependencies

- Only the shared domain building blocks and `node:crypto` (for fingerprints, if
  used in the provider).

## Risks & limitations

- Any regression that allows a non-`mocktx_` prefix to pass must be
  treated as a high-severity issue and fixed immediately.

## Production gaps

- No real provider is shipped. The master prompt explicitly forbids it.
