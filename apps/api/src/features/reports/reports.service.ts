import type { AccountCategory } from "@api/db/schema";
import {
  ACCOUNT_TYPE_METADATA,
  type AccountDreGroup,
  type AccountTerm,
  type AccountType,
} from "@api/features/accounts/accountTypes";
import CompaniesRepo from "@api/features/companies/companies.repo";
import type { ReportLineWithAccount } from "@api/features/reports/reports.repo";
import ReportsRepo from "@api/features/reports/reports.repo";
import type {
  BalanceSheetGroupDto,
  BalanceSheetReportDto,
  CurrentLiquidityReportDto,
  DreBreakdownItemDto,
  DreReportDto,
  DreSectionDto,
  DreSectionItemDto,
} from "@dto/reports.dto";
import { Data, Effect } from "effect";

function getAccountTypeMetadata(type: AccountType) {
  const metadata = ACCOUNT_TYPE_METADATA[type];

  if (!metadata) {
    throw new Error(`Unknown account type: ${type}`);
  }

  return metadata;
}

export class ReportsService extends Effect.Service<ReportsService>()("ReportsService", {
  effect: Effect.gen(function* () {
    const companiesRepo = yield* CompaniesRepo;
    const reportsRepo = yield* ReportsRepo;

    function getDreForUser({
      dateFrom,
      dateTo,
      userId,
    }: {
      dateFrom: string;
      dateTo: string;
      userId: string;
    }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId });

        if (!company) {
          return yield* Effect.fail(new ReportsServiceError({ code: "COMPANY_NOT_FOUND" }));
        }

        const period = parseDrePeriod(dateFrom, dateTo);

        if (!period) {
          return yield* Effect.fail(new ReportsServiceError({ code: "INVALID_PERIOD" }));
        }

        const rows = yield* reportsRepo.listPostedLinesByCategories({
          companyId: company.id,
          categories: ["revenue", "expenses"],
          dateFrom: period.dateFrom,
          dateTo: period.dateTo,
        });

        return buildDreReport(period, rows);
      });
    }

    function getBalanceSheetForUser({
      dateFrom,
      dateTo,
      userId,
    }: {
      dateFrom: string;
      dateTo: string;
      userId: string;
    }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId });

        if (!company) {
          return yield* Effect.fail(new ReportsServiceError({ code: "COMPANY_NOT_FOUND" }));
        }

        const period = parseDrePeriod(dateFrom, dateTo);

        if (!period) {
          return yield* Effect.fail(new ReportsServiceError({ code: "INVALID_PERIOD" }));
        }

        const [balanceSheetRows, dreRows] = yield* Effect.all([
          reportsRepo.listPostedLinesUpToDate({
            companyId: company.id,
            categories: ["assets", "liabilities", "equity"],
            dateTo: period.dateTo,
          }),
          reportsRepo.listPostedLinesByCategories({
            companyId: company.id,
            categories: ["revenue", "expenses"],
            dateFrom: period.dateFrom,
            dateTo: period.dateTo,
          }),
        ]);

        return buildBalanceSheetReport(period, balanceSheetRows, dreRows);
      });
    }

    function getCurrentLiquidityForUser({ dateTo, userId }: { dateTo: string; userId: string }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId });

        if (!company) {
          return yield* Effect.fail(new ReportsServiceError({ code: "COMPANY_NOT_FOUND" }));
        }

        const parsedDateTo = parseDateAtEndOfDay(dateTo);

        if (!parsedDateTo) {
          return yield* Effect.fail(new ReportsServiceError({ code: "INVALID_PERIOD" }));
        }

        const rows = yield* reportsRepo.listPostedLinesUpToDate({
          companyId: company.id,
          categories: ["assets", "liabilities"],
          dateTo: parsedDateTo,
        });

        return buildCurrentLiquidityReport({ dateTo: parsedDateTo, rows });
      });
    }

    return { getBalanceSheetForUser, getCurrentLiquidityForUser, getDreForUser };
  }),

  accessors: true,
}) {}

export class ReportsServiceError extends Data.TaggedError("ReportsServiceError")<{
  readonly code: "COMPANY_NOT_FOUND" | "INVALID_PERIOD";
}> {}

export function parseDrePeriod(dateFrom: string, dateTo: string) {
  const from = parseDateAtStartOfDay(dateFrom);
  const to = parseDateAtEndOfDay(dateTo);

  if (!from || !to || from > to) return null;

  return { dateFrom: from, dateTo: to };
}

