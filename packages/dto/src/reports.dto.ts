import * as v from "valibot";

export const DrePeriodDto = v.object({
  dateFrom: v.string(),
  dateTo: v.string(),
});

export const DreBreakdownItemDto = v.object({
  accountId: v.number(),
  accountName: v.string(),
  accountType: v.string(),
  amount: v.string(),
});

export const DreSectionItemDto = v.object({
  accountId: v.number(),
  accountName: v.string(),
  accountType: v.string(),
  amount: v.string(),
  percentOfRevenue: v.nullable(v.string()),
});

export const DreSectionDto = v.object({
  key: v.string(),
  label: v.string(),
  total: v.string(),
  percentOfRevenue: v.nullable(v.string()),
  items: v.array(DreSectionItemDto),
});

export const DreReportDto = v.object({
  period: DrePeriodDto,
  totalRevenue: v.string(),
  totalExpenses: v.string(),
  netResult: v.string(),
  revenueBreakdown: v.array(DreBreakdownItemDto),
  expenseBreakdown: v.array(DreBreakdownItemDto),
  sections: v.array(DreSectionDto),
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
  accountType: v.string(),
  amount: v.string(),
});

export const BalanceSheetSubgroupDto = v.object({
  key: v.string(),
  label: v.string(),
  items: v.array(BalanceSheetAccountDto),
  total: v.string(),
});

export const BalanceSheetGroupDto = v.object({
  label: v.string(),
  items: v.array(BalanceSheetAccountDto),
  total: v.string(),
  subgroups: v.array(BalanceSheetSubgroupDto),
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

export const CurrentLiquidityQueryDto = v.object({
  dateTo: dateSchema,
});

export const CurrentLiquidityReportDto = v.object({
  dateTo: v.string(),
  currentAssets: v.string(),
  currentLiabilities: v.string(),
  ratio: v.nullable(v.string()),
  hasCurrentLiabilities: v.boolean(),
  display: v.string(),
});

export type DrePeriodDto = v.InferInput<typeof DrePeriodDto>;
export type DreBreakdownItemDto = v.InferInput<typeof DreBreakdownItemDto>;
export type DreSectionItemDto = v.InferInput<typeof DreSectionItemDto>;
export type DreSectionDto = v.InferInput<typeof DreSectionDto>;
export type DreReportDto = v.InferInput<typeof DreReportDto>;
export type DreQueryDto = v.InferInput<typeof DreQueryDto>;
export type BalanceSheetAccountDto = v.InferInput<typeof BalanceSheetAccountDto>;
export type BalanceSheetSubgroupDto = v.InferInput<typeof BalanceSheetSubgroupDto>;
export type BalanceSheetGroupDto = v.InferInput<typeof BalanceSheetGroupDto>;
export type BalanceSheetReportDto = v.InferInput<typeof BalanceSheetReportDto>;
export type BalanceSheetQueryDto = v.InferInput<typeof BalanceSheetQueryDto>;
export type CurrentLiquidityReportDto = v.InferInput<typeof CurrentLiquidityReportDto>;
export type CurrentLiquidityQueryDto = v.InferInput<typeof CurrentLiquidityQueryDto>;
