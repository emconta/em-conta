import { zMoney } from "@dto/common";
import * as v from "valibot";

export const CreateReceiptDto = v.object({
  saleId: v.number(),
  receiptDate: v.string(),
  amount: zMoney,
  cashAccountId: v.number(),
  notes: v.nullable(v.optional(v.string())),
});

export type CreateReceiptDto = v.InferInput<typeof CreateReceiptDto>;
