import type { CreateProductDto } from "@dto/products.dto";
import { mutationOptions, queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@web/lib/api";
import { callApi } from "@web/lib/callApi";

export function listProducts() {
  return callApi(api.products.$get);
}

export function createProduct(json: CreateProductDto) {
  return callApi(api.products.$post, { json });
}

export const listProductsOptions = queryOptions({
  queryKey: ["products", "list"],
  queryFn: listProducts,
});

export const createProductOptions = mutationOptions({
  mutationKey: ["products", "create"],
  mutationFn: createProduct,
});

export const useProducts = () => useQuery(listProductsOptions);
export const useCreateProduct = (options?: Partial<typeof createProductOptions>) =>
  useMutation({ ...options, ...createProductOptions });
