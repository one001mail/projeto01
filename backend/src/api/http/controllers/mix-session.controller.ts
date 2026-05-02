import type {
  MixSessionCreateUseCasePort,
  MixSessionDtoFromUseCase,
  MixSessionGetUseCasePort,
} from '../../../shared/application/ports/use-cases.port.js';
/**
 * Mix-session controller.
 *
 * Sandbox-only: every successful response carries a `sandboxNotice` so
 * clients cannot mistake the educational session for a real transaction.
 * The controller is framework-free; it consumes use case ports populated
 * by the `learning-sessions` module via the `useCases` registry.
 */
import { AppError } from '../../../shared/errors/app-error.js';
import { makeSandboxNotice } from '../schemas/common.schemas.js';
import type { CreateMixSessionBody, MixSessionDto } from '../schemas/mix-session.schemas.js';

export interface MixSessionControllerDeps {
  readonly create: MixSessionCreateUseCasePort;
  readonly get: MixSessionGetUseCasePort;
}

export class MixSessionController {
  constructor(private readonly deps: MixSessionControllerDeps) {}

  async create(body: CreateMixSessionBody): Promise<MixSessionDto> {
    const result = await this.deps.create.execute({
      subject: body.subject ?? null,
      inputValue: body.inputValue ?? null,
      expiresInSeconds: body.expiresInSeconds ?? null,
    });
    if (!result.ok) {
      switch (result.error.kind) {
        case 'INVALID_INPUT':
          throw AppError.badRequest(result.error.message);
        case 'COLLISION':
          throw AppError.conflict(result.error.message);
      }
    }
    return toMixSessionDto(result.value);
  }

  async getById(publicId: string): Promise<MixSessionDto> {
    const result = await this.deps.get.execute({ publicCode: publicId });
    if (!result.ok) {
      switch (result.error.kind) {
        case 'INVALID_INPUT':
          throw AppError.badRequest(result.error.message);
        case 'NOT_FOUND':
          throw AppError.notFound(result.error.message);
      }
    }
    return toMixSessionDto(result.value);
  }
}

function toMixSessionDto(props: MixSessionDtoFromUseCase): MixSessionDto {
  return {
    id: props.id,
    publicId: props.publicCode,
    status: props.status,
    subject: props.subject,
    inputValue: props.inputValue,
    computedResult: props.computedResult,
    createdAt: props.createdAt.toISOString(),
    updatedAt: props.updatedAt.toISOString(),
    expiresAt: props.expiresAt ? props.expiresAt.toISOString() : null,
    sandboxNotice: makeSandboxNotice(),
  };
}
