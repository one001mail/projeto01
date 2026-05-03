# Wallet Module

## Responsibility

This module provides legitimate cryptocurrency wallet infrastructure: it
creates wallet metadata, generates operational blockchain receiving
addresses, looks up on-chain balances, prepares unsigned transactions
for a caller's signer, and broadcasts signed transactions through an
RPC provider. It is explicitly NOT a mixer, tumbler, or anonymity
service, and it does not implement any feature that would hide origin
or destination of funds.

## What It Does

- Creates wallet metadata (owner ref, mode, supported networks).
- Generates operational blockchain receiving addresses.
- Supports Ethereum-compatible networks (Sepolia by default, Mainnet
  only when `WALLET_ENABLE_MAINNET=true`).
- Supports Bitcoin-compatible networks (testnet by default, mainnet
  only when `WALLET_ENABLE_MAINNET=true`).
- Looks up address balances through a `BlockchainProvider` abstraction.
- Prepares unsigned transactions (nonce, fee, envelope).
- Broadcasts signed transactions returned by the caller's signer.
- Stores public wallet / address / transaction metadata.
- Enforces mainnet gating at the domain and application layers.
- Enforces private-key safety rules (no key material in domain or HTTP).
- Emits audit logs for sensitive operations.

## What It Does NOT Do

- Does not mix funds.
- Does not anonymize transactions.
- Does not bypass compliance, KYC/AML, or sanctions screening.
- Does not hide transaction origin or destination.
- Does not return private keys.
- Does not return seed phrases.
- Does not store plaintext secrets.
- Does not enable mainnet by default.

## Architecture

The module follows the Clean Architecture + DDD layout used across the
backend:

```
modules/wallet/
├─ domain/        — entities, value objects, domain services, policies,
│                   repository PORTS, domain events, domain errors.
│                   Pure TypeScript. No fastify/pg/ioredis/SDK imports.
├─ application/  — DTOs, mappers, use cases. Depends only on domain.
│                   Takes repository + provider PORTS via DI. Returns
│                   DTOs and never raw entities.
├─ infra/        — persistence adapters (in-memory dev), RPC providers
│                   (Ethereum / Bitcoin), security services (encryption,
│                   redaction, audit), factories, and config validation.
├─ http/         — Fastify routes + Zod schemas.
└─ index.ts      — composition root: `registerWalletModule(app)`.
```

Boundary discipline is enforced by `backend/tools/check-boundaries.ts`
(`npm run check:boundaries`).

## Domain Model

### Wallet (aggregate)
- `id`: UUID.
- `ownerRef`: opaque caller-owned reference.
- `mode`: `non_custodial` (default) or `custodial`.
- `supportedNetworks`: non-empty set of `Network` VOs.
- `custodyKeyRef`: opaque handle into a KeyManagementProvider (custodial
  mode only; never a private key).
- `status`: `active` / `archived`.
- `label`, `createdAt`, `updatedAt`.

### WalletAddress (aggregate)
- Bound to a wallet + network.
- Public address, optional chain id, derivation path, address index.
- Never carries private keys / seeds / xprivs.

### BlockchainTransaction (aggregate)
- Tracks the lifecycle prepared → broadcasting → broadcasted →
  confirmed / failed.
- Stores `unsignedPayload` (hex envelope), `txHash` when broadcast, and a
  `rawSignedRef` (sha256 fingerprint) of the signed payload instead of
  the payload itself.

### Value Objects
- `WalletId`, `Network`, `ChainId`, `Address`, `AssetSymbol`,
  `TransactionHash`, `DerivationPath`, `EncryptedSecret`.

### Policies
- `MainnetGatePolicy`: rejects mainnet ops unless explicitly enabled.
- `PrivateKeySafetyPolicy`: any `privateKey` / `seed` / `mnemonic` /
  `xpriv` field crossing the boundary triggers
  `UnsafePrivateKeyOperationError`.
- `AddressOwnershipPolicy`: tx source must belong to the calling wallet
  and must be active on the given network.
- `TransactionLimitPolicy`: amount (minor units BigInt) must be within a
  configured per-transaction ceiling.
- `AuditRequiredPolicy`: enumerates audit-required operations.

### Domain Events
- `wallet.created`
- `wallet.address-generated`
- `wallet.transaction-prepared`
- `wallet.transaction-broadcasted`
- `wallet.blockchain-balance-updated`

### Repository Ports
- `WalletRepository`, `WalletAddressRepository`,
  `BlockchainTransactionRepository`.

## Application Use Cases

- `CreateWalletUseCase`: creates wallet metadata. Non-custodial by
  default. Custodial mode requires an opaque `custodyKeyRef`.
- `GenerateAddressUseCase`: derives the next public address via the
  `PublicAddressDerivationProvider`; stores metadata; returns a DTO.
- `GetWalletMetadataUseCase`: returns public wallet + address snapshot.
  Never returns private keys or secrets.
- `GetAddressBalanceUseCase`: queries the configured blockchain provider
  for confirmed and pending balance.
- `PrepareTransactionUseCase`: validates ownership and limits, estimates
  fee, builds an unsigned envelope, stores a `prepared` transaction.
- `BroadcastTransactionUseCase`: accepts a signed raw tx, broadcasts it
  through the provider, and records the returned hash.
- `SyncWalletBalancesUseCase`: refreshes balances for all active
  addresses of a wallet.

## Blockchain Providers

