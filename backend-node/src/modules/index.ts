/**
 * Bounded contexts (DDD modules) live here.
 *
 * Each module is self-contained and follows Clean Architecture:
 *
 *   modules/<name>/
 *     domain/        — entities, value objects, domain services, repository ports
 *     application/   — use cases / orchestrators (depend on domain only)
 *     infra/         — driven adapters: repositories, external clients
 *     index.ts       — public composition: registers routes / event handlers
 *
 * Modules communicate **only** via:
 *   - the in-process event bus (`infra/events`)
 *   - the outbox table (for cross-process / durable delivery)
 *
 * Direct imports from one module's `domain` or `application` into another are
 * forbidden — enforce this via lint rules in a later phase.
 */
export const MODULES_REGISTERED: readonly string[] = [];
