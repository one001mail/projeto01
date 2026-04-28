/**
 * Module registration.
 *
 * Each bounded context exports a `registerModule()` plugin (see
 * `src/modules/_template/index.ts`) that wires its routes, event handlers,
 * and module-local infra. This file is the *only* place that imports module
 * roots; nothing else may reach into a module's internals.
 *
 * The modules array is the registry: order matters only when one module's
 * read model depends on another's events being subscribed first — in that
 * case, register the producer before the consumer.
 */
import type { FastifyInstance } from 'fastify';
import { registerTemplateModule } from '../modules/_template/index.js';

export interface RegisteredModule {
  readonly name: string;
  readonly register: (app: FastifyInstance) => Promise<void>;
}

const MODULES: readonly RegisteredModule[] = [
  { name: '_template', register: registerTemplateModule },
  // Future bounded contexts go here. Each must:
  //   - depend only on its own `domain/`, `application/`, `infra/`
  //   - communicate cross-module exclusively via the event bus / outbox
];

export async function registerModules(app: FastifyInstance): Promise<void> {
  for (const mod of MODULES) {
    app.log.debug({ module: mod.name }, 'registering module');
    await mod.register(app);
  }
  app.log.info({ count: MODULES.length, modules: MODULES.map((m) => m.name) }, 'modules registered');
}

export function listRegisteredModules(): readonly string[] {
  return MODULES.map((m) => m.name);
}
