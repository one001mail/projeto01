/**
 * Error-handler middleware (Fastify plugin facade).
 *
 * The actual implementation lives in `api/http/error-handler.ts` (it must
 * run synchronously during `setErrorHandler`). This file wraps it as a
 * Fastify plugin so callers that prefer `app.register(errorHandlerPlugin)`
 * over the imperative `registerErrorHandler(app)` have a consistent API.
 *
 * Either form is acceptable; `register-plugins.ts` uses the imperative
 * variant because it must run before any route is registered.
 */
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { registerErrorHandler } from '../error-handler.js';

const plugin: FastifyPluginAsync = async (app) => {
  registerErrorHandler(app);
};

export const errorHandlerPlugin = fp(plugin, { name: 'error-handler-middleware' });
