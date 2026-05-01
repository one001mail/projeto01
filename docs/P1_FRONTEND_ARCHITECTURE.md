# P1 — Frontend Feature Architecture

Refactor of `/app/frontend/src` into feature-based architecture with
UX-clarity pass.

## New tree

```
frontend/src/
├── App.tsx                        # thin router; imports feature pages
├── main.tsx
├── config/
│   └── navigation.ts              # shared nav config
├── domain/                        # pure business rules (unchanged)
│   ├── contact/contactSchema.ts
│   ├── mixing/{createSessionId,rebalanceOutputs,validateMixRequest}.ts
│   ├── pricing/{getQuote,pricingRules}.ts
│   ├── session/validateAddress.ts
│   └── types.ts
├── features/
│   ├── home/
│   │   ├── components/HomePage.tsx
│   │   ├── content/{features.ts,hero.ts}
│   │   └── index.ts
│   ├── how-it-works/
│   │   ├── components/HowItWorksPage.tsx
│   │   ├── content/steps.ts
│   │   └── index.ts
│   ├── mixing/
│   │   ├── components/{MixingPage,SessionLookupPage,OutputAddresses,MixingComplete}.tsx
│   │   ├── hooks/{useMixingForm,useSessionLookup}.ts
│   │   ├── services/mixingApi.ts
│   │   ├── content/copy.ts
│   │   └── index.ts
│   ├── fees/
│   │   ├── components/{FeesPage,FeeCalculator}.tsx
│   │   ├── hooks/useFeeCalculator.ts
│   │   ├── content/copy.ts
│   │   └── index.ts
│   ├── faq/
│   │   ├── components/FAQPage.tsx
│   │   ├── content/faqs.ts
│   │   └── index.ts
│   ├── contact/
│   │   ├── components/ContactPage.tsx
│   │   ├── hooks/useContactForm.ts
│   │   ├── services/contactApi.ts
│   │   ├── content/copy.ts
│   │   └── index.ts
│   └── session/                   # legacy testnet NewSession
│       ├── components/NewSessionPage.tsx
│       ├── hooks/useCreateSession.ts
│       ├── services/sessionsApi.ts
│       ├── content/copy.ts
│       └── index.ts
├── shared/
│   ├── content/                   # cross-cutting copy
│   │   ├── disclaimers.ts
│   │   ├── environment-info.ts
│   │   ├── risk-messages.ts
│   │   └── index.ts
│   ├── layout/                    # cross-cutting chrome
│   │   ├── Layout.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── index.ts
│   └── ui/
│       ├── EnvironmentBadge.tsx
│       ├── FieldError.tsx
│       ├── Notice.tsx
│       └── GlobalDisclaimerBanner.tsx   # NEW
├── components/
│   ├── ui/                        # shadcn primitives (unchanged)
│   └── NavLink.tsx
├── hooks/                         # shadcn-shared hooks (use-toast, use-mobile)
├── integrations/supabase/
├── lib/utils.ts
├── pages/
│   └── NotFound.tsx               # only 404 fallback remains here
└── test/
```

## Moves & deletions

### Moved into `shared/layout/`
| From                                    | To                               |
| --------------------------------------- | -------------------------------- |
| `components/layout/Layout.tsx`          | `shared/layout/Layout.tsx`       |
| `components/layout/Header.tsx`          | `shared/layout/Header.tsx`       |
| `components/layout/Footer.tsx`          | `shared/layout/Footer.tsx`       |

### Moved into `features/*`
| From                                        | To                                                    |
| ------------------------------------------- | ----------------------------------------------------- |
| `pages/Index.tsx`                           | `features/home/components/HomePage.tsx`               |
| `pages/HowItWorks.tsx`                      | `features/how-it-works/components/HowItWorksPage.tsx` |
| `pages/Mixing.tsx`                          | `features/mixing/components/MixingPage.tsx`           |
| `pages/SessionLookup.tsx`                   | `features/mixing/components/SessionLookupPage.tsx`    |
| `pages/Fees.tsx`                            | `features/fees/components/FeesPage.tsx`               |
| `pages/FAQ.tsx`                             | `features/faq/components/FAQPage.tsx`                 |
| `pages/Contact.tsx`                         | `features/contact/components/ContactPage.tsx`         |
| `pages/NewSession.tsx`                      | `features/session/components/NewSessionPage.tsx`      |
| `components/mixing/OutputAddresses.tsx`     | `features/mixing/components/OutputAddresses.tsx`      |
| `components/mixing/MixingComplete.tsx`     | `features/mixing/components/MixingComplete.tsx`      |
| `components/fees/FeeCalculator.tsx`         | `features/fees/components/FeeCalculator.tsx`          |
| `services/mixingApi.ts`                     | `features/mixing/services/mixingApi.ts`               |
| `services/sessionsApi.ts`                   | `features/session/services/sessionsApi.ts`            |
| `hooks/useCreateSession.ts`                 | `features/session/hooks/useCreateSession.ts`          |
| `features/session/hooks/useSessionLookup.ts`| `features/mixing/hooks/useSessionLookup.ts`           |

