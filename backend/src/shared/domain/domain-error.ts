/**
 * Domain-level error.
 *
 * Distinct from `AppError` (HTTP/framework errors). Domain errors express
 * invariant violations and are usually returned in `Result<T, E>`. The
 * application layer translates them into `AppError` at the boundary.
 */
export class DomainError extends Error {
  constructor(
    public readonly kind: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
