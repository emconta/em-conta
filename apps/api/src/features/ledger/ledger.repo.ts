import Database from "@api/db/database";
import { journalEntries, journalEntryLines } from "@api/db/schema";
import { Effect } from "effect";
import { and, asc, eq, sql } from "drizzle-orm";

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

    function getAccountBalance({ accountId, companyId }: { accountId: number; companyId: number }) {
      return db
        .execute((q) =>
          q
            .select({
              debitTotal: sql<string>`COALESCE(SUM(CASE WHEN ${journalEntryLines.type} = 'debit' THEN ${journalEntryLines.amount}::numeric ELSE 0 END), 0)`,
              creditTotal: sql<string>`COALESCE(SUM(CASE WHEN ${journalEntryLines.type} = 'credit' THEN ${journalEntryLines.amount}::numeric ELSE 0 END), 0)`,
            })
            .from(journalEntryLines)
            .innerJoin(journalEntries, eq(journalEntryLines.entryId, journalEntries.id))
            .where(
              and(
                eq(journalEntryLines.accountId, accountId),
                eq(journalEntries.companyId, companyId),
                eq(journalEntries.status, "posted"),
              ),
            ),
        )
        .pipe(Effect.map((rows) => rows[0] ?? { debitTotal: "0", creditTotal: "0" }));
    }

    return { getAccountBalance, listPostedLinesByAccount };
  }),
}) {}
