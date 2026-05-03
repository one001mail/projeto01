import { AppError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';

export class InvalidAddressError extends AppError {
  constructor(value: string) {
    super({
      code: ErrorCode.BAD_REQUEST,
      statusCode: 400,
      message: `Invalid blockchain address: '${value}'`,
    });
    this.name = 'InvalidAddressError';
  }
}
