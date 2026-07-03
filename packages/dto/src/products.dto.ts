import { zMoney } from "@dto/common";
import * as v from "valibot";

export const ProductTypeDto = v.picklist(["product", "service"]);

export const CreateProductDto = v.object({
  name: v.pipe(v.string(), v.nonEmpty()),
  type: ProductTypeDto,
  defaultSalePrice: zMoney,
  trackInventory: v.optional(v.boolean()),
  isActive: v.optional(v.boolean()),
});

export const ProductDto = v.object({
  id: v.number(),
  name: v.string(),
  type: ProductTypeDto,
  defaultSalePrice: v.string(),
  trackInventory: v.boolean(),
  costMethod: v.string(),
  isActive: v.boolean(),
});

export type ProductTypeDto = v.InferInput<typeof ProductTypeDto>;
export type CreateProductDto = v.InferInput<typeof CreateProductDto>;
export type ProductDto = v.InferInput<typeof ProductDto>;
