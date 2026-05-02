/**
 * Admin auth facade.
 *
 * Re-exports the concrete API-key utilities (`api-key.admin-auth.ts`) so
 * consumers can import a stable path regardless of future changes.
 */
export { compareApiKey } from './api-key.admin-auth.js';
