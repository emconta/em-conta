import Database from "@api/db/database";
import {
  type InsertJournalEntry,
  type InsertJournalEntryLine,
  journalEntries,
  journalEntryLines,
  type JournalEntry,
} from "@api/db/schema";
import { Effect, Array as EffArray } from "effect";

export default class JournalRepo extends Effect.Service<JournalRepo>()("JournalRepo", {
  effect: Effect.gen(function* () {
    const db = yield* Database;

    function insertEntry(entry: InsertJournalEntry) {
      return db
        .execute((q) => q.insert(journalEntries).values(entry).returning())
        .pipe(Effect.map(EffArray.head));
    }

    function insertLines(lines: InsertJournalEntryLine[]) {
      return db.execute((q) => q.insert(journalEntryLines).values(lines).returning());
    }

    function createEntryWithLines(
      entry: InsertJournalEntry,
      lines: Omit<InsertJournalEntryLine, "entryId">[],
    ) {
      return db.execute((q) =>
        q.transaction(async (tx) => {
          const insertedEntries = await tx.insert(journalEntries).values(entry).returning();
          const insertedEntry = insertedEntries[0];

          if (!insertedEntry) {
            throw new Error("Journal entry insert returned no rows.");
          }

          const insertedLines = await tx
            .insert(journalEntryLines)
            .values(lines.map((line) => ({ ...line, entryId: insertedEntry.id })))
            .returning();

          return { entry: insertedEntry, lines: insertedLines };
        }),
      );
    }

    function getEntry({ id }: Pick<JournalEntry, "id">) {
      return db.execute((q) =>
        q.query.journalEntries.findFirst({
          where(fields, operators) {
            return operators.eq(fields.id, id);
          },
        }),
      );
    }

    function listEntriesByCompany({ companyId }: Pick<JournalEntry, "companyId">) {
      return db.execute((q) =>
        q.query.journalEntries.findMany({
          where(fields, operators) {
            return operators.eq(fields.companyId, companyId);
          },
        }),
      );
    }

    function listLinesByEntry({ entryId }: Pick<InsertJournalEntryLine, "entryId">) {
      return db.execute((q) =>
        q.query.journalEntryLines.findMany({
          where(fields, operators) {
            return operators.eq(fields.entryId, entryId);
          },
        }),
      );
    }

    return {
      createEntryWithLines,
      getEntry,
      insertEntry,
      insertLines,
      listEntriesByCompany,
      listLinesByEntry,
    };
  }),
}) {}
