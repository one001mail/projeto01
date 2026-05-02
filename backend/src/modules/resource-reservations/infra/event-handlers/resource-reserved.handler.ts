/**
 * Optional event handler for reservation lifecycle observation.
 *
 * Wired through the F4 registry only when the module is composed alongside
 * the workers harness. The handler is intentionally narrow — it logs the
 * lifecycle event and returns; downstream observers consume the same
 * events through the bus.
 */
import type { Logger } from '../../../../shared/application/ports/logger.port.js';
import { RESOURCE_RESERVED_EVENT } from '../../domain/events/resource-reserved.event.js';

export interface ResourceReservedObservedEvent {
  readonly name: typeof RESOURCE_RESERVED_EVENT;
  readonly payload: {
    readonly id: string;
    readonly namespace: string;
    readonly amount: number;
  };
}

export function createResourceReservedObserver(logger: Logger) {
  return {
    eventName: RESOURCE_RESERVED_EVENT,
    handlerName: 'resource-reservations.observe-reserved',
    handle(event: ResourceReservedObservedEvent): void {
      logger.debug(
        { id: event.payload.id, namespace: event.payload.namespace },
        'resource-reservations: observed reservation',
      );
    },
  };
}
