# Auth & RLS Model

## Roles

| Role | Description |
|------|-------------|
| anon | Unauthenticated users (public visitors) |
| authenticated | Logged-in users |
| service_role | Edge functions with service key (bypasses RLS) |

## RLS Policies

### mix_sessions

| Role | Operation | Condition |
|------|-----------|-----------|
| anon, authenticated | INSERT | amount > 0 AND currency IN ('BTC','ETH','LTC') AND delay 1-72 AND address >= 10 chars AND status = 'pending' |
| anon, authenticated | SELECT | true (public read) |

### pricing_rules

| Role | Operation | Condition |
|------|-----------|-----------|
| anon, authenticated | SELECT | is_active = true |

### contact_requests

| Role | Operation | Condition |
|------|-----------|-----------|
| anon, authenticated | INSERT | name >= 1 char AND email >= 5 chars AND message >= 10 chars AND status = 'new' |

### logs

| Role | Operation | Condition |
|------|-----------|-----------|
| authenticated | SELECT | false (blocked — admin access via service_role only) |

## Security Notes

- INSERT policies include field-level validation to prevent abuse
- Logs table has no public access; admin edge function uses service_role
- No UPDATE/DELETE policies exist for public roles
- Edge functions use SUPABASE_SERVICE_ROLE_KEY for privileged operations
- Admin edge function validates JWT before returning data
