# Security Model

## Principles

1. **Least Privilege**: All RLS policies default to deny. Only explicitly granted operations are allowed.
2. **Mandatory RLS**: Every table has RLS enabled. No table is accessible without a matching policy.
3. **Input Validation**: All edge functions validate inputs before processing. RLS policies include field-level checks.
4. **No Sensitive Logs**: Logs store action types and entity references, never sensitive data like addresses or amounts in plaintext.
5. **Service Role Isolation**: Only edge functions (server-side) use the service_role key. Client-side code uses the anon key only.

## Attack Surface

| Vector | Mitigation |
|--------|------------|
| SQL injection | PostgREST parameterized queries only |
| Unauthorized data access | RLS policies on all tables |
| Admin impersonation | JWT validation in admin edge function |
| Spam submissions | RLS field-level validation constraints |
| XSS | React auto-escaping, no dangerouslySetInnerHTML |
| CSRF | Supabase handles via API key + CORS |

## Limitations

- No rate limiting (would require external service or Supabase Pro features)
- No CAPTCHA on forms
- No IP-based blocking
- Admin role check is JWT-only (no role table — NOT IMPLEMENTED)
- No encryption at rest beyond Supabase defaults

## Recommendations for Production

1. Add user_roles table with SECURITY DEFINER function for admin checks
2. Implement rate limiting via edge function middleware
3. Add CAPTCHA to contact and mixing forms
4. Enable Supabase audit logging
5. Implement session expiry cron job
