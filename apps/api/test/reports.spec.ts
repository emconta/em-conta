import {
  buildBalanceSheetReport,
  buildCurrentLiquidityReport,
  buildDreReport,
  moneyToCents,
  parseDrePeriod,
} from "@api/features/reports/reports.service";
import type { AccountCategory, AccountNature } from "@api/db/schema";
import { describe, expect, it } from "vitest";

function defaultNature(category: AccountCategory): AccountNature {
  return category === "assets" || category === "expenses" ? "debit" : "credit";
}

function makeLine(
  account: {
    category: AccountCategory;
    id: number;
    name: string;
    nature?: AccountNature;
    type?: string;
  },
  line: { amount: string; type: "debit" | "credit" },
) {
  const accountType = account.type ?? defaultAccountType(account.category);

  return {
    line: {
      id: 1,
      entryId: 1,
      accountId: account.id,
      type: line.type,
      amount: line.amount,
      description: null,
    },
    entry: {
      id: 1,
      companyId: 1,
      sourceType: "manual" as const,
      sourceId: null,
      entryDate: new Date("2026-07-15T12:00:00.000Z"),
      memo: null,
      status: "posted" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    account: {
      id: account.id,
      companyId: 1,
      name: account.name,
      type: accountType,
      category: account.category,
      nature: account.nature ?? defaultNature(account.category),
      description: null,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

function defaultAccountType(category: AccountCategory): string {
  switch (category) {
    case "assets":
      return "fixed_assets";
    case "liabilities":
      return "accounts_payable";
    case "equity":
      return "capital";
    case "revenue":
      return "sales_revenue";
    case "expenses":
      return "operating_expenses";
  }
}

describe("DRE period parsing", () => {
  it("accepts valid date range", () => {
    const period = parseDrePeriod("2026-07-01", "2026-07-31");

    expect(period).not.toBeNull();
    expect(period?.dateFrom.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(period?.dateTo.toISOString()).toBe("2026-07-31T23:59:59.999Z");
  });

  it("rejects malformed dates", () => {
    expect(parseDrePeriod("2026-07-01", "not-a-date")).toBeNull();
    expect(parseDrePeriod("2026/07/01", "2026-07-31")).toBeNull();
  });

  it("rejects inverted date range", () => {
    expect(parseDrePeriod("2026-07-31", "2026-07-01")).toBeNull();
  });
});

describe("DRE report builder", () => {
  const period = { dateFrom: new Date("2026-07-01"), dateTo: new Date("2026-07-31") };

  it("returns zeros when there are no movements", () => {
    const report = buildDreReport(period, []);

    expect(report.totalRevenue).toBe("0.00");
    expect(report.totalExpenses).toBe("0.00");
    expect(report.netResult).toBe("0.00");
    expect(report.sections.map((section) => section.label)).toEqual([
      "Receita bruta",
      "Custos",
      "Despesas operacionais",
      "Resultado",
    ]);
    expect(report.sections.every((section) => section.percentOfRevenue === null)).toBe(true);
  });

  it("calculates demo DRE with sale, CMV and expense", () => {
    const report = buildDreReport(period, [
      makeLine(
        { id: 10, name: "Caixa", category: "assets" },
        { amount: "10000.00", type: "debit" },
      ),
      makeLine(
        { id: 20, name: "Receita de vendas", category: "revenue", type: "sales_revenue" },
        { amount: "10000.00", type: "credit" },
      ),
      makeLine(
        { id: 30, name: "CMV", category: "expenses", type: "cogs" },
        { amount: "4000.00", type: "debit" },
      ),
      makeLine(
        { id: 40, name: "Estoque", category: "assets" },
        { amount: "4000.00", type: "credit" },
      ),
      makeLine(
        { id: 50, name: "Despesas operacionais", category: "expenses" },
        { amount: "1000.00", type: "debit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets" },
        { amount: "1000.00", type: "credit" },
      ),
    ]);

    expect(report.totalRevenue).toBe("10000.00");
    expect(report.totalExpenses).toBe("5000.00");
    expect(report.netResult).toBe("5000.00");

    expect(report.sections).toMatchObject([
      { key: "gross_revenue", total: "10000.00", percentOfRevenue: "100.00" },
      { key: "costs", total: "4000.00", percentOfRevenue: "40.00" },
      { key: "operational_expenses", total: "1000.00", percentOfRevenue: "10.00" },
      { key: "net_result", total: "5000.00", percentOfRevenue: "50.00" },
    ]);
    expect(report.sections[0].items).toMatchObject([
      { accountName: "Receita de vendas", amount: "10000.00", percentOfRevenue: "100.00" },
    ]);
    expect(report.sections[1].items).toMatchObject([
      { accountName: "CMV", amount: "4000.00", percentOfRevenue: "40.00" },
    ]);
    expect(report.sections[2].items).toMatchObject([
      { accountName: "Despesas operacionais", amount: "1000.00", percentOfRevenue: "10.00" },
    ]);
  });

  it("keeps detailed section totals reconciled with legacy totals", () => {
    const report = buildDreReport(period, [
      makeLine(
        { id: 20, name: "Receita de vendas", category: "revenue", type: "sales_revenue" },
        { amount: "10000.00", type: "credit" },
      ),
      makeLine(
        { id: 21, name: "Receita de servicos", category: "revenue", type: "services_revenue" },
        { amount: "5000.00", type: "credit" },
      ),
      makeLine(
        { id: 30, name: "Custo de mercadorias vendidas", category: "expenses", type: "cogs" },
        { amount: "4000.00", type: "debit" },
      ),
      makeLine(
        { id: 50, name: "Aluguel", category: "expenses" },
        { amount: "1000.00", type: "debit" },
      ),
    ]);

    const [grossRevenue, costs, operationalExpenses, netResult] = report.sections;

    expect(grossRevenue.total).toBe(report.totalRevenue);
    expect(Number(costs.total) + Number(operationalExpenses.total)).toBe(
      Number(report.totalExpenses),
    );
    expect(netResult.total).toBe(report.netResult);
    expect(Number(netResult.total)).toBe(
      Number(grossRevenue.total) - Number(costs.total) - Number(operationalExpenses.total),
    );
  });

  it("uses null section percentages when gross revenue is zero", () => {
    const report = buildDreReport(period, [
      makeLine(
        { id: 50, name: "Despesas operacionais", category: "expenses" },
        { amount: "1000.00", type: "debit" },
      ),
    ]);

    expect(report.totalRevenue).toBe("0.00");
    expect(report.netResult).toBe("-1000.00");
    expect(report.sections.every((section) => section.percentOfRevenue === null)).toBe(true);
    expect(report.sections[2].items[0].percentOfRevenue).toBeNull();
  });

  it("reduces revenue with debits and expenses with credits", () => {
    const report = buildDreReport(period, [
      makeLine(
        { id: 20, name: "Receita de vendas", category: "revenue" },
        { amount: "10000.00", type: "credit" },
      ),
      makeLine(
        { id: 20, name: "Receita de vendas", category: "revenue" },
        { amount: "2000.00", type: "debit" },
      ),
      makeLine(
        { id: 50, name: "Despesas operacionais", category: "expenses" },
        { amount: "3000.00", type: "debit" },
      ),
      makeLine(
        { id: 50, name: "Despesas operacionais", category: "expenses" },
        { amount: "500.00", type: "credit" },
      ),
    ]);

    expect(report.totalRevenue).toBe("8000.00");
    expect(report.totalExpenses).toBe("2500.00");
    expect(report.netResult).toBe("5500.00");
  });

  it("returns negative net result for loss", () => {
    const report = buildDreReport(period, [
      makeLine(
        { id: 20, name: "Receita de vendas", category: "revenue" },
        { amount: "2000.00", type: "credit" },
      ),
      makeLine(
        { id: 50, name: "Despesas operacionais", category: "expenses" },
        { amount: "3000.00", type: "debit" },
      ),
    ]);

    expect(report.totalRevenue).toBe("2000.00");
    expect(report.totalExpenses).toBe("3000.00");
    expect(report.netResult).toBe("-1000.00");
    expect(report.sections[3]).toMatchObject({
      key: "net_result",
      total: "-1000.00",
      percentOfRevenue: "-50.00",
    });
  });

  it("groups breakdown by account", () => {
    const report = buildDreReport(period, [
      makeLine(
        { id: 21, name: "Receita de servicos", category: "revenue" },
        { amount: "3000.00", type: "credit" },
      ),
      makeLine(
        { id: 20, name: "Receita de vendas", category: "revenue" },
        { amount: "7000.00", type: "credit" },
      ),
      makeLine(
        { id: 50, name: "Despesas operacionais", category: "expenses" },
        { amount: "1000.00", type: "debit" },
      ),
    ]);

    expect(report.revenueBreakdown).toHaveLength(2);
    expect(report.expenseBreakdown).toHaveLength(1);
    expect(report.revenueBreakdown.find((item) => item.accountId === 20)?.amount).toBe("7000.00");
    expect(report.revenueBreakdown.find((item) => item.accountId === 21)?.amount).toBe("3000.00");
  });

  it("ignores non-revenue and non-expense accounts", () => {
    const report = buildDreReport(period, [
      makeLine({ id: 10, name: "Caixa", category: "assets" }, { amount: "1000.00", type: "debit" }),
      makeLine(
        { id: 20, name: "Receita de vendas", category: "revenue" },
        { amount: "1000.00", type: "credit" },
      ),
    ]);

    expect(report.totalRevenue).toBe("1000.00");
    expect(report.totalExpenses).toBe("0.00");
    expect(report.netResult).toBe("1000.00");
    expect(report.revenueBreakdown).toHaveLength(1);
    expect(report.expenseBreakdown).toHaveLength(0);
  });
});

describe("Balance Sheet report builder", () => {
  const period = { dateFrom: new Date("2026-07-01"), dateTo: new Date("2026-07-31") };

  it("returns empty balanced report when there are no movements", () => {
    const report = buildBalanceSheetReport(period, [], []);

    expect(report.assets.total).toBe("0.00");
    expect(report.liabilities.total).toBe("0.00");
    expect(report.equity.total).toBe("0.00");
    expect(report.totalLiabilitiesAndEquity).toBe("0.00");
    expect(report.isBalanced).toBe(true);
  });

  it("calculates demo balance sheet with sale, CMV and expense", () => {
    const balanceSheetRows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "10000.00", type: "debit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "4000.00", type: "credit" },
      ),
      makeLine(
        { id: 40, name: "Estoque", category: "assets", type: "inventory" },
        { amount: "4000.00", type: "debit" },
      ),
      makeLine(
        { id: 40, name: "Estoque", category: "assets", type: "inventory" },
        { amount: "4000.00", type: "credit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "1000.00", type: "credit" },
      ),
    ];

    const dreRows = [
      makeLine(
        { id: 20, name: "Receita de vendas", category: "revenue", type: "sales_revenue" },
        { amount: "10000.00", type: "credit" },
      ),
      makeLine(
        { id: 30, name: "CMV", category: "expenses", type: "cogs" },
        { amount: "4000.00", type: "debit" },
      ),
      makeLine(
        { id: 50, name: "Despesas operacionais", category: "expenses" },
        { amount: "1000.00", type: "debit" },
      ),
    ];

    const report = buildBalanceSheetReport(period, balanceSheetRows, dreRows);

    expect(report.assets.total).toBe("5000.00");
    expect(report.liabilities.total).toBe("0.00");
    expect(report.equity.total).toBe("5000.00");
    expect(report.totalLiabilitiesAndEquity).toBe("5000.00");
    expect(report.isBalanced).toBe(true);
    expect(report.assets.items.find((item) => item.accountId === 10)?.amount).toBe("5000.00");
    expect(
      report.equity.items.find((item) => item.accountName === "Resultado do período")?.amount,
    ).toBe("5000.00");
  });

  it("includes initial capital in equity", () => {
    const balanceSheetRows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "2000.00", type: "debit" },
      ),
      makeLine(
        { id: 60, name: "Capital social", category: "equity" },
        { amount: "2000.00", type: "credit" },
      ),
    ];

    const report = buildBalanceSheetReport(period, balanceSheetRows, []);

    expect(report.assets.total).toBe("2000.00");
    expect(report.equity.total).toBe("2000.00");
    expect(report.isBalanced).toBe(true);
  });

  it("excludes zero-balance accounts", () => {
    const balanceSheetRows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "1000.00", type: "debit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "1000.00", type: "credit" },
      ),
    ];

    const report = buildBalanceSheetReport(period, balanceSheetRows, []);

    expect(report.assets.items).toHaveLength(0);
    expect(report.assets.total).toBe("0.00");
    expect(report.assets.subgroups.every((subgroup) => subgroup.items.length === 0)).toBe(true);
  });

  it("classifies assets and liabilities into current and non-current subgroups", () => {
    const balanceSheetRows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "5000.00", type: "debit" },
      ),
      makeLine(
        { id: 40, name: "Estoque", category: "assets", type: "inventory" },
        { amount: "4000.00", type: "debit" },
      ),
      makeLine(
        { id: 70, name: "Imobilizado", category: "assets", type: "fixed_assets" },
        { amount: "20000.00", type: "debit" },
      ),
      makeLine(
        { id: 55, name: "Fornecedores a pagar", category: "liabilities", type: "accounts_payable" },
        { amount: "2000.00", type: "credit" },
      ),
      makeLine(
        { id: 56, name: "Empréstimos a pagar", category: "liabilities", type: "loans_payable" },
        { amount: "10000.00", type: "credit" },
      ),
      makeLine(
        { id: 60, name: "Capital social", category: "equity" },
        { amount: "17000.00", type: "credit" },
      ),
    ];

    const report = buildBalanceSheetReport(period, balanceSheetRows, []);

    const [currentAssets, nonCurrentAssets] = report.assets.subgroups;
    const [currentLiabilities, nonCurrentLiabilities] = report.liabilities.subgroups;

    expect(currentAssets.total).toBe("9000.00");
    expect(currentAssets.items).toHaveLength(2);
    expect(nonCurrentAssets.total).toBe("20000.00");
    expect(nonCurrentAssets.items).toHaveLength(1);

    expect(currentLiabilities.total).toBe("12000.00");
    expect(currentLiabilities.items).toHaveLength(2);
    expect(nonCurrentLiabilities.total).toBe("0.00");
    expect(nonCurrentLiabilities.items).toHaveLength(0);

    expect(report.assets.total).toBe("29000.00");
    expect(report.liabilities.total).toBe("12000.00");
    expect(report.equity.total).toBe("17000.00");
    expect(report.isBalanced).toBe(true);
  });

  it("reconciles subgroup totals with group totals", () => {
    const balanceSheetRows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "3000.00", type: "debit" },
      ),
      makeLine(
        { id: 70, name: "Imobilizado", category: "assets", type: "fixed_assets" },
        { amount: "7000.00", type: "debit" },
      ),
      makeLine(
        { id: 55, name: "Fornecedores a pagar", category: "liabilities", type: "accounts_payable" },
        { amount: "1500.00", type: "credit" },
      ),
      makeLine(
        { id: 56, name: "Empréstimos a pagar", category: "liabilities", type: "loans_payable" },
        { amount: "2500.00", type: "credit" },
      ),
    ];

    const report = buildBalanceSheetReport(period, balanceSheetRows, []);

    const assetsSubgroupTotal = report.assets.subgroups.reduce(
      (sum, subgroup) => sum + moneyToCents(subgroup.total),
      0n,
    );
    const liabilitiesSubgroupTotal = report.liabilities.subgroups.reduce(
      (sum, subgroup) => sum + moneyToCents(subgroup.total),
      0n,
    );

    expect(assetsSubgroupTotal).toBe(moneyToCents(report.assets.total));
    expect(liabilitiesSubgroupTotal).toBe(moneyToCents(report.liabilities.total));
  });

  it("classifies asset keys as non-current and liability keys as current by default", () => {
    const balanceSheetRows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "1000.00", type: "debit" },
      ),
      makeLine(
        { id: 71, name: "Ativo sem chave", category: "assets" },
        { amount: "2000.00", type: "debit" },
      ),
      makeLine(
        { id: 72, name: "Ativo intangível", category: "assets", type: "intangible_assets" },
        { amount: "3000.00", type: "debit" },
      ),
      makeLine(
        { id: 55, name: "Passivo sem chave", category: "liabilities" },
        { amount: "1000.00", type: "credit" },
      ),
      makeLine(
        { id: 60, name: "Capital social", category: "equity" },
        { amount: "5000.00", type: "credit" },
      ),
    ];

    const report = buildBalanceSheetReport(period, balanceSheetRows, []);
    const [currentAssets, nonCurrentAssets] = report.assets.subgroups;
    const [currentLiabilities, nonCurrentLiabilities] = report.liabilities.subgroups;

    expect(currentAssets.items).toHaveLength(1);
    expect(nonCurrentAssets.items).toHaveLength(2);
    expect(currentLiabilities.items).toHaveLength(1);
    expect(nonCurrentLiabilities.items).toHaveLength(0);
    expect(report.equity.subgroups).toHaveLength(0);
    expect(report.isBalanced).toBe(true);
  });

  it("keeps balance sheet cumulative while resultado uses only the period", () => {
    const balanceSheetRows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "1000.00", type: "debit" },
      ),
      makeLine(
        { id: 60, name: "Capital social", category: "equity" },
        { amount: "1000.00", type: "credit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "500.00", type: "credit" },
      ),
    ];

    const dreRows = [
      makeLine(
        { id: 50, name: "Despesas operacionais", category: "expenses" },
        { amount: "500.00", type: "debit" },
      ),
    ];

    const report = buildBalanceSheetReport(period, balanceSheetRows, dreRows);

    expect(report.assets.total).toBe("500.00");
    expect(report.equity.total).toBe("500.00");
    expect(report.isBalanced).toBe(true);
  });

  it("handles net loss reducing equity", () => {
    const balanceSheetRows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "2000.00", type: "debit" },
      ),
      makeLine(
        { id: 60, name: "Capital social", category: "equity" },
        { amount: "2000.00", type: "credit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "3000.00", type: "credit" },
      ),
    ];

    const dreRows = [
      makeLine(
        { id: 20, name: "Receita de vendas", category: "revenue" },
        { amount: "2000.00", type: "credit" },
      ),
      makeLine(
        { id: 50, name: "Despesas operacionais", category: "expenses" },
        { amount: "5000.00", type: "debit" },
      ),
    ];

    const report = buildBalanceSheetReport(period, balanceSheetRows, dreRows);

    expect(report.assets.total).toBe("-1000.00");
    expect(report.equity.total).toBe("-1000.00");
    expect(report.totalLiabilitiesAndEquity).toBe("-1000.00");
    expect(report.isBalanced).toBe(true);
    expect(
      report.equity.items.find((item) => item.accountName === "Resultado do período")?.amount,
    ).toBe("-3000.00");
  });
});

