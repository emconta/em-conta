import * as v from "valibot";

export const DashboardDto = v.object({
  cashAndBank: v.string(),
  dre: v.object({
    period: v.object({
      dateFrom: v.string(),
      dateTo: v.string(),
    }),
    totalRevenue: v.string(),
    totalExpenses: v.string(),
    netResult: v.string(),
  }),
  liquidity: v.object({
    display: v.string(),
    ratio: v.nullable(v.string()),
    hasCurrentLiabilities: v.boolean(),
  }),
});

export type DashboardDto = v.InferInput<typeof DashboardDto>;

export const MonthlyRevenueExpensesQueryDto = v.object({
  months: v.optional(v.pipe(v.string(), v.regex(/^\d+$/))),
});

export type MonthlyRevenueExpensesQueryDto = v.InferInput<typeof MonthlyRevenueExpensesQueryDto>;

export const MonthlyRevenueExpensesItemDto = v.object({
  month: v.string(),
  revenue: v.string(),
  expenses: v.string(),
});

export type MonthlyRevenueExpensesItemDto = v.InferInput<typeof MonthlyRevenueExpensesItemDto>;

export const MonthlyRevenueExpensesDto = v.array(MonthlyRevenueExpensesItemDto);

export type MonthlyRevenueExpensesDto = v.InferInput<typeof MonthlyRevenueExpensesDto>;
