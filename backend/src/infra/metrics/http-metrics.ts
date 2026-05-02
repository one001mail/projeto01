/**
 * HTTP metrics helpers.
 *
 * Wraps the shared metrics registry for the http request/response axis.
 */
import { metricsRegistry } from './prometheus.js';

export const httpRequestsTotal = metricsRegistry.counter(
  'http_requests_total',
  'Total number of HTTP requests observed by the API layer.',
);

export const httpRequestDurationMs = metricsRegistry.histogram(
  'http_request_duration_ms',
  'HTTP request duration in milliseconds.',
);
