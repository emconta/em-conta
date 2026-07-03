import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@web/lib/api";
import { callApi } from "@web/lib/callApi";

export function listAccounts() {
  return callApi(api.accounts.$get);
}

export const listAccountsOptions = queryOptions({
  queryKey: ["accounts", "list"],
  queryFn: listAccounts,
});

export const useAccounts = () => useQuery(listAccountsOptions);
