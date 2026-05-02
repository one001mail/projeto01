/**
 * Narrow auth-config slice — SANDBOX API-KEY ONLY.
 *
 * The app currently gates `/api/admin/*` with a static API key supplied
 * via env. No JWT secret, no OAuth. The placeholder JWT verifier under
 * `infra/auth/jwt-verifier.ts` exists for parity with the master prompt
 * but is deliberately non-operational.
 */
import type { Config } from '../../app/config.js';

export interface AuthConfig {
  readonly adminApiKey: string | undefined;
}

export function toAuthConfig(config: Config): AuthConfig {
  return { adminApiKey: config.ADMIN_API_KEY };
}
