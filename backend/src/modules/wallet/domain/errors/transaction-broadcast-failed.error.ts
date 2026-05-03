import { AppError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';

export class TransactionBroadcastFailedError extends AppError {
  constructor(reason: string, details?: Record<string, unknown>) {
    super({
      code: ErrorCode.UNPROCESSABLE_ENTITY,
      statusCode: 422,
      message: `Transaction broadcast failed: ${reason}`,
      ...(details ? { details } : {}),
    });
    this.name = 'TransactionBroadcastFailedError';
  }
}
