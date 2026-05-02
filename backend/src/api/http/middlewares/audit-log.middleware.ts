/**
 * Audit-log middleware (Fastify plugin).
 *
 * Records exactly one audit row per **successfully processed** mutating
 * request (POST / PUT / PATCH / DELETE with `2xx` status). Reads the
 * port `AuditLogStore` from `app.ctx.auditLog` so tests can substitute
 * an in-memory adapter.
 *
 * Privacy by design:
 *   * The request body is redacted using `Config.AUDIT_REDACT_FIELDS` BEFORE
 *     persistence. The store sees only the redacted payload.
 *   * Headers `authorization`, `cookie`, `x-admin-api-key` are dropped
 *     wholesale (they are masked under `headers.*` patterns and need not
 *     reach the store at all).
 *   * No response body is recorded — only status and metadata.
 *   * On `onResponse` the response has already been sent, so any failure
 *     in this middleware is logged but never re-thrown to the client.
 */
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { redactPayload } from '../../../shared/application/redaction.js';

const SAFE_HEADER_KEYS = new Set([
  'content-type',
  'content-length',
  'accept',
  'accept-language',
  'user-agent',
  'idempotency-key',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-forwarded-host',
  'x-request-id',
]);

function safeHeaders(headers: FastifyRequest['headers']): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(headers)) {
    const key = k.toLowerCase();
    if (!SAFE_HEADER_KEYS.has(key)) continue;
    out[key] = v;
  }
  return out;
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const plugin: FastifyPluginAsync = async (app) => {
  app.addHook('onResponse', async (req: FastifyRequest, reply: FastifyReply) => {
    const method = req.method.toUpperCase();
    if (!MUTATING.has(method)) return;
    if (reply.statusCode < 200 || reply.statusCode >= 400) return;

    const cfg = app.ctx.config;
    const path = req.url.split('?')[0] ?? req.url;
    const action = `${method} ${path}`;

    const rawPayload: Record<string, unknown> = {
      method,
      path,
      statusCode: reply.statusCode,
      ip: req.ip,
      headers: safeHeaders(req.headers),
      body: req.body ?? null,
      query: req.query ?? null,
      params: req.params ?? null,
      idempotencyReplay: reply.getHeader('idempotent-replay') === 'true',
    };

    const redactedPayload = redactPayload(rawPayload, cfg.AUDIT_REDACT_FIELDS) as Record<
      string,
      unknown
    >;

    try {
      await app.ctx.auditLog.record({
        scope: 'http',
        action,
        redactedPayload,
        requestId: req.id,
      });
    } catch (err) {
      // Auditing must never break user-visible flow.
      req.log.warn({ err, action }, 'audit-log middleware swallow');
    }
  });
};

export const auditLogMiddleware = fp(plugin, { name: 'audit-log-middleware' });
