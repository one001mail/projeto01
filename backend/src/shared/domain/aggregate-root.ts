/**
 * Aggregate Root.
 *
 * An aggregate root owns a cluster of entities and is the single entry
 * point for mutations against that cluster. It collects domain events
 * raised during a transaction; the application layer drains them after
 * persistence and forwards to the outbox / event bus.
 */
import type { DomainEventEnvelope } from './domain-event.js';
import { Entity } from './entity.js';

export abstract class AggregateRoot<TId extends string = string> extends Entity<TId> {
  private _pendingEvents: DomainEventEnvelope[] = [];

  protected recordEvent(event: DomainEventEnvelope): void {
    this._pendingEvents.push(event);
  }

  pullEvents(): readonly DomainEventEnvelope[] {
    const out = this._pendingEvents;
    this._pendingEvents = [];
    return out;
  }

  get pendingEventCount(): number {
    return this._pendingEvents.length;
  }
}
