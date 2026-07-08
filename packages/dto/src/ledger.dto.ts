import { JournalSourceTypeDto } from "@dto/journal.dto";
import * as v from "valibot";

export const AccountLedgerRowDto = v.object({
  entryId: v.nullable(v.number()),
  entryDate: v.nullable(v.string()),
  memo: v.nullable(v.string()),
  sourceType: v.nullable(JournalSourceTypeDto),
  debit: v.string(),
  credit: v.string(),
  balance: v.string(),
});

export const AccountLedgerDto = v.object({
  accountId: v.number(),
  accountName: v.string(),
  accountType: v.string(),
  accountNature: v.picklist(["debit", "credit"]),
  openingBalance: v.string(),
  rows: v.array(AccountLedgerRowDto),
});

export type AccountLedgerRowDto = v.InferInput<typeof AccountLedgerRowDto>;
export type AccountLedgerDto = v.InferInput<typeof AccountLedgerDto>;
