import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@web/lib/api";
import { callApi } from "@web/lib/callApi";

export function listReceivables() {
  return callApi(api.receivables.$get);
}

export const listReceivablesOptions = queryOptions({
  queryKey: ["receivables", "list"],
  queryFn: listReceivables,
});

export function listReceipts() {
  return callApi(api.receipts.$get);
}

export const listReceiptsOptions = queryOptions({
  queryKey: ["receipts", "list"],
  queryFn: listReceipts,
});

export const useReceivables = () => useQuery(listReceivablesOptions);
export const useReceipts = () => useQuery(listReceiptsOptions);
