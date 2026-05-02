import type { ContactSubmitUseCasePort } from '../../../shared/application/ports/use-cases.port.js';
/**
 * Contact controller.
 *
 * Validates input upstream via Zod, then delegates to the contact-requests
 * `submit` use case. The presenter strips the submitted body — only id /
 * status / createdAt are echoed.
 */
import { AppError } from '../../../shared/errors/app-error.js';
import type { ContactReceiptDto, SubmitContactBody } from '../schemas/contact.schemas.js';

export interface ContactControllerDeps {
  readonly submit: ContactSubmitUseCasePort;
}

export class ContactController {
  constructor(private readonly deps: ContactControllerDeps) {}

  async submit(body: SubmitContactBody): Promise<ContactReceiptDto> {
    const result = await this.deps.submit.execute({
      name: body.name,
      email: body.email,
      subject: body.subject ?? null,
      message: body.message,
    });
    if (!result.ok) {
      throw AppError.badRequest(result.error.message);
    }
    return {
      id: result.value.id,
      status: result.value.status,
      createdAt: result.value.createdAt.toISOString(),
    };
  }
}
