import Database from "@api/db/database";
import {
  type InsertJournalEntry,
  type InsertJournalEntryLine,
  type InsertSale,
  type InsertSaleItem,
  type InsertStockMovement,
  journalEntries,
  journalEntryLines,
  saleItems,
  sales,
  stockMovements,
  type Sale,
} from "@api/db/schema";
import { Effect } from "effect";

export type PostedSaleJournalEntry = InsertJournalEntry & {
  lines: Omit<InsertJournalEntryLine, "entryId">[];
};

export type CreatePostedSaleInput = {
  sale: InsertSale;
  items: Omit<InsertSaleItem, "saleId">[];
  revenueEntry: Omit<PostedSaleJournalEntry, "sourceId">;
  stockMovements: Omit<InsertStockMovement, "sourceId">[];
  stockEntry?: Omit<PostedSaleJournalEntry, "sourceId">;
};

export default class SalesRepo extends Effect.Service<SalesRepo>()("SalesRepo", {
  effect: Effect.gen(function* () {
    const db = yield* Database;

    function createPostedSale(input: CreatePostedSaleInput) {
      return db.execute((q) =>
        q.transaction(async (tx) => {
          const insertedSales = await tx.insert(sales).values(input.sale).returning();
          const sale = insertedSales[0];

          if (!sale) {
            throw new Error("Sale insert returned no rows.");
          }

          const items = await tx
            .insert(saleItems)
            .values(input.items.map((item) => ({ ...item, saleId: sale.id })))
            .returning();

          const revenueEntry = await insertJournalEntry(tx, {
            ...input.revenueEntry,
            sourceId: sale.id,
          });

          const createdStockMovements = input.stockMovements.length
            ? await tx
                .insert(stockMovements)
                .values(
                  input.stockMovements.map((movement) => ({ ...movement, sourceId: sale.id })),
                )
                .returning()
            : [];

          const stockEntry = input.stockEntry
            ? await insertJournalEntry(tx, { ...input.stockEntry, sourceId: sale.id })
            : undefined;

          return { items, revenueEntry, sale, stockEntry, stockMovements: createdStockMovements };
        }),
      );
    }

    function getByCompanyAndId({ companyId, id }: Pick<Sale, "companyId" | "id">) {
      return db.execute((q) =>
        q.query.sales.findFirst({
          where(fields, operators) {
            return operators.and(
              operators.eq(fields.companyId, companyId),
              operators.eq(fields.id, id),
            );
          },
        }),
      );
    }

    function listByCompany({ companyId }: Pick<Sale, "companyId">) {
      return db.execute((q) =>
        q.query.sales.findMany({
          where(fields, operators) {
            return operators.eq(fields.companyId, companyId);
          },
        }),
      );
    }

    return { createPostedSale, getByCompanyAndId, listByCompany };
  }),
}) {}

type Transaction = Parameters<Parameters<Database["execute"]>[0]>[0] extends {
  transaction: infer T;
}
  ? T extends (fn: (tx: infer Tx) => Promise<unknown>) => Promise<unknown>
    ? Tx
    : never
  : never;

async function insertJournalEntry(tx: Transaction, entry: PostedSaleJournalEntry) {
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
