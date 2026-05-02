/**
 * Contact-requests controller.
 */
import { AppError } from '../../../../shared/errors/app-error.js';
import type { SubmitContactRequestUseCase } from '../../application/submit-contact-request.use-case.js';
import type { ContactRequestProps } from '../../domain/contact-request.entity.js';
import type { SubmitContactRequestBody } from './schemas.js';

export interface ContactRequestsControllerDeps {
  submitUc: SubmitContactRequestUseCase;
}

export class ContactRequestsController {
  constructor(private readonly deps: ContactRequestsControllerDeps) {}

  async submit(body: SubmitContactRequestBody): Promise<ContactRequestProps> {
    const result = await this.deps.submitUc.execute({
      name: body.name,
      email: body.email,
      subject: body.subject ?? null,
      message: body.message,
    });
    if (!result.ok) {
      throw AppError.badRequest(result.error.message);
    }
    return result.value;
  }
}
