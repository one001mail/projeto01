/**
 * Role policy (simplified).
 *
 * The sandbox only recognises two subjects: anonymous and admin (API-key
 * bearer). Real RBAC would replace this module. Kept minimal on purpose.
 */
export type Role = 'anonymous' | 'admin';

export interface RolePolicy {
  canAccessAdmin(role: Role): boolean;
}

export class DefaultRolePolicy implements RolePolicy {
  canAccessAdmin(role: Role): boolean {
    return role === 'admin';
  }
}

export const rolePolicy: RolePolicy = new DefaultRolePolicy();
