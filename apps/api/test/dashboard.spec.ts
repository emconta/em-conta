import { buildDashboardSummary } from "@api/features/dashboard/dashboard.service";
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

function buildSummary(
  balanceSheetRows: ReturnType<typeof makeLine>[],
  dreRows: ReturnType<typeof makeLine>[],
) {
  return buildDashboardSummary({
    period: { dateFrom: new Date("2026-07-01"), dateTo: new Date("2026-07-31") },
    balanceSheetRows,
    dreRows,
  });
}

describe("Dashboard summary builder", () => {
  it("returns zeros and N/A when there are no movements", () => {
    const summary = buildSummary([], []);

    expect(summary.cashAndBank).toBe("0.00");
    expect(summary.dre.totalRevenue).toBe("0.00");
    expect(summary.dre.totalExpenses).toBe("0.00");
    expect(summary.dre.netResult).toBe("0.00");
    expect(summary.liquidity.display).toBe("—");
    expect(summary.liquidity.ratio).toBeNull();
  });

  it("calculates demo dashboard after purchase, sale, CMV and expense", () => {
    const balanceSheetRows = [
      makeLine(
        { id: 40, name: "Estoque", category: "assets", type: "inventory" },
        { amount: "4000.00", type: "debit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "4000.00", type: "credit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "10000.00", type: "debit" },
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

    const summary = buildSummary(balanceSheetRows, dreRows);

    expect(summary.cashAndBank).toBe("5000.00");
    expect(summary.dre.totalRevenue).toBe("10000.00");
    expect(summary.dre.totalExpenses).toBe("5000.00");
    expect(summary.dre.netResult).toBe("5000.00");
    expect(Number(summary.dre.netResult)).toBe(
      Number(summary.dre.totalRevenue) - Number(summary.dre.totalExpenses),
    );
    expect(summary.liquidity.display).toBe("—");
  });

  it("returns a signed net result from DRE totals for the dashboard card", () => {
    const dreRows = [
      makeLine(
        { id: 20, name: "Receita de vendas", category: "revenue", type: "sales_revenue" },
        { amount: "2000.00", type: "credit" },
      ),
      makeLine(
        { id: 50, name: "Despesas operacionais", category: "expenses" },
        { amount: "5000.00", type: "debit" },
      ),
    ];

    const summary = buildSummary([], dreRows);

    expect(summary.dre.totalRevenue).toBe("2000.00");
    expect(summary.dre.totalExpenses).toBe("5000.00");
    expect(summary.dre.netResult).toBe("-3000.00");
    expect(Number(summary.dre.netResult)).toBe(
      Number(summary.dre.totalRevenue) - Number(summary.dre.totalExpenses),
    );
  });

  it("includes bank_checking in cash and bank balance", () => {
    const balanceSheetRows = [
      makeLine(
        { id: 11, name: "Banco", category: "assets", type: "bank_checking" },
        { amount: "3000.00", type: "debit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "2000.00", type: "debit" },
      ),
    ];

    const summary = buildSummary(balanceSheetRows, []);

    expect(summary.cashAndBank).toBe("5000.00");
  });

  it("ignores inventory and receivables in cash and bank", () => {
    const balanceSheetRows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "1000.00", type: "debit" },
      ),
      makeLine(
        { id: 40, name: "Estoque", category: "assets", type: "inventory" },
        { amount: "4000.00", type: "debit" },
      ),
      makeLine(
        { id: 60, name: "Clientes", category: "assets", type: "accounts_receivable" },
        { amount: "2000.00", type: "debit" },
      ),
    ];

    const summary = buildSummary(balanceSheetRows, []);

    expect(summary.cashAndBank).toBe("1000.00");
  });

  it("calculates liquidity when liabilities exist", () => {
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
        { id: 55, name: "Fornecedores", category: "liabilities" },
        { amount: "2000.00", type: "credit" },
      ),
    ];

    const summary = buildSummary(balanceSheetRows, []);

    expect(summary.liquidity.display).toBe("4.50");
    expect(summary.liquidity.ratio).toBe("4.50");
  });

  it("allows negative cash and bank balance", () => {
    const balanceSheetRows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "1000.00", type: "debit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", type: "cash" },
        { amount: "2500.00", type: "credit" },
      ),
    ];

    const summary = buildSummary(balanceSheetRows, []);

    expect(summary.cashAndBank).toBe("-1500.00");
  });
});
