import * as v from "valibot";

export const ReceivableItemDto = v.object({
  saleId: v.number(),
  issueDate: v.string(),
  customerName: v.nullable(v.string()),
  description: v.nullable(v.string()),
  netAmount: v.string(),
  receivedAmount: v.string(),
  outstandingAmount: v.string(),
  receiptCount: v.number(),
});

export type ReceivableItemDto = v.InferOutput<typeof ReceivableItemDto>;

export const ReceivablesListDto = v.array(ReceivableItemDto);

export type ReceivablesListDto = v.InferOutput<typeof ReceivablesListDto>;

export const ReceiptListItemDto = v.object({
  id: v.number(),
  saleId: v.number(),
  receiptDate: v.string(),
  amount: v.string(),
  cashAccountId: v.number(),
  notes: v.nullable(v.string()),
});

export type ReceiptListItemDto = v.InferOutput<typeof ReceiptListItemDto>;

export const ReceiptsListDto = v.array(ReceiptListItemDto);

export type ReceiptsListDto = v.InferOutput<typeof ReceiptsListDto>;
