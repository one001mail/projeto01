/**
 * Informações sobre o ambiente atual da aplicação.
 * Usado para deixar explícito ao usuário o estado operacional.
 */

export const ENVIRONMENT_INFO = {
  mode: "sandbox" as const,
  label: "Ambiente de Demonstração",
  description:
    "Este ambiente integra serviços reais de geração de endereços de pagamento, mas é destinado a testes e avaliação do produto.",
  supportedCurrencies: ["BTC", "ETH", "LTC", "USDT", "USDC"] as const,
  paymentProvider: "NOWPayments",
};
