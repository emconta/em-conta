import { zMoney, zQuantity } from "@dto/common";
import * as v from "valibot";

export const SalePaymentTermsDto = v.picklist(["cash", "credit"]);
export const SaleKindDto = v.picklist(["product", "service", "mixed"]);
export const SaleStatusDto = v.picklist(["posted", "void"]);
export const SaleItemTypeDto = v.picklist(["product", "service"]);

export const CreateSaleItemDto = v.object({
  productId: v.number(),
  quantity: zQuantity,
  unitPrice: v.optional(zMoney),
  description: v.nullable(v.optional(v.string())),
});

export const CreateSaleDto = v.object({
  paymentTerms: SalePaymentTermsDto,
  issueDate: v.string(),
  description: v.nullable(v.optional(v.string())),
  customerName: v.nullable(v.optional(v.string())),
  cashAccountId: v.optional(v.number()),
  discountAmount: v.optional(zMoney),
  items: v.pipe(v.array(CreateSaleItemDto), v.minLength(1)),
});

const SaleSummaryEntries = {
  id: v.number(),
  kind: SaleKindDto,
  paymentTerms: SalePaymentTermsDto,
  issueDate: v.string(),
  description: v.nullable(v.string()),
  customerName: v.nullable(v.string()),
  grossAmount: v.string(),
  discountAmount: v.string(),
  netAmount: v.string(),
  status: SaleStatusDto,
};

export const SaleListItemDto = v.object(SaleSummaryEntries);

export const SaleItemDto = v.object({
  id: v.number(),
  productId: v.nullable(v.number()),
  description: v.string(),
  type: SaleItemTypeDto,
  quantity: v.string(),
  unitPrice: v.string(),
  lineAmount: v.string(),
  unitCostSnapshot: v.nullable(v.string()),
  lineCostAmount: v.nullable(v.string()),
});

export const SaleDetailDto = v.object({
  ...SaleSummaryEntries,
  items: v.array(SaleItemDto),
});

export type CreateSaleItemDto = v.InferInput<typeof CreateSaleItemDto>;
export type CreateSaleDto = v.InferInput<typeof CreateSaleDto>;
export type SaleListItemDto = v.InferInput<typeof SaleListItemDto>;
export type SaleItemDto = v.InferInput<typeof SaleItemDto>;
export type SaleDetailDto = v.InferInput<typeof SaleDetailDto>;
