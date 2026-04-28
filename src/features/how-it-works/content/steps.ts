import { ClipboardList, Layers, Clock, ArrowRightCircle } from "lucide-react";

export const HOW_STEPS = [
  {
    number: "01",
    title: "Configuração da Sessão",
    description:
      "Você informa o valor, a moeda e os endereços de destino com suas respectivas porcentagens.",
    icon: ClipboardList,
  },
  {
    number: "02",
    title: "Geração do Endereço de Depósito",
    description:
      "Um endereço de depósito é gerado por um provedor de pagamentos integrado ao ambiente.",
    icon: Layers,
  },
  {
    number: "03",
    title: "Janela de Atraso",
    description:
      "Após o recebimento, é aplicado o intervalo configurado antes do envio aos destinos.",
    icon: Clock,
  },
  {
    number: "04",
    title: "Distribuição",
    description:
      "Os valores são encaminhados aos endereços de destino conforme a divisão definida.",
    icon: ArrowRightCircle,
  },
] as const;
