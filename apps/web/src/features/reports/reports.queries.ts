import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@web/lib/api";
import { callApi } from "@web/lib/callApi";

export function getDreReport(dateFrom: string, dateTo: string) {
  return callApi(api.reports.dre.$get, { query: { dateFrom, dateTo } });
}

export function getBalanceSheet(dateFrom: string, dateTo: string) {
  return callApi(api.reports["balance-sheet"].$get, { query: { dateFrom, dateTo } });
}

export const getDreReportOptions = (dateFrom: string, dateTo: string) =>
  queryOptions({
    queryKey: ["reports", "dre", dateFrom, dateTo],
    queryFn: () => getDreReport(dateFrom, dateTo),
    enabled: dateFrom !== "" && dateTo !== "",
  });

export const getBalanceSheetOptions = (dateFrom: string, dateTo: string) =>
  queryOptions({
    queryKey: ["reports", "balance-sheet", dateFrom, dateTo],
    queryFn: () => getBalanceSheet(dateFrom, dateTo),
    enabled: dateFrom !== "" && dateTo !== "",
  });

export const useDreReport = (dateFrom: string, dateTo: string) =>
  useQuery(getDreReportOptions(dateFrom, dateTo));

export const useBalanceSheet = (dateFrom: string, dateTo: string) =>
  useQuery(getBalanceSheetOptions(dateFrom, dateTo));
