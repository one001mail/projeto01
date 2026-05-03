import { AppError } from '../../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../../shared/errors/error-codes.js';

export class MainnetDisabledError extends AppError {
  constructor(network: string) {
    super({
      code: ErrorCode.FORBIDDEN,
      statusCode: 403,
      message: `Mainnet operations are disabled. Network '${network}' requires WALLET_ENABLE_MAINNET=true and a reviewed production configuration.`,
    });
    this.name = 'MainnetDisabledError';
  }
}
