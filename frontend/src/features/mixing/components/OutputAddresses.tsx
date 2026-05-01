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
    <fieldset className="space-y-4" aria-label="Endereços de destino">
      <div className="flex items-center justify-between">
        <legend className="text-xs font-mono text-muted-foreground">Endereços de Destino</legend>
        {outputs.length < 5 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(addOutput(outputs))}
            disabled={disabled}
            className="text-xs text-primary hover:text-primary/80 gap-1 h-7"
          >
            <Plus aria-hidden="true" className="h-3 w-3" /> Adicionar Endereço
          </Button>
        )}
      </div>

      {outputs.map((output, index) => {
        const addressId = `output-address-${index}`;
        return (
          <div key={index} className="space-y-2 bg-muted/30 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2">
              <Label htmlFor={addressId} className="sr-only">
                Endereço {index + 1}
              </Label>
              <Input
                id={addressId}
                placeholder={`Endereço ${index + 1}`}
                value={output.address}
                onChange={(e) => onChange(updateOutputAddress(outputs, index, e.target.value))}
                className="font-mono bg-muted border-border text-sm flex-1"
                disabled={disabled}
                aria-invalid={!output.address.trim() ? true : undefined}
              />
              {outputs.length > 1 && (
                <button
                  type="button"
                  onClick={() => onChange(removeOutput(outputs, index))}
                  disabled={disabled}
                  aria-label={`Remover endereço ${index + 1}`}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
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
                  aria-label={`Porcentagem do endereço ${index + 1}`}
                />
              </div>
            )}
          </div>
        );
      })}

      {outputs.length > 1 && totalPercentage !== 100 && (
        <p role="alert" className="text-xs text-destructive font-mono">
          Total: {totalPercentage}% (deve ser 100%)
        </p>
      )}
    </fieldset>
  );
};

export default OutputAddresses;
