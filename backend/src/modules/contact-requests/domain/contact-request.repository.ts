/**
 * ContactRequest repository PORT.
 */
import type { ContactRequest } from './contact-request.entity.js';

export interface ContactRequestRepository {
  save(request: ContactRequest): Promise<void>;
}
