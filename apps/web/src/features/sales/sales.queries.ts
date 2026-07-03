import type { CreateSaleDto } from "@dto/sales.dto";
import { mutationOptions, queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@web/lib/api";
import { callApi } from "@web/lib/callApi";

export function listSales() {
  return callApi(api.sales.$get);
}

export function getSale(id: number) {
  return callApi(api.sales[":id"].$get, { param: { id: String(id) } });
}

export function createSale(json: CreateSaleDto) {
  return callApi(api.sales.$post, { json });
}

export const listSalesOptions = queryOptions({
  queryKey: ["sales", "list"],
  queryFn: listSales,
});

export const getSaleOptions = (id: number | null) =>
  queryOptions({
    queryKey: ["sales", "detail", id],
    queryFn: () => getSale(id ?? 0),
    enabled: id !== null,
  });

export const createSaleOptions = mutationOptions({
  mutationKey: ["sales", "create"],
  mutationFn: createSale,
});

export const useSales = () => useQuery(listSalesOptions);
export const useSale = (id: number | null) => useQuery(getSaleOptions(id));
export const useCreateSale = (options?: Partial<typeof createSaleOptions>) =>
  useMutation({ ...options, ...createSaleOptions });