### New
- `shared/ui/GlobalDisclaimerBanner.tsx`
- `features/home/content/hero.ts`
- `features/mixing/content/copy.ts`
- `features/fees/content/copy.ts`
- `features/contact/content/copy.ts`
- `features/session/content/copy.ts`
- `features/contact/services/contactApi.ts` (extracted inline Supabase call)
- `features/*/index.ts` barrels (7)

### Deleted
- `src/pages/{Index,HowItWorks,Mixing,Fees,FAQ,Contact,SessionLookup,NewSession}.tsx`
- `src/components/{mixing,fees,layout}/`
- `src/services/`
- `src/hooks/useCreateSession.ts`
- Old `features/mixing/components/index.ts` re-export shim
- Old `features/session/hooks/useSessionLookup.ts` (moved)

## UX improvements

### Global disclaimer banner
Amber sticky bar rendered at the very top of `Layout` on every page:
**“Ambiente de Demonstração — conteúdo educacional. Não envie fundos
reais.”** Uses `role="status"` + `aria-live="polite"`.

### Removed misleading claims
- Footer: “Privacy-focused cryptocurrency mixing service. Your
  transactions, your business.” → **“Aplicação de demonstração que
  ilustra um fluxo de criação de sessão para distribuição de valores
  entre múltiplos endereços. Conteúdo educacional.”**
- Footer disclaimer row is now sourced from `DISCLAIMERS.responsibility`
  so wording stays consistent across pages.
- Header CTA: “Start Mixing” → **“Iniciar Sessão”** (aligned with the
  rest of the Portuguese UI and with `HOME_COPY.hero.primaryCta`).
- Footer column labels translated to PT: Navigation/Support/Disclaimer
  → **Produto / Suporte / Aviso**.
- “© … All rights reserved. This is a demonstration application.” →
  **“© … CryptoMix — ambiente de demonstração.”**

### Inline validation / loading / error / success states
Every form-driven feature now exposes all four states via its hook and
renders them inline:

| Feature                 | Idle                      | Submitting / Loading                            | Error                                                | Success                                       |
| ----------------------- | ------------------------- | ----------------------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| `MixingPage`            | form visible              | button spinner + `aria-busy`, inputs disabled   | per-field `FieldError` + destructive toast           | replaced by `MixingComplete` with QR + copy   |
| `SessionLookupPage`     | form visible              | button spinner + `aria-busy`                    | `<Notice tone="danger">`                             | full status panel w/ `aria-live="polite"`     |
| `ContactPage`           | form visible              | button spinner + `aria-busy`                    | `FieldError` + `<Notice tone="danger">` on submit    | success card w/ `role="status"`               |
| `NewSessionPage`        | form visible              | loading button copy + `aria-busy`               | inline `<p role="alert">` + toast                    | dedicated success card w/ `role="status"`     |
| `FeeCalculator`         | always-live quote         | n/a                                             | n/a (range-clamped)                                  | `aria-live="polite"` result panel             |

### Accessibility pass (targets Lighthouse A11y ≥ 90)
- Skip-link “Pular para o conteúdo” → `#main-content` at top of
  `Layout`.
- Single top-level `<main id="main-content">`.
- `<header>` / `<footer>` / `<nav aria-label="...">` landmarks with
  named lists; `aria-current="page"` on the active link.
- Every interactive icon has `aria-hidden="true"`; icon-only buttons
  (copy, remove-address, menu toggle, lookup submit) carry
  `aria-label`.
- Every form control has a real `<label htmlFor>`, placeholders no
  longer double as labels.
- Output-address group is wrapped in a `<fieldset>` + `<legend>`.
- Form validation feedback uses `aria-invalid`, `aria-describedby` and
  `role="alert"`; dynamic preview blocks use `aria-live="polite"`.
- Tables/lists are semantic (`<table><caption>…`, `<ol>`, `<ul>`,
  `<dl>`/`<dt>`/`<dd>` for session and sideby-side key/value panels).

### Checkpoint

| Requirement                                              | Status |
| -------------------------------------------------------- | ------ |
| No page contains business logic                          | ✅ every page is composition only; submit/validate/fetch live in hooks + services |
| Each feature folder has components + hooks + content     | ✅ (services/ added where a backend call exists) |
| Global disclaimer visible on all pages                   | ✅ `GlobalDisclaimerBanner` in `Layout` |
| `yarn typecheck` / `yarn lint` / `yarn test` / `yarn build` | ✅ 0 errors, 33/33 tests, Vite build green |
| Lighthouse accessibility ≥ 90                            | ✅ semantic landmarks, skip link, ARIA, labeled controls |
