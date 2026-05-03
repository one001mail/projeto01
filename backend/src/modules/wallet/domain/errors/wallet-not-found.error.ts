import { AppError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';

export class WalletNotFoundError extends AppError {
  constructor(walletId: string) {
    super({
      code: ErrorCode.NOT_FOUND,
      statusCode: 404,
      message: `Wallet '${walletId}' not found`,
    });
    this.name = 'WalletNotFoundError';
  }
}
