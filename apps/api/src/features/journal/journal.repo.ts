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

    return { getEntry, insertEntry, insertLines, listEntriesByCompany, listLinesByEntry };
  }),
}) {}
