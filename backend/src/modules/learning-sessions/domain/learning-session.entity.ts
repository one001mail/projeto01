/**
 * LearningSession aggregate.
 *
 * Sandbox domain — no financial semantics. Holds a short opaque `publicCode`
 * (surfaced to the user), optional subject / input value, and a lifecycle
 * status. Invariants live on the factory; mutators produce new instances so
 * the aggregate is effectively immutable to callers.
 */
import { isValidPublicCode } from './public-code.js';

export const LEARNING_SESSION_STATUSES = ['pending', 'active', 'completed', 'expired'] as const;
export type LearningSessionStatus = (typeof LEARNING_SESSION_STATUSES)[number];

export interface LearningSessionProps {
  readonly id: string;
  readonly publicCode: string;
  readonly status: LearningSessionStatus;
  readonly subject: string | null;
  readonly inputValue: number | null;
  readonly computedResult: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly expiresAt: Date | null;
}

export interface CreateLearningSessionArgs {
  id: string;
  publicCode: string;
  subject?: string | null;
  inputValue?: number | null;
  createdAt: Date;
  expiresAt?: Date | null;
}

function sanitizeSubject(raw: string | null | undefined): string | null {
  if (raw === undefined || raw === null) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 200) {
    throw new Error('LearningSession.subject exceeds 200 chars');
  }
  return trimmed;
}

function sanitizeInputValue(raw: number | null | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  if (!Number.isFinite(raw)) {
    throw new Error('LearningSession.inputValue must be finite');
  }
  if (raw < 0) {
    throw new Error('LearningSession.inputValue must be non-negative');
  }
  return raw;
}

export class LearningSession {
  private constructor(private readonly props: LearningSessionProps) {}

  static create(args: CreateLearningSessionArgs): LearningSession {
    if (!args.id) throw new Error('LearningSession.id is required');
    if (!isValidPublicCode(args.publicCode)) {
      throw new Error('LearningSession.publicCode is malformed');
    }
    if (args.expiresAt && args.expiresAt.getTime() <= args.createdAt.getTime()) {
      throw new Error('LearningSession.expiresAt must be after createdAt');
    }
    return new LearningSession({
      id: args.id,
      publicCode: args.publicCode,
      status: 'pending',
      subject: sanitizeSubject(args.subject),
      inputValue: sanitizeInputValue(args.inputValue),
      computedResult: null,
      createdAt: args.createdAt,
      updatedAt: args.createdAt,
      expiresAt: args.expiresAt ?? null,
    });
  }

  static restore(props: LearningSessionProps): LearningSession {
    return new LearningSession(props);
  }

  get id(): string {
    return this.props.id;
  }
  get publicCode(): string {
    return this.props.publicCode;
  }
  get status(): LearningSessionStatus {
    return this.props.status;
  }
  get subject(): string | null {
    return this.props.subject;
  }
  get inputValue(): number | null {
    return this.props.inputValue;
  }
  get computedResult(): number | null {
    return this.props.computedResult;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }

  toJSON(): LearningSessionProps {
    return { ...this.props };
  }
}
