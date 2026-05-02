/**
 * Template module composition root.
 *
 * Pattern every module follows:
 *   1. Build module-local infra (repositories, clients).
 *   2. Build use cases, injecting infra ports.
 *   3. Register HTTP routes (if any) using the use cases.
 *   4. Subscribe to relevant events on `app.ctx.eventBus`.
 *
 * The template registers no HTTP route (it is documentation, not a real
 * surface). It DOES exercise the wiring so the build proves the pattern
 * compiles end-to-end.
 */
import type { FastifyInstance } from 'fastify';
import { CreateExampleUseCase } from './application/create-example.use-case.js';
import { InMemoryExampleRepository } from './infra/in-memory-example.repository.js';

export interface TemplateModule {
  readonly name: '_template';
  readonly createExample: CreateExampleUseCase;
  readonly repository: InMemoryExampleRepository;
}

export async function registerTemplateModule(app: FastifyInstance): Promise<void> {
  // 1. Module-local infra
  const repository = new InMemoryExampleRepository();

  // 2. Use cases
  const createExample = new CreateExampleUseCase(repository);

  // 3. Routes — none for the template; real modules add a Fastify plugin here.

  // 4. Event subscriptions — demonstrate access to the application bus
  //    without producing real side effects.
  const unsubscribe = app.ctx.eventBus.subscribe<{
    id: string;
    name: '_template.example.requested';
    occurredAt: string;
    payload: { id: string };
  }>('_template.example.requested', async (event) => {
    await createExample.execute({ id: event.payload.id, name: 'from-event' });
  });

  app.addHook('onClose', async () => {
    unsubscribe();
  });

  app.log.debug({ module: '_template' }, 'template module ready');
}
