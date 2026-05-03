import { AppError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';

/**
 * Thrown whenever application code attempts to read, return, or log
 * private-key material outside the isolated key-management boundary.
 */
export class UnsafePrivateKeyOperationError extends AppError {
  constructor(operation: string) {
    super({
      code: ErrorCode.FORBIDDEN,
      statusCode: 403,
      message: `Unsafe operation refused: '${operation}'. Private keys never leave the KeyManagementProvider boundary and are never returned through the API.`,
    });
    this.name = 'UnsafePrivateKeyOperationError';
  }
}
