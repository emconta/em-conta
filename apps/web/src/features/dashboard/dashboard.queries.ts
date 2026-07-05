import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@web/lib/api";
import { callApi } from "@web/lib/callApi";

export function getDashboardSummary() {
  return callApi(api.dashboard.$get, {});
}

export const getDashboardSummaryOptions = () =>
  queryOptions({
    queryKey: ["dashboard", "summary"],
    queryFn: getDashboardSummary,
  });

export const useDashboardSummary = () => useQuery(getDashboardSummaryOptions());

export function getMonthlyRevenueExpenses(months?: number) {
  return callApi(api.dashboard["monthly-revenue-expenses"].$get, {
    query: months ? { months: String(months) } : {},
  });
}

export const getMonthlyRevenueExpensesOptions = (months?: number) =>
  queryOptions({
    queryKey: ["dashboard", "monthly-revenue-expenses", months],
    queryFn: () => getMonthlyRevenueExpenses(months),
  });

export const useMonthlyRevenueExpenses = (months?: number) =>
  useQuery(getMonthlyRevenueExpensesOptions(months));
