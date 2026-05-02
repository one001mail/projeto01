/**
 * Re-export of the generic Result<T, E> helper for use in shared/domain.
 *
 * The canonical definition lives in `shared/types/result.ts`. This file
 * exists so domain code can import a Result from the same layer without
 * cross-layer boundary violations (`shared-domain -> shared-types` is
 * allowed by the boundary checker).
 */
export type { Err, Ok, Result } from '../types/result.js';
export { err, isErr, isOk, ok } from '../types/result.js';
