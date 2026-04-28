/**
 * Mensagens de risco e validação amigáveis ao usuário.
 */

export const RISK_MESSAGES = {
  addressTypo:
    "Endereços inválidos podem resultar em perda permanente dos fundos. Revise antes de confirmar.",
  percentageMismatch: (total: number) =>
    `A soma das porcentagens precisa ser exatamente 100%. Total atual: ${total}%.`,
  amountTooLow: (min: number, currency: string) =>
    `O valor mínimo aceito é ${min} ${currency}.`,
  amountTooHigh: (max: number, currency: string) =>
    `O valor máximo aceito é ${max} ${currency}.`,
  emptyAddress: "Informe um endereço de destino válido.",
  delayExplanation:
    "O atraso configurado define o tempo entre o recebimento e o envio aos endereços de destino.",
} as const;
