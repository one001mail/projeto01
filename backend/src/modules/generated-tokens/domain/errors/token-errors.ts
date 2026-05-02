/** Domain-level errors for the generated-tokens module. */
export class TokenNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`GeneratedToken '${id}' not found`);
    this.name = 'TokenNotFoundError';
  }
}

export class InvalidTokenShapeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTokenShapeError';
  }
}

export class TokenInvalidStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenInvalidStateError';
  }
}
