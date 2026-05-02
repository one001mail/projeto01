# Module Catalogue

Each bounded context registered in `src/app/register-modules.ts` has a
dedicated note in this folder so the team can reason about its surface and
responsibilities without reading the source.

| Module             | Status   | Doc                                                 |
| ------------------ | -------- | --------------------------------------------------- |
| `_template`        | template | [`./_template.md`](./_template.md)                  |
| `learning-sessions`| active   | [`./learning-sessions.md`](./learning-sessions.md)  |
| `contact-requests` | active   | [`./contact-requests.md`](./contact-requests.md)    |
| `pricing`          | active   | [`./pricing.md`](./pricing.md)                      |

## How to add a new module doc

1. Create `./<module-name>.md` with the sections:
   - **Purpose** — one paragraph.
   - **HTTP surface** — table of method/path/handler.
   - **Domain events emitted** — `EventName.Verb` ⇒ payload shape.
   - **Domain events consumed** — what subscriptions are registered and why.
   - **Persistence** — tables touched + responsible repository.
   - **Open issues / TODO**.
2. Add a row to the table above.
3. Make sure `register-modules.ts` lists the module in the right order.
