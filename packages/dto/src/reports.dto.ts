import * as v from "valibot";

export const DrePeriodDto = v.object({
  dateFrom: v.string(),
  dateTo: v.string(),
});

export const DreBreakdownItemDto = v.object({
  accountId: v.number(),
  accountName: v.string(),
  accountKey: v.nullable(v.string()),
  amount: v.string(),
});

export const DreReportDto = v.object({
  period: DrePeriodDto,
  totalRevenue: v.string(),
  totalExpenses: v.string(),
  netResult: v.string(),
  revenueBreakdown: v.array(DreBreakdownItemDto),
  expenseBreakdown: v.array(DreBreakdownItemDto),
});

export const dateSchema = v.pipe(
  v.string(),
  v.regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD."),
);

export const DreQueryDto = v.object({
  dateFrom: dateSchema,
  dateTo: dateSchema,
});

export const BalanceSheetAccountDto = v.object({
  accountId: v.nullable(v.number()),
  accountName: v.string(),
  accountKey: v.nullable(v.string()),
  amount: v.string(),
});

export const BalanceSheetGroupDto = v.object({
  label: v.string(),
  items: v.array(BalanceSheetAccountDto),
  total: v.string(),
});

export const BalanceSheetReportDto = v.object({
  dateTo: v.string(),
  period: DrePeriodDto,
  assets: BalanceSheetGroupDto,
  liabilities: BalanceSheetGroupDto,
  equity: BalanceSheetGroupDto,
  totalLiabilitiesAndEquity: v.string(),
  isBalanced: v.boolean(),
});

export const BalanceSheetQueryDto = v.object({
  dateFrom: dateSchema,
  dateTo: dateSchema,
});

export type DrePeriodDto = v.InferInput<typeof DrePeriodDto>;
export type DreBreakdownItemDto = v.InferInput<typeof DreBreakdownItemDto>;
export type DreReportDto = v.InferInput<typeof DreReportDto>;
export type DreQueryDto = v.InferInput<typeof DreQueryDto>;
export type BalanceSheetAccountDto = v.InferInput<typeof BalanceSheetAccountDto>;
export type BalanceSheetGroupDto = v.InferInput<typeof BalanceSheetGroupDto>;
export type BalanceSheetReportDto = v.InferInput<typeof BalanceSheetReportDto>;
export type BalanceSheetQueryDto = v.InferInput<typeof BalanceSheetQueryDto>;
