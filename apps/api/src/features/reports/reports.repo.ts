import Database from "@api/db/database";
import { accounts, type AccountCategory, journalEntries, journalEntryLines } from "@api/db/schema";
import { and, asc, between, eq, inArray, lte, sql } from "drizzle-orm";
import { Effect } from "effect";

export type ReportLineWithAccount = {
  line: typeof journalEntryLines.$inferSelect;
  entry: typeof journalEntries.$inferSelect;
  account: typeof accounts.$inferSelect;
};

export type MonthlyRevenueExpensesRow = {
  month: string;
  accountCategory: AccountCategory;
  lineType: "debit" | "credit";
  amount: string;
};

export default class ReportsRepo extends Effect.Service<ReportsRepo>()("ReportsRepo", {
  effect: Effect.gen(function* () {
    const db = yield* Database;

    function listPostedLinesByCategories({
      companyId,
      categories,
      dateFrom,
      dateTo,
    }: {
      companyId: number;
      categories: AccountCategory[];
      dateFrom: Date;
      dateTo: Date;
    }) {
      return db.execute((q) =>
        q
          .select({ account: accounts, entry: journalEntries, line: journalEntryLines })
          .from(journalEntryLines)
          .innerJoin(journalEntries, eq(journalEntryLines.entryId, journalEntries.id))
          .innerJoin(accounts, eq(journalEntryLines.accountId, accounts.id))
          .where(
            and(
              eq(journalEntries.companyId, companyId),
              eq(journalEntries.status, "posted"),
              inArray(accounts.category, categories),
              between(journalEntries.entryDate, dateFrom, dateTo),
            ),
          )
          .orderBy(
            asc(journalEntries.entryDate),
            asc(journalEntries.id),
            asc(journalEntryLines.id),
          ),
      );
    }

    function listPostedLinesUpToDate({
      companyId,
      categories,
      dateTo,
    }: {
      companyId: number;
      categories: AccountCategory[];
      dateTo: Date;
    }) {
      return db.execute((q) =>
        q
          .select({ account: accounts, entry: journalEntries, line: journalEntryLines })
          .from(journalEntryLines)
          .innerJoin(journalEntries, eq(journalEntryLines.entryId, journalEntries.id))
          .innerJoin(accounts, eq(journalEntryLines.accountId, accounts.id))
          .where(
            and(
              eq(journalEntries.companyId, companyId),
              eq(journalEntries.status, "posted"),
              inArray(accounts.category, categories),
              lte(journalEntries.entryDate, dateTo),
            ),
          )
          .orderBy(
            asc(journalEntries.entryDate),
            asc(journalEntries.id),
            asc(journalEntryLines.id),
          ),
      );
    }

    function listMonthlyRevenueExpenses({
      companyId,
      dateFrom,
      dateTo,
    }: {
      companyId: number;
      dateFrom: Date;
      dateTo: Date;
    }) {
      return db.execute((q) =>
        q
          .select({
            month: sql<string>`to_char(${journalEntries.entryDate}, 'YYYY-MM')`.as("month"),
            accountCategory: accounts.category,
            lineType: journalEntryLines.type,
            amount: sql<string>`sum(${journalEntryLines.amount})`.as("amount"),
          })
          .from(journalEntryLines)
          .innerJoin(journalEntries, eq(journalEntryLines.entryId, journalEntries.id))
          .innerJoin(accounts, eq(journalEntryLines.accountId, accounts.id))
          .where(
            and(
              eq(journalEntries.companyId, companyId),
              eq(journalEntries.status, "posted"),
              inArray(accounts.category, ["revenue", "expenses"]),
              between(journalEntries.entryDate, dateFrom, dateTo),
            ),
          )
          .groupBy(
            sql`to_char(${journalEntries.entryDate}, 'YYYY-MM')`,
            accounts.category,
            journalEntryLines.type,
          )
          .orderBy(
            sql`to_char(${journalEntries.entryDate}, 'YYYY-MM')`,
            accounts.category,
            journalEntryLines.type,
          ),
      );
    }

    return { listPostedLinesByCategories, listPostedLinesUpToDate, listMonthlyRevenueExpenses };
  }),
}) {}
