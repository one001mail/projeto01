import type { MixOutput } from "../types";

/** Add a new output, assigning remaining percentage */
export function addOutput(outputs: MixOutput[]): MixOutput[] {
  if (outputs.length >= 5) return outputs;
  const remaining = 100 - outputs.reduce((s, o) => s + o.percentage, 0);
  return [...outputs, { address: "", percentage: Math.max(remaining, 0) }];
}

/** Remove an output and redistribute its percentage to the first entry */
export function removeOutput(outputs: MixOutput[], index: number): MixOutput[] {
  if (outputs.length <= 1) return outputs;
  const updated = outputs.filter((_, i) => i !== index);
  const total = updated.reduce((s, o) => s + o.percentage, 0);
  if (total !== 100 && updated.length > 0) {
    updated[0] = { ...updated[0], percentage: updated[0].percentage + (100 - total) };
  }
  return updated;
}

/** Update the address of one output */
export function updateOutputAddress(outputs: MixOutput[], index: number, address: string): MixOutput[] {
  return outputs.map((o, i) => (i === index ? { ...o, address } : o));
}

/** Update percentage of one output and proportionally adjust others */
export function updateOutputPercentage(outputs: MixOutput[], index: number, value: number): MixOutput[] {
  if (outputs.length <= 1) return outputs;

  const updated = outputs.map((o) => ({ ...o }));
  const diff = value - updated[index].percentage;
  updated[index].percentage = value;

  const othersTotal = outputs.reduce((s, o, i) => (i !== index ? s + o.percentage : s), 0);
  for (let i = 0; i < updated.length; i++) {
    if (i === index) continue;
    if (othersTotal > 0) {
      const ratio = outputs[i].percentage / othersTotal;
      updated[i].percentage = Math.max(0, Math.round(outputs[i].percentage - diff * ratio));
    }
  }

  // Fix rounding
  const newTotal = updated.reduce((s, o) => s + o.percentage, 0);
  if (newTotal !== 100) {
    const fixIdx = updated.findIndex((_, i) => i !== index);
    if (fixIdx >= 0) updated[fixIdx].percentage += 100 - newTotal;
  }

  return updated;
}
