/**
 * Learning-sessions HTTP presenter.
 *
 * Converts the application-layer DTO (aggregate props) into the public
 * response envelope. Dates become ISO strings; `null` is preserved for
 * absent values so clients can reliably destructure.
 */
import type { LearningSessionProps } from '../../domain/learning-session.entity.js';
import type { LearningSessionDto, LearningSessionEnvelope } from './schemas.js';

export function presentLearningSession(props: LearningSessionProps): LearningSessionDto {
  return {
    id: props.id,
    publicCode: props.publicCode,
    status: props.status,
    subject: props.subject,
    inputValue: props.inputValue,
    computedResult: props.computedResult,
    createdAt: props.createdAt.toISOString(),
    updatedAt: props.updatedAt.toISOString(),
    expiresAt: props.expiresAt ? props.expiresAt.toISOString() : null,
  };
}

export function presentLearningSessionEnvelope(
  props: LearningSessionProps,
): LearningSessionEnvelope {
  return { session: presentLearningSession(props) };
}
