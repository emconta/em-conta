import Database from "@api/db/database";
import {
  type InsertJournalEntry,
  type InsertJournalEntryLine,
  type InsertReceipt,
  journalEntries,
  journalEntryLines,
  receipts,
  type Receipt,
} from "@api/db/schema";
import { Effect } from "effect";

export type ReceiptJournalEntry = InsertJournalEntry & {
  lines: Omit<InsertJournalEntryLine, "entryId">[];
};

export type CreatePostedReceiptInput = {
  receipt: InsertReceipt;
  journalEntry: Omit<ReceiptJournalEntry, "sourceId">;
};

export default class ReceiptsRepo extends Effect.Service<ReceiptsRepo>()("ReceiptsRepo", {
  effect: Effect.gen(function* () {
    const db = yield* Database;

    function createPostedReceipt(input: CreatePostedReceiptInput) {
      return db.execute((q) =>
        q.transaction(async (tx) => {
          const insertedReceipts = await tx.insert(receipts).values(input.receipt).returning();
          const receipt = insertedReceipts[0];

          if (!receipt) {
            throw new Error("Receipt insert returned no rows.");
          }

          const journalEntry = await insertJournalEntry(tx, {
            ...input.journalEntry,
            sourceId: receipt.id,
          });

          return { journalEntry, receipt };
        }),
      );
    }

    function listByCompanyAndSale({ companyId, saleId }: Pick<Receipt, "companyId" | "saleId">) {
      return db.execute((q) =>
        q.query.receipts.findMany({
          where(fields, operators) {
            return operators.and(
              operators.eq(fields.companyId, companyId),
              operators.eq(fields.saleId, saleId),
            );
          },
        }),
      );
    }

    return { createPostedReceipt, listByCompanyAndSale };
  }),
}) {}

type Transaction = Parameters<Parameters<Database["execute"]>[0]>[0] extends {
  transaction: infer T;
}
  ? T extends (fn: (tx: infer Tx) => Promise<unknown>) => Promise<unknown>
    ? Tx
    : never
  : never;

async function insertJournalEntry(tx: Transaction, entry: ReceiptJournalEntry) {
  const { lines, ...header } = entry;
  const insertedEntries = await tx.insert(journalEntries).values(header).returning();
  const insertedEntry = insertedEntries[0];

  if (!insertedEntry) {
    throw new Error("Journal entry insert returned no rows.");
  }

  const insertedLines = await tx
    .insert(journalEntryLines)
    .values(lines.map((line) => ({ ...line, entryId: insertedEntry.id })))
    .returning();

  return { entry: insertedEntry, lines: insertedLines };
}
