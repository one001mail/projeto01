# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  React 18 + Vite + Tailwind CSS + TypeScript            │
│  ┌──────┬──────────┬────────┬──────┬─────┬─────────┐   │
│  │ Home │ HowItWorks│ Mixing │ Fees │ FAQ │ Contact │   │
│  └──────┴──────────┴────────┴──────┴─────┴─────────┘   │
│           │              │              │                │
│           ▼              ▼              ▼                │
│     supabase-js client (anon key)                       │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 SUPABASE PLATFORM                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Edge Functions (Deno runtime)                      │ │
│  │  health │ mix-session │ pricing │ contact │ admin  │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ PostgreSQL + PostgREST + Auth + RLS                │ │
│  │  mix_sessions │ pricing_rules │ contact_requests   │ │
│  │  logs                                              │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Trade-offs

| Decision | Reason | Impact |
|----------|--------|--------|
| Client-side rendering only | Lovable platform constraint | No SSR/SSG, but faster dev |
| Supabase for all backend | Single platform, managed infra | Vendor lock-in, but zero ops |
| Simulated mixing logic | Legal/ethical safety | Clear demo boundary |
| Flat fee calculation | Simplicity for MVP | Real system would need dynamic pricing |
| No auth for mixing | Privacy-first design | Lower barrier, harder admin |
| RLS over middleware | Database-level security | Cannot be bypassed by API |

## Limitations

- No real blockchain integration (SIMULATED)
- No real payment processing
- No WebSocket real-time updates
- No email notifications
- Single-region deployment
- No rate limiting beyond RLS constraints

## Modularization Strategy

- `/components/layout/` — shared layout (Header, Footer, Layout)
- `/components/ui/` — shadcn design system
- `/pages/` — route-level pages
- `/integrations/supabase/` — auto-generated client + types
- `supabase/functions/` — edge functions (one per directory)

## System Behavior Policy

- All mixing is SIMULATED with artificial delays
- Session codes are generated client-side (demo) or server-side (edge function)
- Contact form writes directly to database
- Admin functions require JWT authentication
- Logs are write-only from edge functions
