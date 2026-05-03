/**
 * Audit-required policy.
 *
 * Declares which wallet operations MUST emit an audit-log entry. The
 * policy is pure data; the infrastructure `AuditLogService` reads it.
 */
export type AuditedOperation =
  | 'wallet.created'
  | 'wallet.address-generated'
  | 'wallet.transaction-prepared'
  | 'wallet.transaction-broadcasted'
  | 'wallet.balance-synced';

const OPERATIONS: readonly AuditedOperation[] = [
  'wallet.created',
  'wallet.address-generated',
  'wallet.transaction-prepared',
  'wallet.transaction-broadcasted',
  'wallet.balance-synced',
];

export function isAuditRequired(op: string): op is AuditedOperation {
  return (OPERATIONS as readonly string[]).includes(op);
}

export function listAuditedOperations(): readonly AuditedOperation[] {
  return OPERATIONS;
}
