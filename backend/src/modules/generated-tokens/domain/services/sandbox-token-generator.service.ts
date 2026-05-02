/**
 * SandboxTokenGenerator PORT.
 *
 * Domain-level port for producing the opaque `sbx_*` string. The default
 * provider lives in `infra/providers/random-sandbox-token.provider.ts`.
 */
import type { SandboxToken } from '../value-objects/sandbox-token.vo.js';

export interface SandboxTokenGenerator {
  generate(): SandboxToken;
}