- `BlockchainProvider` — shared interface (`family`, `networkName`,
  `isConfigured`, `getBalance`, `buildUnsigned`, `broadcast`).
- `EthereumRpcProvider` — minimal JSON-RPC 2.0 client over `fetch`:
  `eth_getBalance`, `eth_getTransactionCount`, `eth_gasPrice`,
  `eth_sendRawTransaction`.
- `BitcoinRpcProvider` — minimal JSON-RPC 1.0 client (bitcoind-compatible):
  `scantxoutset`, `sendrawtransaction`.

Both providers use provider abstractions so the module is not locked to
one RPC vendor; swap for Infura / Alchemy / QuickNode / self-hosted by
replacing the concrete class in the factory.

## Key Management

Two supported modes:

- **Non-custodial (default)**: private keys and seed phrases are
  generated and stored client-side. The backend stores only public
  addresses and optional public derivation material (xpub). The backend
  NEVER receives a seed phrase or private key.

- **Custodial (optional)**: private keys are held by an
  isolated `KeyManagementProvider`. The only development implementation
  shipped here is `LocalEncryptedKeyManagementProvider` which encrypts
  private keys at rest using AES-256-GCM with `WALLET_ENCRYPTION_KEY`.
  Production deployments MUST replace this with an HSM / KMS / regulated
  custody provider. The raw private key:
  - is never returned from any public method;
  - is never logged;
  - is never serialized into JSON / API responses;
  - is in-memory only for the duration of a single `signDigest` call.

## Security Model

- No plaintext private keys (custodial secrets are AES-256-GCM encrypted).
- No seed phrase exposure (the module never receives one in non-custodial
  mode; there is no endpoint to submit one).
- No secret logging (`AuditLogService` passes every metadata object
  through `SecretRedactionService` before emission).
- HTTP responses run through `SecretRedactionService` as a belt-and-braces
  guard even when route schemas already exclude secrets.
- Mainnet disabled by default; enabled only when
  `WALLET_ENABLE_MAINNET=true`.
- Environment validation at startup via Zod; missing or malformed values
  abort module composition.

## Environment Variables

| Variable                    | Default            | Purpose                                                                 |
|-----------------------------|--------------------|-------------------------------------------------------------------------|
| `WALLET_DEFAULT_MODE`       | `non_custodial`    | Default mode for `POST /wallets`.                                       |
| `WALLET_ENABLE_MAINNET`     | `false`            | When `false`, any mainnet op is refused.                                |
| `WALLET_AUDIT_LOG_ENABLED`  | `true`             | Toggles structured audit logging.                                       |
| `ETHEREUM_RPC_URL`          | (unset)            | HTTPS JSON-RPC endpoint (Sepolia by default).                           |
| `ETHEREUM_CHAIN_ID`         | `11155111` if unset (Sepolia) | EVM chain id.                                                            |
| `BITCOIN_NETWORK`           | `testnet`          | `testnet` or `mainnet` (the latter also requires `WALLET_ENABLE_MAINNET`). |
| `BITCOIN_RPC_URL`           | (unset)            | bitcoind-compatible RPC endpoint.                                       |
| `WALLET_ENCRYPTION_KEY`     | (unset)            | Required only when `WALLET_DEFAULT_MODE=custodial` for dev key wrapping.|
| `WALLET_MAX_AMOUNT_PER_TX`  | `100000000000000000000` | Default per-tx ceiling in minor units (0.1 ETH by default).          |

## Testnet First Policy

The module ships with testnet defaults for both families:

- Ethereum defaults to Sepolia (`chainId=11155111`).
- Bitcoin defaults to testnet.

Mainnet operations fail fast with `MainnetDisabledError` unless
`WALLET_ENABLE_MAINNET=true` is explicitly set AND the operator has
reviewed the production-gap checklist below.

## Production Gap

This module is production-oriented in architecture but is NOT yet
production-ready for handling real funds. Before enabling mainnet:

- Replace `InMemory*Repository` adapters with Postgres-backed ones.
- Replace `LocalEncryptedKeyManagementProvider` with an HSM / KMS /
  regulated custody provider.
- Replace the pseudo-address derivation in
  `public-address-derivation.provider.ts` and
  `local-encrypted-key-management.provider.ts` with a full BIP-32/44/84
  pipeline (e.g. `@scure/bip32`, `ethers.js`, `bitcoinjs-lib`) using
  real keccak-256 and bech32 encoders.
- Define and enforce a custody policy (rotation, ceremony, access).
- Add compliance review, sanctions screening, and transaction
  monitoring hooks.
- Add per-route rate limiting and request-level authN / authZ.
- Wire secure deployment: secrets manager, audit log sink, alerting,
  incident response runbooks, and change control.
- Add observability (metrics, tracing, dashboards).

## Running the Module

The module is registered automatically by `src/app/register-modules.ts`.
The HTTP endpoints are served under the `/api` prefix via Fastify:

- `POST   /api/wallets`
- `GET    /api/wallets/:walletId`
- `POST   /api/wallets/:walletId/addresses`
- `GET    /api/wallets/:walletId/addresses/:address/balance`
- `POST   /api/wallets/:walletId/transactions/prepare`
- `POST   /api/wallets/:walletId/transactions/broadcast`
- `POST   /api/wallets/:walletId/sync-balances`

```bash
cd backend
npm run dev          # tsx watch
npm run typecheck
npm run check:boundaries
```
