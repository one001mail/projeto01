# Edge Functions

## health
- **Objective**: Service health check endpoint
- **Input**: None
- **Output**: `{ status: string, timestamp: string, version: string, service: string }`
- **Security**: Public, no auth required
- **Classification**: REAL

## mix-session
- **Objective**: Create and lookup mix sessions with multiple output addresses
- **POST Input**: `{ currency: string, amount: number, outputs: [{address: string, percentage: number}], delay_hours?: number }`
- **POST Output**: `{ session: MixSession }` (201)
- **GET Input**: `?session_code=XXX`
- **GET Output**: `{ session: MixSession }` (200) — includes outputs array
- **Validation**: currency in [BTC, ETH, LTC, USDT, USDC], amount > 0, outputs required, percentages must total 100%, each address >= 10 chars
- **Fee Calculation**: Fetches active pricing_rules from DB, applies tiered rate with minFee fallback
- **Security**: Public endpoint, uses service_role for DB writes
- **Errors**: 400 (validation), 404 (not found), 500 (internal)
- **Classification**: REAL (DB persistence, backend fee calc) + SIMULATED (no blockchain tx)

## pricing
- **Objective**: Return active pricing rules
- **Input**: None (GET only)
- **Output**: `{ rules: PricingRule[] }`
- **Security**: Public, uses anon key
- **Classification**: REAL

## contact
- **Objective**: Submit contact form
- **POST Input**: `{ name: string, email: string, subject?: string, message: string }`
- **POST Output**: `{ success: true, id: string }` (201)
- **Validation**: name, email, message required; message >= 10 chars
- **Security**: Public, uses service_role for write + log
- **Classification**: REAL

## admin
- **Objective**: Admin dashboard data
- **Input**: `?resource=stats|sessions|contacts` + Authorization header
- **Output**: Stats object or paginated list
- **Security**: JWT required, validates user via supabase.auth.getUser()
- **Errors**: 401 (no/invalid token), 400 (unknown resource)
- **Classification**: REAL (data retrieval) — admin UI NOT IMPLEMENTED
