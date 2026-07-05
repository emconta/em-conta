import Database from "@api/db/database";
import {
  type InsertJournalEntry,
  type InsertJournalEntryLine,
  type InsertStockMovement,
  type StockMovement,
  journalEntries,
  journalEntryLines,
  stockMovements,
} from "@api/db/schema";
import { eq } from "drizzle-orm";
import { Effect, Array as EffArray } from "effect";

export type StockIntakeJournalEntry = Omit<InsertJournalEntry, "sourceId"> & {
  lines: Omit<InsertJournalEntryLine, "entryId">[];
};

export default class StockMovementsRepo extends Effect.Service<StockMovementsRepo>()(
  "StockMovementsRepo",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database;

      function insert(movement: InsertStockMovement) {
        return db
          .execute((q) => q.insert(stockMovements).values(movement).returning())
          .pipe(Effect.map(EffArray.head));
      }

      function listByCompanyAndProduct({
        companyId,
        productId,
      }: Pick<StockMovement, "companyId" | "productId">) {
        return db.execute((q) =>
          q.query.stockMovements.findMany({
            where(fields, operators) {
              return operators.and(
                operators.eq(fields.companyId, companyId),
                operators.eq(fields.productId, productId),
              );
            },
          }),
        );
      }

      function createStockIntake(input: {
        movement: Omit<InsertStockMovement, "sourceId">;
        journalEntry: StockIntakeJournalEntry;
      }) {
        return db.execute((q) =>
          q.transaction(async (tx) => {
            const insertedMovements = await tx
              .insert(stockMovements)
              .values(input.movement)
              .returning();
            const insertedMovement = insertedMovements[0];

            if (!insertedMovement) {
              throw new Error("Stock movement insert returned no rows.");
            }

            const updatedMovements = await tx
              .update(stockMovements)
              .set({ sourceId: insertedMovement.id })
              .where(eq(stockMovements.id, insertedMovement.id))
              .returning();
            const movement = updatedMovements[0];

            if (!movement) {
              throw new Error("Stock movement source link update returned no rows.");
            }

            const { lines, ...header } = input.journalEntry;
            const insertedEntries = await tx
              .insert(journalEntries)
              .values({ ...header, sourceId: movement.id })
              .returning();
            const entry = insertedEntries[0];

            if (!entry) {
              throw new Error("Journal entry insert returned no rows.");
            }

            const journalLines = await tx
              .insert(journalEntryLines)
              .values(lines.map((line) => ({ ...line, entryId: entry.id })))
              .returning();

            return { entry, journalLines, movement };
          }),
        );
      }

      return { createStockIntake, insert, listByCompanyAndProduct };
    }),
  },
) {}
