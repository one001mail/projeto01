import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2 } from "lucide-react";

export interface OutputEntry {
  address: string;
  percentage: number;
}

interface OutputAddressesProps {
  outputs: OutputEntry[];
  onChange: (outputs: OutputEntry[]) => void;
  disabled: boolean;
}

const OutputAddresses = ({ outputs, onChange, disabled }: OutputAddressesProps) => {
  const addOutput = () => {
    if (outputs.length >= 5) return;
    const remaining = 100 - outputs.reduce((s, o) => s + o.percentage, 0);
    onChange([...outputs, { address: "", percentage: Math.max(remaining, 0) }]);
  };

  const removeOutput = (index: number) => {
    if (outputs.length <= 1) return;
    const updated = outputs.filter((_, i) => i !== index);
    // Redistribute removed percentage to first
    const total = updated.reduce((s, o) => s + o.percentage, 0);
    if (total !== 100 && updated.length > 0) {
      updated[0].percentage += 100 - total;
    }
    onChange(updated);
  };

  const updateAddress = (index: number, address: string) => {
    const updated = [...outputs];
    updated[index] = { ...updated[index], address };
    onChange(updated);
  };

  const updatePercentage = (index: number, value: number) => {
    const updated = [...outputs];
    const diff = value - updated[index].percentage;
    updated[index] = { ...updated[index], percentage: value };

    // Adjust others proportionally
    if (outputs.length > 1) {
      const othersTotal = outputs.reduce((s, o, i) => i !== index ? s + o.percentage : s, 0);
      for (let i = 0; i < updated.length; i++) {
        if (i === index) continue;
        if (othersTotal > 0) {
          const ratio = outputs[i].percentage / othersTotal;
          updated[i] = { ...updated[i], percentage: Math.max(0, Math.round(outputs[i].percentage - diff * ratio)) };
        }
      }
      // Fix rounding
      const newTotal = updated.reduce((s, o) => s + o.percentage, 0);
      if (newTotal !== 100 && updated.length > 1) {
        const fixIdx = updated.findIndex((_, i) => i !== index);
        if (fixIdx >= 0) updated[fixIdx].percentage += 100 - newTotal;
      }
    }

    onChange(updated);
  };

  const totalPercentage = outputs.reduce((s, o) => s + o.percentage, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-mono text-muted-foreground">Endereços de Destino</Label>
        {outputs.length < 5 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addOutput}
            disabled={disabled}
            className="text-xs text-primary hover:text-primary/80 gap-1 h-7"
          >
            <Plus className="h-3 w-3" /> Adicionar Endereço
          </Button>
        )}
      </div>

      {outputs.map((output, index) => (
        <div key={index} className="space-y-2 bg-muted/30 rounded-lg p-3 border border-border/50">
          <div className="flex items-center gap-2">
            <Input
              placeholder={`Endereço ${index + 1}`}
              value={output.address}
              onChange={(e) => updateAddress(index, e.target.value)}
              className="font-mono bg-muted border-border text-sm flex-1"
              disabled={disabled}
            />
            {outputs.length > 1 && (
              <button
                onClick={() => removeOutput(index)}
                disabled={disabled}
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {outputs.length > 1 && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground font-mono">Distribuição</span>
                <span className="text-xs font-mono text-primary">{output.percentage}%</span>
              </div>
              <Slider
                value={[output.percentage]}
                onValueChange={([v]) => updatePercentage(index, v)}
                min={1}
                max={99}
                step={1}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      ))}

      {outputs.length > 1 && totalPercentage !== 100 && (
        <p className="text-xs text-destructive font-mono">
          ⚠ Total: {totalPercentage}% (deve ser 100%)
        </p>
      )}
    </div>
  );
};

export default OutputAddresses;
