import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2 } from "lucide-react";
import type { MixOutput } from "@/domain/types";
import { addOutput, removeOutput, updateOutputAddress, updateOutputPercentage } from "@/domain/mixing/rebalanceOutputs";

interface OutputAddressesProps {
  outputs: MixOutput[];
  onChange: (outputs: MixOutput[]) => void;
  disabled: boolean;
}

const OutputAddresses = ({ outputs, onChange, disabled }: OutputAddressesProps) => {
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
            onClick={() => onChange(addOutput(outputs))}
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
              onChange={(e) => onChange(updateOutputAddress(outputs, index, e.target.value))}
              className="font-mono bg-muted border-border text-sm flex-1"
              disabled={disabled}
            />
            {outputs.length > 1 && (
              <button
                onClick={() => onChange(removeOutput(outputs, index))}
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
                onValueChange={([v]) => onChange(updateOutputPercentage(outputs, index, v))}
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