function parseDateAtStartOfDay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0));

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

function parseDateAtEndOfDay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999));

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

export function buildDreReport(
  period: { dateFrom: Date; dateTo: Date },
  rows: ReportLineWithAccount[],
): DreReportDto {
  const accountTotals = new Map<
    number,
    {
      accountName: string;
      accountType: AccountType;
      dreGroup: AccountDreGroup;
      netAmount: bigint;
    }
  >();

  for (const { line, account } of rows) {
    if (account.category !== "revenue" && account.category !== "expenses") continue;

    const cents = moneyToCents(line.amount);
    const signedDelta =
      account.category === "revenue"
        ? line.type === "credit"
          ? 1n
          : -1n
        : line.type === "debit"
          ? 1n
          : -1n;
    const delta = signedDelta * cents;
    const metadata = getAccountTypeMetadata(account.type);

    const existing = accountTotals.get(account.id);

    if (existing) {
      existing.netAmount += delta;
    } else {
      accountTotals.set(account.id, {
        accountName: account.name,
        accountType: account.type,
        dreGroup: metadata.dreGroup,
        netAmount: delta,
      });
    }
  }

  let totalRevenue = 0n;
  let totalExpenses = 0n;
  const revenueBreakdown: DreBreakdownItemDto[] = [];
  const expenseBreakdown: DreBreakdownItemDto[] = [];
  const grossRevenueItems: DreSectionItemDto[] = [];
  const costItems: DreSectionItemDto[] = [];
  const operationalExpenseItems: DreSectionItemDto[] = [];
  let totalCosts = 0n;
  let totalOperationalExpenses = 0n;

  for (const [accountId, { accountType, accountName, dreGroup, netAmount }] of accountTotals) {
    const item = {
      accountId,
      accountName,
      accountType,
      amount: moneyFromCents(netAmount),
    };

    if (dreGroup === "revenue") {
      totalRevenue += netAmount;
      revenueBreakdown.push(item);
      grossRevenueItems.push({ ...item, percentOfRevenue: null });
    } else {
      totalExpenses += netAmount;
      expenseBreakdown.push(item);

      if (dreGroup === "cogs") {
        totalCosts += netAmount;
        costItems.push({ ...item, percentOfRevenue: null });
      } else {
        totalOperationalExpenses += netAmount;
        operationalExpenseItems.push({ ...item, percentOfRevenue: null });
      }
    }
  }

  revenueBreakdown.sort((a, b) => a.accountName.localeCompare(b.accountName, "pt-BR"));
  expenseBreakdown.sort((a, b) => a.accountName.localeCompare(b.accountName, "pt-BR"));
  grossRevenueItems.sort((a, b) => a.accountName.localeCompare(b.accountName, "pt-BR"));
  costItems.sort((a, b) => a.accountName.localeCompare(b.accountName, "pt-BR"));
  operationalExpenseItems.sort((a, b) => a.accountName.localeCompare(b.accountName, "pt-BR"));

  const netResult = totalRevenue - totalExpenses;
  const sections = buildDreSections({
    grossRevenueItems,
    netResult,
    operationalExpenseItems,
    totalCosts,
    totalOperationalExpenses,
    totalRevenue,
    costItems,
  });

  return {
    period: {
      dateFrom: period.dateFrom.toISOString().slice(0, 10),
      dateTo: period.dateTo.toISOString().slice(0, 10),
    },
    totalRevenue: moneyFromCents(totalRevenue),
    totalExpenses: moneyFromCents(totalExpenses),
    netResult: moneyFromCents(netResult),
    revenueBreakdown,
    expenseBreakdown,
    sections,
  };
}

