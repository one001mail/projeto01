export const FAQ_ITEMS = [
  {
    q: "O que este projeto é?",
    a: "É uma aplicação de demonstração que ilustra um fluxo de criação de sessão para distribuição de valores entre múltiplos endereços, integrada a um provedor real de geração de endereços de pagamento.",
  },
  {
    q: "O que este projeto NÃO é?",
    a: "Não é um serviço financeiro regulamentado, não é uma carteira custodial e não oferece garantias sobre privacidade, anonimato ou rastreabilidade no nível da blockchain.",
  },
  {
    q: "É real ou simulado?",
    a: "A geração do endereço de depósito é real, feita pelo provedor de pagamentos integrado. As regras de cálculo de taxas e o fluxo de sessão são funcionais. Use somente em ambiente de testes.",
  },
  {
    q: "Quais dados são armazenados?",
    a: "Apenas metadados mínimos da sessão (moeda, valor, taxa, atraso, status, código de sessão e endereços informados) para permitir a consulta posterior do status.",
  },
  {
    q: "Quais são as limitações?",
    a: "O ambiente é destinado a demonstração. Limites de valor, moedas suportadas, disponibilidade do provedor de pagamento e janelas de atraso podem mudar sem aviso prévio.",
  },
  {
    q: "Quais moedas são aceitas?",
    a: "BTC, ETH, LTC, USDT (ERC-20) e USDC (ERC-20).",
  },
  {
    q: "É legal utilizar este tipo de fluxo?",
    a: "A regulamentação varia conforme a jurisdição. O usuário é responsável por verificar a legalidade e a adequação do uso em sua localidade.",
  },
] as const;
