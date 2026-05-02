/**
 * AuditAccessPolicy.
 *
 * Decides whether a caller may read audit entries. The current sandbox
 * grants access only to actors flagged as admin (the actor id surfaced by
 * the admin-auth middleware). Pure — no I/O.
 */
export interface AuditAccessSubject {
  readonly actorId: string | null;
  readonly isAdmin: boolean;
}

export const AuditAccessPolicy = {
  canList(subject: AuditAccessSubject): boolean {
    return subject.isAdmin;
  },
  canRead(subject: AuditAccessSubject): boolean {
    return subject.isAdmin;
  },
  canCleanup(subject: AuditAccessSubject): boolean {
    return subject.isAdmin;
  },
} as const;
