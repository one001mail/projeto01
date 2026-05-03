/**
 * SecretRedactionService.
 *
 * Defense-in-depth utility the HTTP layer calls on every outbound
 * wallet-module response. It walks any JSON-ish value and replaces the
 * value of any forbidden key with '<redacted>' (see
 * `private-key-safety.policy.ts`). The route-level Zod schemas already
 * exclude secrets by construction; this service is a belt-and-braces
 * guard for future changes.
 */
import { redactPayload } from '../../../../shared/application/redaction.js';
import { listForbiddenKeys } from '../../domain/policies/private-key-safety.policy.js';

const DEFAULT_PATHS: readonly string[] = [
  ...listForbiddenKeys().map((k) => `*.${k}`),
  ...listForbiddenKeys().map((k) => `*.*.${k}`),
  'ciphertext',
  'authTag',
  'iv',
];

export class SecretRedactionService {
  redact<T>(value: T): T {
    return redactPayload(value, DEFAULT_PATHS) as T;
  }
}
