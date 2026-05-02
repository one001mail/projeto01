import { redactPayload } from '../../../../shared/application/redaction.js';
import { type Ok, ok } from '../../../../shared/types/result.js';
import { LogRedactionService } from '../../domain/services/log-redaction.service.js';

export class MinimizeLogPayloadUseCase {
  constructor(private readonly svc: LogRedactionService = new LogRedactionService(redactPayload)) {}
  async execute(input: { payload: unknown; redactPaths: readonly string[] }): Promise<Ok<unknown>> {
    return ok(this.svc.redact(input.payload, input.redactPaths));
  }
}
