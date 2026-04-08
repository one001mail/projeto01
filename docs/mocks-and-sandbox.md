# Mocks & Sandbox

## Simulated Flows

### Mix Session Processing

| Flow | Type | How | Why |
|------|------|-----|-----|
| Mix submission | SIMULATED | Client-side setTimeout (1.5s + 2.5s delays) | No blockchain integration |
| Session code generation | SIMULATED | `MIX-{timestamp36}-{random4}` client-side | Deterministic, no collision check |
| Fee calculation | SIMULATED | Flat 2.5% rate applied client-side | Simplified for demo |
| Status transitions | SIMULATED | Immediate: idle → submitting → processing → complete | No real async processing |

### Edge Function Behavior

| Flow | Type | How | Why |
|------|------|-----|-----|
| mix-session POST | REAL (DB) + SIMULATED (logic) | Writes to DB with 'pending' status, no actual mixing | No blockchain |
| mix-session GET | REAL | Reads from DB, returns session data | Direct DB query |
| pricing GET | REAL | Returns seeded pricing rules from DB | Static seed data |
| contact POST | REAL | Writes to contact_requests table + logs | Persistent storage |
| admin GET | REAL | Counts/lists from DB with JWT auth | Direct DB queries |

### Consistent Mock Data

- Session codes follow pattern: `MIX-{BASE36}-{RANDOM}`
- Fee rate always 2.5% on frontend (edge function also uses 2.5%)
- Supported currencies: BTC, ETH, LTC
- Delay range: 1-72 hours
- Pricing tiers seeded in migration with realistic BTC/ETH/LTC rates

### Artificial Delays

| Location | Delay | Purpose |
|----------|-------|---------|
| Mixing page submit | 1500ms | Simulate validation |
| Mixing page process | 2500ms | Simulate mixing pool |
| Total user wait | ~4000ms | Realistic feel |

## What Is NOT Simulated

- Database writes (REAL — data persists in Supabase)
- Contact form submission (REAL — stored in DB)
- Pricing rules (REAL — read from seeded DB data)
- Edge function responses (REAL — actual HTTP endpoints)
- RLS policy enforcement (REAL — database-level security)
