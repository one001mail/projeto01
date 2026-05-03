export const MIXING_COPY = {
  create: {
    title: "Criar",
    titleAccent: "Sessão",
    subtitle: "Configure os parâmetros da sessão. Todos os campos são obrigatórios.",
    submitIdle: "Criar Sessão",
    submitSubmitting: "Processando...",
    errorToastTitle: "Não foi possível criar a sessão",
    successToastTitle: "Sessão criada",
  },
  lookup: {
    title: "Consultar",
    titleAccent: "Sessão",
    subtitle: "Insira o código da sessão para verificar o status atual.",
    codeLabel: "Código da Sessão",
    codePlaceholder: "MIX-XXXXXXXX-XXXX",
    emptyCodeError: "Informe o código da sessão.",
    notFoundError: "Sessão não encontrada.",
  },
  complete: {
    title: "Sessão de Mix Criada",
    subtitle: "Envie os fundos para o endereço de depósito abaixo para iniciar o mixing.",
    depositLabel: (currency: string) => `ENDEREÇO DE DEPÓSITO (${currency})`,
    resetCta: "Nova Sessão de Mix",
  },
} as const;
