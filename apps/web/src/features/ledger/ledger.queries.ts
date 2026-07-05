import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@web/lib/api";
import { callApi } from "@web/lib/callApi";

export function getAccountLedger(accountId: number | null) {
  return callApi(api.accounts[":id"].ledger.$get, {
    param: { id: String(accountId ?? 0) },
  });
}

export const getAccountLedgerOptions = (accountId: number | null) =>
  queryOptions({
    queryKey: ["ledger", "account", accountId],
    queryFn: () => getAccountLedger(accountId),
    enabled: accountId !== null,
  });

export const useAccountLedger = (accountId: number | null) =>
  useQuery(getAccountLedgerOptions(accountId));
