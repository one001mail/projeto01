/**
 * Contact-requests HTTP presenter.
 *
 * Only non-sensitive fields (id / status / createdAt) are surfaced; the
 * submitted body is never echoed, matching standard privacy practice for
 * support intake endpoints.
 */
import type { ContactRequestProps } from '../../domain/contact-request.entity.js';
import type { ContactRequestDto, ContactRequestEnvelope } from './schemas.js';

export function presentContactRequest(props: ContactRequestProps): ContactRequestDto {
  return {
    id: props.id,
    status: props.status,
    createdAt: props.createdAt.toISOString(),
  };
}

export function presentContactRequestEnvelope(props: ContactRequestProps): ContactRequestEnvelope {
  return { request: presentContactRequest(props) };
}
