# Architecture Overview

## Domain Layer (`src/domain/`)

Pure TypeScript functions with zero React dependencies. Single source of truth for all business logic.

### `types.ts`
Central type definitions: `Currency`, `MixStatus`, `MixOutput`, `MixRequest`, `MixQuote`, `PricingTier`, `CurrencyRange`.

### `pricing/`
- **`pricingRules.ts`** — `PRICING_TIERS`, `CURRENCY_RANGES`, `getFeeTableRows()`. Single source of truth for all fee data.
- **`getQuote.ts`** — `getQuote(currency, amount)` returns a `MixQuote`. `formatCryptoAmount(n)` for display.

### `mixing/`
- **`validateMixRequest.ts`** — Pure validation returning `ValidationError[]`.
- **`createSessionId.ts`** — Generates simulated session IDs.
- **`rebalanceOutputs.ts`** — `addOutput`, `removeOutput`, `updateOutputAddress`, `updateOutputPercentage`. All pure, immutable.

### `contact/`
- **`contactSchema.ts`** — Zod schema for contact form validation.

## Config (`src/config/`)
- **`navigation.ts`** — Single `navLinks` array used by Header and Footer.

## Components
Components are thin UI layers that delegate to domain functions. No inline business logic.

## Testing
Unit tests in `src/test/` cover all domain functions: `getQuote`, `validateMixRequest`, `rebalanceOutputs`.
