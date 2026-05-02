/**
 * Learning-sessions controller.
 *
 * Framework-free orchestration: validates input (already done upstream by
 * Zod), invokes the use case, maps domain errors to `AppError`, and returns
 * the DTO. Routes are responsible only for HTTP plumbing.
 */
import { AppError } from '../../../../shared/errors/app-error.js';
import type { CreateLearningSessionUseCase } from '../../application/create-learning-session.use-case.js';
import type { GetLearningSessionUseCase } from '../../application/get-learning-session.use-case.js';
import type { LearningSessionProps } from '../../domain/learning-session.entity.js';
import type { CreateLearningSessionBody } from './schemas.js';

export interface LearningSessionsControllerDeps {
  createUc: CreateLearningSessionUseCase;
  getUc: GetLearningSessionUseCase;
}

export class LearningSessionsController {
  constructor(private readonly deps: LearningSessionsControllerDeps) {}

  async create(body: CreateLearningSessionBody): Promise<LearningSessionProps> {
    const result = await this.deps.createUc.execute({
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
    return result.value;
  }

  async getByPublicCode(publicCode: string): Promise<LearningSessionProps> {
    const result = await this.deps.getUc.execute({ publicCode });
    if (!result.ok) {
      switch (result.error.kind) {
        case 'INVALID_INPUT':
          throw AppError.badRequest(result.error.message);
        case 'NOT_FOUND':
          throw AppError.notFound(result.error.message);
      }
    }
    return result.value;
  }
}
