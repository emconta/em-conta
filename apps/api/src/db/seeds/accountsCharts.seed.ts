import Database from "@api/db/database";
import { accountsCharts, type InsertAccountsChart } from "@api/db/schema";
import { Effect } from "effect";

const chart = {
  assets: [
    {
      name: "Disponibilidades",
      nature: "debit",
      description: "Recursos com liquidez imediata ou quase imediata.",
      children: [
        {
          name: "Caixa",
          nature: "debit",
          description: "Valores em especie para pequenas despesas.",
        },
        {
          name: "Banco conta movimento",
          nature: "debit",
          description: "Saldo em conta corrente usado na operacao diaria.",
        },
        {
          name: "Aplicacoes financeiras",
          nature: "debit",
          description: "Reservas de curto prazo e investimentos liquidos.",
        },
      ],
    },
    {
      name: "Clientes a receber",
      nature: "debit",
      description: "Vendas ou servicos faturados ainda nao recebidos.",
    },
    {
      name: "Estoque",
      nature: "debit",
      description: "Mercadorias ou insumos disponiveis para venda ou consumo.",
    },
    {
      name: "Adiantamentos",
      nature: "debit",
      description: "Valores pagos antecipadamente a fornecedores ou terceiros.",
    },
  ],
  liabilities: [
    {
      name: "Fornecedores a pagar",
      nature: "credit",
      description: "Compras e servicos contratados ainda nao pagos.",
    },
    {
      name: "Impostos a recolher",
      nature: "credit",
      description: "Tributos incidentes sobre a operacao que aguardam pagamento.",
    },
    {
      name: "Pro-labore a pagar",
      nature: "credit",
      description: "Valor do pro-labore definido e ainda nao pago.",
    },
    {
      name: "Despesas operacionais a pagar",
      nature: "credit",
      description: "Contas recorrentes vencidas ou a vencer no curto prazo.",
    },
    {
      name: "Emprestimos",
      nature: "credit",
      description: "Financiamentos e emprestimos assumidos pelo negocio.",
    },
  ],
  equity: [
    {
      name: "Capital investido",
      nature: "credit",
      description: "Aportes realizados pelo proprietario no negocio.",
    },
    {
      name: "Lucros acumulados",
      nature: "credit",
      description: "Resultado positivo mantido na empresa ao longo do tempo.",
    },
    {
      name: "Retiradas do proprietario",
      nature: "debit",
      description: "Saques do proprietario fora do fluxo de despesas operacionais.",
    },
  ],
  revenue: [
    {
      name: "Receita de vendas",
      nature: "credit",
      description: "Entradas oriundas da venda de produtos.",
    },
    {
      name: "Receita de servicos",
      nature: "credit",
      description: "Entradas oriundas da prestacao de servicos.",
    },
    {
      name: "Outras receitas",
      nature: "credit",
      description: "Ganhos eventuais que nao fazem parte da atividade principal.",
    },
  ],
  expenses: [
    {
      name: "Custos diretos",
      nature: "debit",
      description: "Custos diretamente ligados a venda ou entrega do produto e servico.",
      children: [
        {
          name: "Custo de mercadorias vendidas",
          nature: "debit",
          description: "Custo dos produtos revendidos ou produzidos.",
        },
        {
          name: "Custo dos servicos prestados",
          nature: "debit",
          description: "Gastos diretamente ligados a entrega do servico.",
        },
      ],
    },
    {
      name: "Despesas administrativas",
      nature: "debit",
      description: "Gastos de suporte e manutencao da operacao.",
      children: [
        { name: "Aluguel", nature: "debit", description: null },
        { name: "Agua e energia", nature: "debit", description: null },
        { name: "Internet e telefone", nature: "debit", description: null },
        { name: "Material de escritorio", nature: "debit", description: null },
        { name: "Software e assinaturas", nature: "debit", description: null },
      ],
    },
    {
      name: "Marketing",
      nature: "debit",
      description: "Investimentos em divulgacao e captacao de clientes.",
    },
    {
      name: "Honorarios contabeis",
      nature: "debit",
      description: "Servicos de contabilidade e apoio fiscal.",
    },
    {
      name: "Tarifas bancarias",
      nature: "debit",
      description: "Custos de manutencao e uso de servicos bancarios.",
    },
    {
      name: "Impostos e taxas",
      nature: "debit",
      description: "Tributos e taxas incidentes no funcionamento do negocio.",
    },
    {
      name: "Transporte e deslocamento",
      nature: "debit",
      description: "Custos com locomocao, fretes e entregas.",
    },
    {
      name: "Pro-labore",
      nature: "debit",
      description: "Remuneracao mensal do proprietario pelo trabalho prestado.",
    },
    {
      name: "Outras despesas operacionais",
      nature: "debit",
      description: "Gastos recorrentes que nao se encaixam nas demais categorias.",
    },
  ],
} satisfies InsertAccountsChart["chart"];

export const simpleAccountsChart = {
  name: "Plano de Contas Simples",
  description: "Plano de contas inicial para autonomo, MEI ou empreendedor individual.",
  chart,
} satisfies InsertAccountsChart;

export const seedSimpleAccountsChart = Effect.gen(function* () {
  const db = yield* Database;

  const existingChart = yield* db.execute((q) =>
    q.query.accountsCharts.findFirst({
      where(fields, operators) {
        return operators.eq(fields.name, simpleAccountsChart.name);
      },
    }),
  );

  if (existingChart) {
    yield* Effect.logInfo(
      `Plano de contas "${simpleAccountsChart.name}" ja existe. Seed ignorado.`,
    );

    return {
      chart: existingChart,
      created: false,
    } as const;
  }

  const insertedChart = yield* db
    .execute((q) => q.insert(accountsCharts).values(simpleAccountsChart).returning())
    .pipe(
      Effect.flatMap((charts) => {
        const chart = charts[0];

        if (!chart) {
          return Effect.fail(new Error("Accounts chart insert returned no rows."));
        }

        return Effect.succeed(chart);
      }),
    );

  yield* Effect.logInfo(`Plano de contas "${simpleAccountsChart.name}" criado com sucesso.`);

  return {
    chart: insertedChart,
    created: true,
  } as const;
});
