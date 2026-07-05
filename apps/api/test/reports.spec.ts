import {
  buildBalanceSheetReport,
  buildDreReport,
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
    key?: string;
    name: string;
    nature?: AccountNature;
  },
  line: { amount: string; type: "debit" | "credit" },
) {
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
      key: account.key ?? null,
      category: account.category,
      nature: account.nature ?? defaultNature(account.category),
      description: null,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
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
  });

  it("calculates demo DRE with sale, CMV and expense", () => {
    const report = buildDreReport(period, [
      makeLine(
        { id: 10, name: "Caixa", category: "assets" },
        { amount: "10000.00", type: "debit" },
      ),
      makeLine(
        { id: 20, name: "Receita de vendas", category: "revenue", key: "sales_revenue" },
        { amount: "10000.00", type: "credit" },
      ),
      makeLine(
        { id: 30, name: "CMV", category: "expenses", key: "cogs" },
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
        { id: 10, name: "Caixa", category: "assets", key: "cash" },
        { amount: "10000.00", type: "debit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", key: "cash" },
        { amount: "4000.00", type: "credit" },
      ),
      makeLine(
        { id: 40, name: "Estoque", category: "assets", key: "inventory" },
        { amount: "4000.00", type: "debit" },
      ),
      makeLine(
        { id: 40, name: "Estoque", category: "assets", key: "inventory" },
        { amount: "4000.00", type: "credit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", key: "cash" },
        { amount: "1000.00", type: "credit" },
      ),
    ];

    const dreRows = [
      makeLine(
        { id: 20, name: "Receita de vendas", category: "revenue", key: "sales_revenue" },
        { amount: "10000.00", type: "credit" },
      ),
      makeLine(
        { id: 30, name: "CMV", category: "expenses", key: "cogs" },
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
        { id: 10, name: "Caixa", category: "assets", key: "cash" },
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
        { id: 10, name: "Caixa", category: "assets", key: "cash" },
        { amount: "1000.00", type: "debit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", key: "cash" },
        { amount: "1000.00", type: "credit" },
      ),
    ];

    const report = buildBalanceSheetReport(period, balanceSheetRows, []);

    expect(report.assets.items).toHaveLength(0);
    expect(report.assets.total).toBe("0.00");
  });

  it("keeps balance sheet cumulative while resultado uses only the period", () => {
    const balanceSheetRows = [
      makeLine(
        { id: 10, name: "Caixa", category: "assets", key: "cash" },
        { amount: "1000.00", type: "debit" },
      ),
      makeLine(
        { id: 60, name: "Capital social", category: "equity" },
        { amount: "1000.00", type: "credit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", key: "cash" },
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
        { id: 10, name: "Caixa", category: "assets", key: "cash" },
        { amount: "2000.00", type: "debit" },
      ),
      makeLine(
        { id: 60, name: "Capital social", category: "equity" },
        { amount: "2000.00", type: "credit" },
      ),
      makeLine(
        { id: 10, name: "Caixa", category: "assets", key: "cash" },
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
