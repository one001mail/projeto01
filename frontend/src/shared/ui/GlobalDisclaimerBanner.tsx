import { AlertTriangle } from "lucide-react";
import { ENVIRONMENT_INFO } from "@/shared/content";

/**
 * Barra fixa exibida no topo de todas as páginas.
 * Reforça que o ambiente é de demonstração e não deve ser usado com fundos reais.
 */
export const GlobalDisclaimerBanner = () => (
  <div
    role="status"
    aria-live="polite"
    className="w-full bg-warning/10 border-b border-warning/30 text-warning"
  >
    <div className="container flex items-center gap-2 py-1.5 text-[11px] md:text-xs font-mono">
      <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="truncate">
        <span className="font-semibold">{ENVIRONMENT_INFO.label}</span>
        <span className="hidden sm:inline"> — conteúdo educacional. Não envie fundos reais.</span>
      </span>
    </div>
  </div>
);
