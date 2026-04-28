# Privacy Model

## Data Collection

| Data | Purpose | Retention | Classification |
|------|---------|-----------|----------------|
| Mix amount/currency | Session processing | Until session completes | SIMULATED processing |
| Output address | Delivery target | Until session completes | SIMULATED delivery |
| Session code | User tracking reference | Indefinite (demo) | REAL (stored) |
| Contact name/email | Communication | Indefinite (demo) | REAL (stored) |
| IP hash | Abuse prevention field | Not currently collected | NOT IMPLEMENTED |

## Privacy Principles

1. **Minimal collection**: Only data necessary for the simulated service
2. **No tracking**: No analytics, no third-party scripts, no cookies beyond session
3. **Transparency**: All pages include disclaimers about simulation nature
4. **No PII in logs**: Logs reference entity IDs, not personal data

## Production Recommendations

1. Implement automatic data purging after session completion
2. Add configurable retention periods
3. Encrypt sensitive fields (addresses) at rest
4. Implement right-to-deletion for contact data
5. Add privacy policy page with GDPR compliance
6. Consider Tor-friendly deployment
