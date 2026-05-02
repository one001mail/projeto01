export type SagaStatus = 'STARTED' | 'ACCEPTED' | 'ROUTED' | 'COMPLETED' | 'FAILED';

export const TERMINAL_STATUSES: ReadonlySet<SagaStatus> = new Set(['COMPLETED', 'FAILED']);