function buildDreSections({
  costItems,
  grossRevenueItems,
  netResult,
  operationalExpenseItems,
  totalCosts,
  totalOperationalExpenses,
  totalRevenue,
}: {
  costItems: DreSectionItemDto[];
  grossRevenueItems: DreSectionItemDto[];
  netResult: bigint;
  operationalExpenseItems: DreSectionItemDto[];
  totalCosts: bigint;
  totalOperationalExpenses: bigint;
  totalRevenue: bigint;
}): DreSectionDto[] {
  return [
    {
      key: "gross_revenue",
      label: "Receita bruta",
      total: moneyFromCents(totalRevenue),
      percentOfRevenue: formatPercentOfRevenue(totalRevenue, totalRevenue),
      items: withRevenuePercentages(grossRevenueItems, totalRevenue),
    },
    {
      key: "costs",
      label: "Custos",
      total: moneyFromCents(totalCosts),
      percentOfRevenue: formatPercentOfRevenue(totalCosts, totalRevenue),
      items: withRevenuePercentages(costItems, totalRevenue),
    },
    {
      key: "operational_expenses",
      label: "Despesas operacionais",
      total: moneyFromCents(totalOperationalExpenses),
      percentOfRevenue: formatPercentOfRevenue(totalOperationalExpenses, totalRevenue),
      items: withRevenuePercentages(operationalExpenseItems, totalRevenue),
    },
    {
      key: "net_result",
      label: "Resultado",
      total: moneyFromCents(netResult),
      percentOfRevenue: formatPercentOfRevenue(netResult, totalRevenue),
      items: [],
    },
  ];
}

function withRevenuePercentages(items: DreSectionItemDto[], totalRevenue: bigint) {
  return items.map((item) => ({
    ...item,
    percentOfRevenue: formatPercentOfRevenue(signedMoneyToCents(item.amount), totalRevenue),
  }));
}

function formatPercentOfRevenue(amount: bigint, totalRevenue: bigint) {
  if (totalRevenue === 0n) return null;

  const scaled = (amount * 10000n) / totalRevenue;
  const negative = scaled < 0n;
  const absoluteScaled = negative ? -scaled : scaled;
  const units = absoluteScaled / 100n;
  const decimals = (absoluteScaled % 100n).toString().padStart(2, "0");

  return negative ? `-${units}.${decimals}` : `${units}.${decimals}`;
}

export function buildCurrentLiquidityReport({
  dateTo,
  rows,
}: {
  dateTo: Date;
  rows: ReportLineWithAccount[];
}): CurrentLiquidityReportDto {
  let currentAssets = 0n;
  let currentLiabilities = 0n;

  for (const { line, account } of rows) {
    const metadata = getAccountTypeMetadata(account.type);

    if (metadata.term !== "current") continue;

    const cents = moneyToCents(line.amount);
    const signedDelta =
      account.nature === "debit"
        ? line.type === "debit"
          ? 1n
          : -1n
        : line.type === "credit"
          ? 1n
          : -1n;
    const delta = signedDelta * cents;

    if (account.category === "assets") {
      currentAssets += delta;
    } else if (account.category === "liabilities") {
      currentLiabilities += delta;
    }
  }

  const hasCurrentLiabilities = currentLiabilities > 0n;

  const ratio = hasCurrentLiabilities ? formatRatio(currentAssets, currentLiabilities) : null;

  const display = ratio ?? "N/A";

  return {
    dateTo: dateTo.toISOString().slice(0, 10),
    currentAssets: moneyFromCents(currentAssets),
    currentLiabilities: moneyFromCents(currentLiabilities),
    ratio,
    hasCurrentLiabilities,
    display,
  };
}

function formatRatio(numerator: bigint, denominator: bigint): string {
  const scaled = (numerator * 100n) / denominator;
  const negative = scaled < 0n;
  const absoluteScaled = negative ? -scaled : scaled;
  const units = absoluteScaled / 100n;
  const decimals = (absoluteScaled % 100n).toString().padStart(2, "0");

  return negative ? `-${units}.${decimals}` : `${units}.${decimals}`;
}

