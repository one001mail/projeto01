/**
 * ContactRequest aggregate.
 *
 * Support inquiries submitted by the public. Invariants: name/message are
 * required and length-bounded; email must syntactically look like an email
 * (structural check only — no deliverability). No mutation after creation
 * for this sandbox.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CONTACT_REQUEST_STATUSES = ['received', 'processed', 'archived'] as const;
export type ContactRequestStatus = (typeof CONTACT_REQUEST_STATUSES)[number];

export interface ContactRequestProps {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly subject: string | null;
  readonly message: string;
  readonly status: ContactRequestStatus;
  readonly createdAt: Date;
}

export interface CreateContactRequestArgs {
  id: string;
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  createdAt: Date;
}

export class ContactRequest {
  private constructor(private readonly props: ContactRequestProps) {}

  static create(args: CreateContactRequestArgs): ContactRequest {
    if (!args.id) throw new Error('ContactRequest.id is required');

    const name = args.name.trim();
    if (name.length === 0) throw new Error('ContactRequest.name must not be empty');
    if (name.length > 200) throw new Error('ContactRequest.name must be <= 200 chars');

    const email = args.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw new Error('ContactRequest.email is not a valid email');

    let subject: string | null = null;
    if (args.subject !== undefined && args.subject !== null) {
      const s = args.subject.trim();
      if (s.length > 0) {
        if (s.length > 200) {
          throw new Error('ContactRequest.subject must be <= 200 chars');
        }
        subject = s;
      }
    }

    const message = args.message.trim();
    if (message.length === 0) throw new Error('ContactRequest.message must not be empty');
    if (message.length > 5000) throw new Error('ContactRequest.message must be <= 5000 chars');

    return new ContactRequest({
      id: args.id,
      name,
      email,
      subject,
      message,
      status: 'received',
      createdAt: args.createdAt,
    });
  }

  static restore(props: ContactRequestProps): ContactRequest {
    return new ContactRequest(props);
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get email(): string {
    return this.props.email;
  }
  get subject(): string | null {
    return this.props.subject;
  }
  get message(): string {
    return this.props.message;
  }
  get status(): ContactRequestStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): ContactRequestProps {
    return { ...this.props };
  }
}