describe("Current Liquidity report builder", () => {
  const dateTo = new Date("2026-07-31");

  it("returns N/A when there are no movements", () => {
    const report = buildCurrentLiquidityReport({ dateTo, rows: [] });

    expect(report.currentAssets).toBe("0.00");
    expect(report.currentLiabilities).toBe("0.00");
    expect(report.ratio).toBeNull();
    expect(report.hasCurrentLiabilities).toBe(false);
    expect(report.display).toBe("N/A");
  });

  it("calculates demo liquidity after sale, CMV and expense", () => {
    const rows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "10000.00", type: "debit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "4000.00", type: "credit" },
      ),
      makeLine(
        { id: 40, name: "Estoque", category: "assets", type: "inventory" },
        { amount: "4000.00", type: "debit" },
      ),
      makeLine(
        { id: 40, name: "Estoque", category: "assets", type: "inventory" },
        { amount: "4000.00", type: "credit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "1000.00", type: "credit" },
      ),
      makeLine(
        { id: 55, name: "Fornecedores a pagar", category: "liabilities" },
        { amount: "2000.00", type: "credit" },
      ),
    ];

    const report = buildCurrentLiquidityReport({ dateTo, rows });

    expect(report.currentAssets).toBe("5000.00");
    expect(report.currentLiabilities).toBe("2000.00");
    expect(report.ratio).toBe("2.50");
    expect(report.hasCurrentLiabilities).toBe(true);
    expect(report.display).toBe("2.50");
  });

  it("returns N/A when current liabilities are zero", () => {
    const rows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "5000.00", type: "debit" },
      ),
    ];

    const report = buildCurrentLiquidityReport({ dateTo, rows });

    expect(report.currentAssets).toBe("5000.00");
    expect(report.currentLiabilities).toBe("0.00");
    expect(report.ratio).toBeNull();
    expect(report.hasCurrentLiabilities).toBe(false);
    expect(report.display).toBe("N/A");
  });

  it("ignores equity, revenue and expense accounts", () => {
    const rows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "5000.00", type: "debit" },
      ),
      makeLine(
        { id: 60, name: "Capital social", category: "equity" },
        { amount: "5000.00", type: "credit" },
      ),
      makeLine(
        { id: 20, name: "Receita de vendas", category: "revenue" },
        { amount: "1000.00", type: "credit" },
      ),
      makeLine(
        { id: 50, name: "Despesas operacionais", category: "expenses" },
        { amount: "1000.00", type: "debit" },
      ),
      makeLine(
        { id: 55, name: "Fornecedores a pagar", category: "liabilities" },
        { amount: "2000.00", type: "credit" },
      ),
    ];

    const report = buildCurrentLiquidityReport({ dateTo, rows });

    expect(report.currentAssets).toBe("5000.00");
    expect(report.currentLiabilities).toBe("2000.00");
    expect(report.ratio).toBe("2.50");
  });

  it("respects account nature when calculating balances", () => {
    const rows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash", nature: "debit" },
        { amount: "1000.00", type: "debit" },
      ),
      makeLine(
        { id: 55, name: "Fornecedores a pagar", category: "liabilities", nature: "credit" },
        { amount: "500.00", type: "credit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash", nature: "debit" },
        { amount: "300.00", type: "credit" },
      ),
      makeLine(
        { id: 55, name: "Fornecedores a pagar", category: "liabilities", nature: "credit" },
        { amount: "200.00", type: "debit" },
      ),
    ];

    const report = buildCurrentLiquidityReport({ dateTo, rows });

    expect(report.currentAssets).toBe("700.00");
    expect(report.currentLiabilities).toBe("300.00");
    expect(report.ratio).toBe("2.33");
  });

  it("returns N/A when current liabilities are negative", () => {
    const rows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "1000.00", type: "debit" },
      ),
      makeLine(
        { id: 55, name: "Fornecedores a pagar", category: "liabilities" },
        { amount: "500.00", type: "debit" },
      ),
    ];

    const report = buildCurrentLiquidityReport({ dateTo, rows });

    expect(report.currentAssets).toBe("1000.00");
    expect(report.currentLiabilities).toBe("-500.00");
    expect(report.ratio).toBeNull();
    expect(report.hasCurrentLiabilities).toBe(false);
    expect(report.display).toBe("N/A");
  });

  it("truncates ratio to two decimal places", () => {
    const rows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "100.00", type: "debit" },
      ),
      makeLine(
        { id: 55, name: "Fornecedores a pagar", category: "liabilities" },
        { amount: "300.00", type: "credit" },
      ),
    ];

    const report = buildCurrentLiquidityReport({ dateTo, rows });

    expect(report.ratio).toBe("0.33");
  });
});
