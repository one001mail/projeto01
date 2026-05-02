export const EVENT_SAGA_STARTED = 'deposit-saga.started';
export const EVENT_SAGA_ACCEPTED = 'deposit-saga.accepted';
export const EVENT_SAGA_ROUTED = 'deposit-saga.routed';
export const EVENT_SAGA_FAILED = 'deposit-saga.failed';

export interface DepositSagaStartedPayload {
  readonly sagaId: string;
  readonly mockSessionId: string;
  readonly mock: true;
}
