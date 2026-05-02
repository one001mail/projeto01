/**
 * Idempotency middleware (Fastify plugin).
 *
 * Implements RFC-style idempotency keys for designated mutating routes:
 *
 *   * Header   `Idempotency-Key: <opaque-string>`
 *   * Storage  `idempotency_keys` table (port: IdempotencyStore)
 *   * Hash     SHA-256 over `METHOD : URL : JSON.stringify(body)`
 *
 * Outcomes:
 *   * **MISS**     -- no prior record. The request runs; on a 2xx the response
 *                     body + status are persisted under the key.
 *   * **HIT**      -- the same key + same request hash. The cached response
 *                     is replayed verbatim with header `idempotent-replay: true`.
 *   * **MISMATCH** -- the same key with a different request hash. Returns
 *                     409 CONFLICT (`AppError.conflict`) so clients learn
 *                     they reused a key for a different operation.
 *
 * Privacy:
 *   * The request hash is a SHA-256 digest — never the raw body.
 *   * The response body is persisted as-is (already a sanitized public DTO).
 *
 * Scope:
 *   * Apply this plugin only on the routes that legitimately need
 *     idempotency (e.g. POST /api/learning-sessions, POST /api/contact-requests).
 *     A global registration would log overhead on every request.
 */
import { createHash } from 'node:crypto';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../../../shared/errors/app-error.js';

export interface IdempotencyMiddlewareOptions {
  /**
   * TTL for cached responses. Should match `Config.IDEMPOTENCY_TTL_SECONDS`.
   * Defaults to 24h when not provided.
   */
  ttlSeconds?: number;
  /**
   * If true, idempotency is REQUIRED on the routes covered by this plugin.
   * When the header is missing, the request is rejected with 400.
   * Defaults to false (header is optional; absence -> regular request).
   */
  required?: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    idempotency?: { key: string; requestHash: string };
  }
}

function canonicalJson(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalJson(v)).join(',')}]`;
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const entries = keys.map(
    (k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`,
  );
  return `{${entries.join(',')}}`;
}

function computeRequestHash(method: string, url: string, body: unknown): string {
  const h = createHash('sha256');
  h.update(method.toUpperCase());
  h.update(':');
  // Strip query string consistency: only the path is part of the contract.
  h.update(url.split('?')[0] ?? url);
  h.update(':');
  h.update(canonicalJson(body));
  return h.digest('hex');
}

function parseTtlSeconds(opts?: IdempotencyMiddlewareOptions): number {
  const raw = opts?.ttlSeconds;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
  return 24 * 60 * 60;
}

const plugin: FastifyPluginAsync<IdempotencyMiddlewareOptions> = async (app, opts) => {
  const ttlSeconds = parseTtlSeconds(opts);
  const required = opts?.required === true;

  app.addHook('preHandler', async (req: FastifyRequest, reply: FastifyReply) => {
    // Only mutating verbs are eligible.
    const method = req.method.toUpperCase();
    if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH' && method !== 'DELETE') {
      return;
    }

    const headerVal = req.headers['idempotency-key'];
    const key = Array.isArray(headerVal) ? headerVal[0] : headerVal;

    if (!key || typeof key !== 'string' || key.trim().length === 0) {
      if (required) {
        throw AppError.badRequest('Idempotency-Key header is required for this route');
      }
      return;
    }
    if (key.length > 255) {
      throw AppError.badRequest('Idempotency-Key must be at most 255 characters');
    }

    const requestHash = computeRequestHash(method, req.url, req.body);
    const lookup = await app.ctx.idempotency.lookup(key, requestHash);

    if (lookup.outcome === 'MISMATCH') {
      throw AppError.conflict('Idempotency-Key was already used with a different request payload', {
        code: 'IDEMPOTENCY_KEY_MISMATCH',
        key,
      });
    }

    if (lookup.outcome === 'HIT') {
      reply.header('idempotent-replay', 'true');
      reply.header('content-type', 'application/json; charset=utf-8');
      reply.code(lookup.record.statusCode);
      // `send` short-circuits the rest of the lifecycle.
      return reply.send(lookup.record.responseBody);
    }

    // MISS — stash on request so onSend can persist after the handler runs.
    req.idempotency = { key, requestHash };
  });

  app.addHook('onSend', async (req: FastifyRequest, reply: FastifyReply, payload) => {
    const idem = req.idempotency;
    if (!idem) return payload;
    if (reply.statusCode < 200 || reply.statusCode >= 300) return payload;
    // Don't double-persist replays.
    if (reply.getHeader('idempotent-replay')) return payload;

    let parsed: unknown = null;
    try {
      if (typeof payload === 'string') {
        parsed = payload.length === 0 ? null : JSON.parse(payload);
      } else if (Buffer.isBuffer(payload)) {
        const s = payload.toString('utf8');
        parsed = s.length === 0 ? null : JSON.parse(s);
      } else if (payload && typeof payload === 'object') {
        parsed = payload;
      }
    } catch {
      // Non-JSON payload — do not cache; idempotency only covers JSON APIs.
      return payload;
    }

    const expiresAt = new Date(Date.now() + ttlSeconds * 1_000);
    try {
      await app.ctx.idempotency.save({
        key: idem.key,
        requestHash: idem.requestHash,
        statusCode: reply.statusCode,
        responseBody: parsed,
        expiresAt,
        createdAt: new Date(),
      });
    } catch (err) {
      req.log.warn({ err, key: idem.key }, 'idempotency persistence failed; reply unaffected');
    }
    return payload;
  });
};

export const idempotencyMiddleware = fp(plugin, { name: 'idempotency-middleware' });
