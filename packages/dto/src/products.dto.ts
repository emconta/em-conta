import { zMoney, zQuantity } from "@dto/common";
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
  stock: v.nullable(
    v.object({
      quantity: v.string(),
      totalCost: v.string(),
      averageUnitCost: v.string(),
    }),
  ),
});

export const CreateStockIntakeDto = v.object({
  date: v.string(),
  paymentAccountId: v.number(),
  quantity: zQuantity,
  unitCost: zMoney,
});

export type ProductTypeDto = v.InferInput<typeof ProductTypeDto>;
export type CreateProductDto = v.InferInput<typeof CreateProductDto>;
export type ProductDto = v.InferInput<typeof ProductDto>;
export type CreateStockIntakeDto = v.InferInput<typeof CreateStockIntakeDto>;
