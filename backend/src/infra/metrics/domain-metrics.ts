/**
 * Domain-level metrics.
 *
 * Counters / histograms consumed by domain modules. Purely additive and
 * safe to tree-shake away if metrics are disabled.
 */
import { metricsRegistry } from './prometheus.js';

export const domainEventsPublished = metricsRegistry.counter(
  'domain_events_published_total',
  'Total number of domain events published to the event bus (sandbox).',
);

export const domainUseCaseInvocations = metricsRegistry.counter(
  'domain_use_case_invocations_total',
  'Total number of domain use-case invocations.',
);
