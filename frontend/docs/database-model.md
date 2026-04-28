# Database Model

## Entities

### mix_sessions
Stores each mixing session request.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, auto-generated |
| session_code | TEXT | UNIQUE, NOT NULL |
| currency | TEXT | NOT NULL, default 'BTC' |
| amount | NUMERIC | NOT NULL, CHECK > 0 |
| fee_rate | NUMERIC | NOT NULL, default 0.025 |
| fee_amount | NUMERIC | NOT NULL, CHECK >= 0 |
| net_amount | NUMERIC | NOT NULL, CHECK > 0 |
| output_address | TEXT | NOT NULL |
| delay_hours | INTEGER | NOT NULL, CHECK 1-72 |
| status | mix_status | NOT NULL, default 'pending' |
| ip_hash | TEXT | nullable |
| created_at | TIMESTAMPTZ | NOT NULL, auto |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-trigger |

### pricing_rules
Fee tier configuration.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| currency | TEXT | NOT NULL |
| min_amount | NUMERIC | NOT NULL |
| max_amount | NUMERIC | nullable (unlimited) |
| fee_rate | NUMERIC | NOT NULL |
| min_fee | NUMERIC | NOT NULL |
| is_active | BOOLEAN | NOT NULL, default true |
| created_at | TIMESTAMPTZ | NOT NULL |

### contact_requests
User contact form submissions.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | TEXT | NOT NULL |
| email | TEXT | NOT NULL |
| subject | TEXT | nullable |
| message | TEXT | NOT NULL |
| status | contact_status | NOT NULL, default 'new' |
| created_at | TIMESTAMPTZ | NOT NULL |

### logs
Audit trail for system actions.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| action | TEXT | NOT NULL |
| entity_type | TEXT | nullable |
| entity_id | TEXT | nullable |
| metadata | JSONB | default '{}' |
| created_at | TIMESTAMPTZ | NOT NULL |

## Enums

- `mix_status`: pending, processing, complete, failed, expired
- `contact_status`: new, read, replied, archived

## Indexes

- `idx_mix_sessions_session_code` — fast lookup by code
- `idx_mix_sessions_status` — filter by status
- `idx_mix_sessions_created_at` — chronological ordering
- `idx_contact_requests_status` — filter pending contacts
- `idx_logs_action` — filter by action type
- `idx_logs_created_at` — chronological ordering
