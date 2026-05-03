import { Shield, Layers, Clock, FileText } from "lucide-react";

export const HOME_FEATURES = [
  {
    icon: Shield,
    title: "Foco em Privacidade",
    description:
      "Demonstra técnicas conceituais para reduzir a correlação direta entre origem e destino de transações.",
  },
  {
    icon: Layers,
    title: "Múltiplos Destinos",
    description:
      "Permite distribuir o valor recebido entre vários endereços, cada um com sua própria porcentagem.",
  },
  {
    icon: Clock,
    title: "Atraso Configurável",
    description:
      "Defina um intervalo entre 1 e 72 horas para o reenvio aos endereços de destino.",
  },
  {
    icon: FileText,
    title: "Transparência",
    description:
      "Cálculo de taxas, regras e limitações exibidos de forma explícita em cada etapa.",
  },
] as const;
