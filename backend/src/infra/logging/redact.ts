/**
 * Log redaction helper (infra).
 *
 * Thin re-export of the shared redaction utility so log-minimizer and
 * logger adapters can import a short path.
 */
export { REDACTED_PLACEHOLDER, redactPayload } from '../../shared/application/redaction.js';
