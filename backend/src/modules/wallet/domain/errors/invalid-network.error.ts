import { AppError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';

export class InvalidNetworkError extends AppError {
  constructor(value: string) {
    super({
      code: ErrorCode.BAD_REQUEST,
      statusCode: 400,
      message: `Invalid or unsupported network: '${value}'`,
    });
    this.name = 'InvalidNetworkError';
  }
}
