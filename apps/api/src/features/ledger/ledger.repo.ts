import Database from "@api/db/database";
import { journalEntries, journalEntryLines } from "@api/db/schema";
import { Effect } from "effect";
import { and, asc, eq } from "drizzle-orm";

export type LedgerLineWithEntry = {
  line: typeof journalEntryLines.$inferSelect;
  entry: typeof journalEntries.$inferSelect;
};

export default class LedgerRepo extends Effect.Service<LedgerRepo>()("LedgerRepo", {
  effect: Effect.gen(function* () {
    const db = yield* Database;

    function listPostedLinesByAccount({
      accountId,
      companyId,
    }: {
      accountId: number;
      companyId: number;
    }) {
      return db.execute((q) =>
        q
          .select({ entry: journalEntries, line: journalEntryLines })
          .from(journalEntryLines)
          .innerJoin(journalEntries, eq(journalEntryLines.entryId, journalEntries.id))
          .where(
            and(
              eq(journalEntryLines.accountId, accountId),
              eq(journalEntries.companyId, companyId),
              eq(journalEntries.status, "posted"),
            ),
          )
          .orderBy(
            asc(journalEntries.entryDate),
            asc(journalEntries.id),
            asc(journalEntryLines.id),
          ),
      );
    }

    return { listPostedLinesByAccount };
  }),
}) {}
