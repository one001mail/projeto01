export const FEES_COPY = {
  title: "Tabela de",
  titleAccent: "Taxas",
  subtitle: "A taxa varia por faixa de valor. Não há cobranças adicionais ocultas.",
  calc: {
    heading: "Calculadora de Taxa",
    sub: "Estime o custo da sua operação",
    currencyLabel: "Moeda",
    amountLabel: (currency: string) => `Valor (${currency})`,
    resultHeading: "Resultado",
    rate: "Taxa Aplicada",
    fee: "Valor da Taxa",
    net: "Você Recebe",
  },
  table: {
    range: "Faixa de Valor",
    fee: "Taxa",
    min: "Taxa Mínima",
  },
  formula: "taxa = max(valor × percentual, taxa_minima)",
} as const;
