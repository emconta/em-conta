import Database from "@api/db/database";
import { accountsCharts, type InsertAccountsChart } from "@api/db/schema";
import { Effect } from "effect";

const chart = {
  assets: [
    {
      name: "Disponibilidades",
      type: "cash",
      nature: "debit",
      description: "Recursos com liquidez imediata ou quase imediata.",
      children: [
        {
          name: "Caixa",
          type: "cash",
          nature: "debit",
          description: "Valores em especie para pequenas despesas.",
        },
        {
          name: "Banco conta movimento",
          type: "bank_checking",
          nature: "debit",
          description: "Saldo em conta corrente usado na operacao diaria.",
        },
        {
          name: "Aplicacoes financeiras",
          type: "short_term_investments",
          nature: "debit",
          description: "Reservas de curto prazo e investimentos liquidos.",
        },
      ],
    },
    {
      name: "Clientes a receber",
      type: "accounts_receivable",
      nature: "debit",
      description: "Vendas ou servicos faturados ainda nao recebidos.",
    },
    {
      name: "Estoque",
      type: "inventory",
      nature: "debit",
      description: "Mercadorias ou insumos disponiveis para venda ou consumo.",
    },
    {
      name: "Adiantamentos",
      type: "prepaid_expenses",
      nature: "debit",
      description: "Valores pagos antecipadamente a fornecedores ou terceiros.",
    },
  ],
  liabilities: [
    {
      name: "Fornecedores a pagar",
      type: "accounts_payable",
      nature: "credit",
      description: "Compras e servicos contratados ainda nao pagos.",
    },
    {
      name: "Impostos a recolher",
      type: "taxes_payable",
      nature: "credit",
      description: "Tributos incidentes sobre a operacao que aguardam pagamento.",
    },
    {
      name: "Pro-labore a pagar",
      type: "salaries_payable",
      nature: "credit",
      description: "Valor do pro-labore definido e ainda nao pago.",
    },
    {
      name: "Despesas operacionais a pagar",
      type: "expenses_payable",
      nature: "credit",
      description: "Contas recorrentes vencidas ou a vencer no curto prazo.",
    },
    {
      name: "Emprestimos",
      type: "loans_payable",
      nature: "credit",
      description: "Financiamentos e emprestimos assumidos pelo negocio.",
    },
  ],
  equity: [
    {
      name: "Capital investido",
      type: "capital",
      nature: "credit",
      description: "Aportes realizados pelo proprietario no negocio.",
    },
    {
      name: "Lucros acumulados",
      type: "retained_earnings",
      nature: "credit",
      description: "Resultado positivo mantido na empresa ao longo do tempo.",
    },
    {
      name: "Retiradas do proprietario",
      type: "owner_withdrawals",
      nature: "debit",
      description: "Saques do proprietario fora do fluxo de despesas operacionais.",
    },
  ],
  revenue: [
    {
      name: "Receita de vendas",
      type: "sales_revenue",
      nature: "credit",
      description: "Entradas oriundas da venda de produtos.",
    },
    {
      name: "Receita de servicos",
      type: "services_revenue",
      nature: "credit",
      description: "Entradas oriundas da prestacao de servicos.",
    },
    {
      name: "Outras receitas",
      type: "other_revenue",
      nature: "credit",
      description: "Ganhos eventuais que nao fazem parte da atividade principal.",
    },
  ],
  expenses: [
    {
      name: "Custos diretos",
      type: "cogs",
      nature: "debit",
      description: "Custos diretamente ligados a venda ou entrega do produto e servico.",
      children: [
        {
          name: "Custo de mercadorias vendidas",
          type: "cogs",
          nature: "debit",
          description: "Custo dos produtos revendidos ou produzidos.",
        },
        {
          name: "Custo dos servicos prestados",
          type: "cost_of_services",
          nature: "debit",
          description: "Gastos diretamente ligados a entrega do servico.",
        },
      ],
    },
    {
      name: "Despesas administrativas",
      type: "operating_expenses",
      nature: "debit",
      description: "Gastos de suporte e manutencao da operacao.",
      children: [
        { name: "Aluguel", type: "operating_expenses", nature: "debit", description: null },
        { name: "Agua e energia", type: "operating_expenses", nature: "debit", description: null },
        {
          name: "Internet e telefone",
          type: "operating_expenses",
          nature: "debit",
          description: null,
        },
        {
          name: "Material de escritorio",
          type: "operating_expenses",
          nature: "debit",
          description: null,
        },
        {
          name: "Software e assinaturas",
          type: "operating_expenses",
          nature: "debit",
          description: null,
        },
      ],
    },
    {
      name: "Marketing",
      type: "marketing_expenses",
      nature: "debit",
      description: "Investimentos em divulgacao e captacao de clientes.",
    },
    {
      name: "Honorarios contabeis",
      type: "operating_expenses",
      nature: "debit",
      description: "Servicos de contabilidade e apoio fiscal.",
    },
    {
      name: "Tarifas bancarias",
      type: "operating_expenses",
      nature: "debit",
      description: "Custos de manutencao e uso de servicos bancarios.",
    },
    {
      name: "Impostos e taxas",
      type: "operating_expenses",
      nature: "debit",
      description: "Tributos e taxas incidentes no funcionamento do negocio.",
    },
    {
      name: "Transporte e deslocamento",
      type: "operating_expenses",
      nature: "debit",
      description: "Custos com locomocao, fretes e entregas.",
    },
    {
      name: "Pro-labore",
      type: "operating_expenses",
      nature: "debit",
      description: "Remuneracao mensal do proprietario pelo trabalho prestado.",
    },
    {
      name: "Outras despesas operacionais",
      type: "other_expenses",
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
