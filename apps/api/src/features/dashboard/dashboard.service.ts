import CompaniesRepo from "@api/features/companies/companies.repo";
import ReportsRepo, { type MonthlyRevenueExpensesRow } from "@api/features/reports/reports.repo";
import {
  buildCurrentLiquidityReport,
  buildDreReport,
  moneyFromCents,
  moneyToCents,
  parseDrePeriod,
  type ReportLineWithAccount,
} from "@api/features/reports/reports.service";
import type { DashboardDto, MonthlyRevenueExpensesDto } from "@dto/dashboard.dto";
import { Data, Effect } from "effect";

export class DashboardService extends Effect.Service<DashboardService>()("DashboardService", {
  effect: Effect.gen(function* () {
    const companiesRepo = yield* CompaniesRepo;
    const reportsRepo = yield* ReportsRepo;

    function getSummaryForUser({ userId }: { userId: string }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId });

        if (!company) {
          return yield* Effect.fail(new DashboardServiceError({ code: "COMPANY_NOT_FOUND" }));
        }

        const today = getToday();
        const monthStart = getMonthStart(today);
        const period = parseDrePeriod(monthStart, today);

        if (!period) {
          return yield* Effect.fail(new DashboardServiceError({ code: "INVALID_PERIOD" }));
        }

        const [balanceSheetRows, dreRows] = yield* Effect.all([
          reportsRepo.listPostedLinesUpToDate({
            companyId: company.id,
            categories: ["assets", "liabilities"],
            dateTo: period.dateTo,
          }),
          reportsRepo.listPostedLinesByCategories({
            companyId: company.id,
            categories: ["revenue", "expenses"],
            dateFrom: period.dateFrom,
            dateTo: period.dateTo,
          }),
        ]);

        return buildDashboardSummary({ period, balanceSheetRows, dreRows });
      });
    }

    function getMonthlyRevenueExpenses({
      userId,
      months = 12,
    }: {
      userId: string;
      months?: number;
    }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId });

        if (!company) {
          return yield* Effect.fail(new DashboardServiceError({ code: "COMPANY_NOT_FOUND" }));
        }

        const today = new Date();
        const dateTo = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0, 23, 59, 59, 999));
        const dateFrom = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - months + 1, 1, 0, 0, 0, 0));

        const rows = yield* reportsRepo.listMonthlyRevenueExpenses({
          companyId: company.id,
          dateFrom,
          dateTo,
        });

        return buildMonthlyRevenueExpenses(rows);
      });
    }

    return { getSummaryForUser, getMonthlyRevenueExpenses };
  }),

  accessors: true,
}) {}

export class DashboardServiceError extends Data.TaggedError("DashboardServiceError")<{
  readonly code: "COMPANY_NOT_FOUND" | "INVALID_PERIOD";
}> {}

export function buildDashboardSummary({
  period,
  balanceSheetRows,
  dreRows,
}: {
  period: { dateFrom: Date; dateTo: Date };
  balanceSheetRows: ReportLineWithAccount[];
  dreRows: ReportLineWithAccount[];
}): DashboardDto {
  const cashAndBank = calculateCashAndBankBalance(balanceSheetRows);
  const dre = buildDreReport(period, dreRows);
  const liquidity = buildCurrentLiquidityReport({ dateTo: period.dateTo, rows: balanceSheetRows });

  return {
    cashAndBank,
    dre: {
      period: dre.period,
      totalRevenue: dre.totalRevenue,
      totalExpenses: dre.totalExpenses,
      netResult: dre.netResult,
    },
    liquidity: {
      display: liquidity.display,
      ratio: liquidity.ratio,
      hasCurrentLiabilities: liquidity.hasCurrentLiabilities,
    },
  };
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthStart(date: string) {
  const [year, month] = date.split("-");

  return `${year}-${month}-01`;
}

function calculateCashAndBankBalance(balanceSheetRows: ReportLineWithAccount[]) {
  const cashAndBankKeys = new Set(["cash", "bank_checking"]);
  let balance = 0n;

  for (const { line, account } of balanceSheetRows) {
    if (!account.key || !cashAndBankKeys.has(account.key)) continue;

    const cents = moneyToCents(line.amount);
    const signedDelta =
      account.nature === "debit"
        ? line.type === "debit"
          ? 1n
          : -1n
        : line.type === "credit"
          ? 1n
          : -1n;

    balance += signedDelta * cents;
  }

  return moneyFromCents(balance);
}

function buildMonthlyRevenueExpenses(rows: MonthlyRevenueExpensesRow[]): MonthlyRevenueExpensesDto {
  const monthly = new Map<string, { revenue: bigint; expenses: bigint }>();

  for (const { month, accountCategory, lineType, amount } of rows) {
    if (!monthly.has(month)) {
      monthly.set(month, { revenue: 0n, expenses: 0n });
    }

    const entry = monthly.get(month)!;
    const cents = moneyToCents(amount);

    if (accountCategory === "revenue") {
      entry.revenue += lineType === "credit" ? cents : -cents;
    } else if (accountCategory === "expenses") {
      entry.expenses += lineType === "debit" ? cents : -cents;
    }
  }

  const result: MonthlyRevenueExpensesDto = [];

  for (const [month, { revenue, expenses }] of monthly) {
    result.push({
      month,
      revenue: moneyFromCents(revenue),
      expenses: moneyFromCents(expenses),
    });
  }

  result.sort((a, b) => a.month.localeCompare(b.month));

  return result;
}
