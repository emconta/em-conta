import type { CreateReceiptDto } from "@dto/receipts.dto";
import { mutationOptions, useMutation } from "@tanstack/react-query";
import { api } from "@web/lib/api";
import { callApi } from "@web/lib/callApi";

export function createReceipt(json: CreateReceiptDto) {
  return callApi(api.receipts.$post, { json });
}

export const createReceiptOptions = mutationOptions({
  mutationKey: ["receipts", "create"],
  mutationFn: createReceipt,
});

export const useCreateReceipt = (options?: Partial<typeof createReceiptOptions>) =>
  useMutation({ ...options, ...createReceiptOptions });
