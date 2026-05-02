/**
 * Bounded contexts (DDD modules) live here.
 *
 * Module rules: see `_template/README.md`.
 *
 * Cross-module communication goes through the event bus or outbox. A module
 * may NEVER import another module's `domain/` or `application/`.
 */
export { registerTemplateModule } from './_template/index.js';
