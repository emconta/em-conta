import { zMoney } from "@dto/common";
import * as v from "valibot";

export const JournalSourceTypeDto = v.picklist([
  "sale",
  "receipt",
  "stock_issue",
  "manual",
  "reversal",
]);

export const JournalEntryStatusDto = v.picklist(["posted", "void"]);
export const JournalEntryLineTypeDto = v.picklist(["debit", "credit"]);

export const CreateManualJournalEntryLineDto = v.object({
  accountId: v.number(),
  amount: zMoney,
  description: v.nullable(v.optional(v.string())),
  type: JournalEntryLineTypeDto,
});

export const CreateManualJournalEntryDto = v.object({
  entryDate: v.string(),
  memo: v.pipe(v.string(), v.nonEmpty()),
  lines: v.pipe(v.array(CreateManualJournalEntryLineDto), v.minLength(2)),
});

export const JournalListQueryDto = v.object({
  accountId: v.optional(v.pipe(v.string(), v.regex(/^\d+$/))),
  dateFrom: v.optional(v.string()),
  dateTo: v.optional(v.string()),
  search: v.optional(v.string()),
  sourceType: v.optional(JournalSourceTypeDto),
});

export const JournalEntryLineDto = v.object({
  id: v.number(),
  accountId: v.number(),
  accountName: v.string(),
  amount: v.string(),
  description: v.nullable(v.string()),
  type: JournalEntryLineTypeDto,
});

const JournalEntrySummaryEntries = {
  id: v.number(),
  entryDate: v.string(),
  memo: v.nullable(v.string()),
  sourceId: v.nullable(v.number()),
  sourceType: JournalSourceTypeDto,
  status: JournalEntryStatusDto,
  totalCredits: v.string(),
  totalDebits: v.string(),
};

export const JournalEntryListItemDto = v.object(JournalEntrySummaryEntries);

export const JournalEntryDetailDto = v.object({
  ...JournalEntrySummaryEntries,
  lines: v.array(JournalEntryLineDto),
});

export type JournalSourceTypeDto = v.InferInput<typeof JournalSourceTypeDto>;
export type JournalEntryStatusDto = v.InferInput<typeof JournalEntryStatusDto>;
export type JournalEntryLineTypeDto = v.InferInput<typeof JournalEntryLineTypeDto>;
export type CreateManualJournalEntryLineDto = v.InferInput<typeof CreateManualJournalEntryLineDto>;
export type CreateManualJournalEntryDto = v.InferInput<typeof CreateManualJournalEntryDto>;
export type JournalListQueryDto = v.InferInput<typeof JournalListQueryDto>;
export type JournalEntryLineDto = v.InferInput<typeof JournalEntryLineDto>;
export type JournalEntryListItemDto = v.InferInput<typeof JournalEntryListItemDto>;
export type JournalEntryDetailDto = v.InferInput<typeof JournalEntryDetailDto>;
