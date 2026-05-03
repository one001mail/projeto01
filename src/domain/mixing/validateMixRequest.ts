import type { MixRequest } from "../types";

export interface ValidationError {
  field: string;
  message: string;
}

/** Validate a mix request. Returns empty array if valid. */
export function validateMixRequest(req: MixRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!req.amount || req.amount <= 0) {
    errors.push({ field: "amount", message: "Insira um valor válido." });
  }

  const emptyIdx = req.outputs.findIndex((o) => !o.address.trim());
  if (emptyIdx >= 0) {
    errors.push({ field: `outputs[${emptyIdx}].address`, message: "Preencha todos os endereços de destino." });
  }

  if (req.outputs.length > 1) {
    const total = req.outputs.reduce((s, o) => s + o.percentage, 0);
    if (total !== 100) {
      errors.push({ field: "outputs.percentage", message: `O total deve ser 100% (atual: ${total}%).` });
    }
  }

  return errors;
}
