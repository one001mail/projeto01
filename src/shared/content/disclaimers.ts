/**
 * Avisos centralizados exibidos em várias telas.
 * Manter linguagem clara, honesta e sem promessas exageradas.
 */

export const DISCLAIMERS = {
  sandbox:
    "Este projeto é um ambiente de demonstração. Use apenas para fins educacionais e de avaliação.",
  notFinancialAdvice:
    "As informações apresentadas não constituem aconselhamento financeiro, jurídico ou tributário.",
  responsibility:
    "O usuário é integralmente responsável por verificar a legalidade e a adequação do uso em sua jurisdição.",
  irreversible:
    "Operações com criptoativos são irreversíveis. Confira cada endereço de destino antes de confirmar.",
  dataRetention:
    "Armazenamos apenas os metadados mínimos da sessão necessários para exibir o status da operação.",
} as const;

export type DisclaimerKey = keyof typeof DISCLAIMERS;