export function buildBalanceSheetReport(
  period: { dateFrom: Date; dateTo: Date },
  balanceSheetRows: ReportLineWithAccount[],
  dreRows: ReportLineWithAccount[],
): BalanceSheetReportDto {
  const accountBalances = new Map<
    number,
    {
      accountName: string;
      accountType: AccountType;
      term: AccountTerm;
      category: AccountCategory;
      balance: bigint;
    }
  >();

  for (const { line, account } of balanceSheetRows) {
    if (
      account.category !== "assets" &&
      account.category !== "liabilities" &&
      account.category !== "equity"
    )
      continue;

    const cents = moneyToCents(line.amount);
    const signedDelta =
      account.nature === "debit"
        ? line.type === "debit"
          ? 1n
          : -1n
        : line.type === "credit"
          ? 1n
          : -1n;
    const delta = signedDelta * cents;
    const metadata = getAccountTypeMetadata(account.type);

    const existing = accountBalances.get(account.id);

    if (existing) {
      existing.balance += delta;
    } else {
      accountBalances.set(account.id, {
        accountName: account.name,
        accountType: account.type,
        term: metadata.term,
        category: account.category,
        balance: delta,
      });
    }
  }

  const assets = buildGroup("Ativo", accountBalances, "assets");
  const liabilities = buildGroup("Passivo", accountBalances, "liabilities");
  const equityAccounts = buildGroup("Patrimônio líquido", accountBalances, "equity");

  const dre = buildDreReport(period, dreRows);
  const netResult = signedMoneyToCents(dre.netResult);

  const resultadoItem = {
    accountId: null,
    accountName: "Resultado do período",
    accountType: "",
    amount: dre.netResult,
  };

  const equityItems = [...equityAccounts.items, resultadoItem].filter(
    (item) => signedMoneyToCents(item.amount) !== 0n,
  );
  const equityTotal = equityAccounts.totalCents + netResult;

  const equity: BalanceSheetGroupDto = {
    label: "Patrimônio líquido",
    items: equityItems,
    subgroups: [],
    total: moneyFromCents(equityTotal),
  };

  const totalLiabilitiesAndEquity = liabilities.totalCents + equityTotal;
  const isBalanced = assets.totalCents === totalLiabilitiesAndEquity;

  return {
    dateTo: period.dateTo.toISOString().slice(0, 10),
    period: {
      dateFrom: period.dateFrom.toISOString().slice(0, 10),
      dateTo: period.dateTo.toISOString().slice(0, 10),
    },
    assets: {
      items: assets.items,
      label: assets.label,
      subgroups: assets.subgroups,
      total: assets.total,
    },
    liabilities: {
      items: liabilities.items,
      label: liabilities.label,
      subgroups: liabilities.subgroups,
      total: liabilities.total,
    },
    equity,
    totalLiabilitiesAndEquity: moneyFromCents(totalLiabilitiesAndEquity),
    isBalanced,
  };
}

function buildGroup(
  label: string,
  accountBalances: Map<
    number,
    {
      accountName: string;
      accountType: AccountType;
      term: AccountTerm;
      category: AccountCategory;
      balance: bigint;
    }
  >,
  category: AccountCategory,
) {
  const currentItems = [];
  const nonCurrentItems = [];
  let currentTotalCents = 0n;
  let nonCurrentTotalCents = 0n;
  let totalCents = 0n;
  const items = [];

  for (const [
    accountId,
    { accountName, accountType, term, category: accountCategory, balance },
  ] of accountBalances) {
    if (accountCategory !== category || balance === 0n) continue;

    const item = {
      accountId,
      accountName,
      accountType,
      amount: moneyFromCents(balance),
    };

    totalCents += balance;
    items.push(item);

    if (category === "assets" || category === "liabilities") {
      const subgroup = term === "current" ? "current" : "non_current";

      if (subgroup === "current") {
        currentTotalCents += balance;
        currentItems.push(item);
      } else {
        nonCurrentTotalCents += balance;
        nonCurrentItems.push(item);
      }
    }
  }

  items.sort((a, b) => a.accountName.localeCompare(b.accountName, "pt-BR"));
  currentItems.sort((a, b) => a.accountName.localeCompare(b.accountName, "pt-BR"));
  nonCurrentItems.sort((a, b) => a.accountName.localeCompare(b.accountName, "pt-BR"));

  const subgroups = [
    {
      key: "current",
      label: "Circulante",
      items: currentItems,
      total: moneyFromCents(currentTotalCents),
    },
    {
      key: "non_current",
      label: "Não circulante",
      items: nonCurrentItems,
      total: moneyFromCents(nonCurrentTotalCents),
    },
  ];

  return { items, label, subgroups, total: moneyFromCents(totalCents), totalCents };
}

export function moneyToCents(amount: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
    throw new Error(`Invalid report amount: ${amount}`);
  }

  const [units = "0", cents = ""] = amount.split(".");

  return BigInt(units) * 100n + BigInt(cents.padEnd(2, "0"));
}

export function moneyFromCents(cents: bigint) {
  const negative = cents < 0n;
  const absoluteCents = negative ? -cents : cents;
  const units = absoluteCents / 100n;
  const decimals = (absoluteCents % 100n).toString().padStart(2, "0");

  return negative ? `-${units}.${decimals}` : `${units}.${decimals}`;
}

function signedMoneyToCents(amount: string) {
  const negative = amount.startsWith("-");
  const absoluteAmount = negative ? amount.slice(1) : amount;

  return negative ? -moneyToCents(absoluteAmount) : moneyToCents(absoluteAmount);
}
