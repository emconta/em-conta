import type { InsertJournalEntry, InsertJournalEntryLine } from "@api/db/schema";
import AccountsRepo from "@api/features/accounts/accounts.repo";
import JournalRepo from "@api/features/journal/journal.repo";
import { Data, Effect } from "effect";

export type CreateJournalEntryInput = InsertJournalEntry & {
  lines: Omit<InsertJournalEntryLine, "entryId">[];
};

export class JournalService extends Effect.Service<JournalService>()("JournalService", {
  effect: Effect.gen(function* () {
    const accountsRepo = yield* AccountsRepo;
    const journalRepo = yield* JournalRepo;

    function create(input: CreateJournalEntryInput) {
      return Effect.gen(function* () {
        if (input.lines.length === 0) {
          return yield* Effect.fail(new CreateJournalEntryError({ code: "EMPTY_LINES" }));
        }

        const totals = yield* sumLines(input.lines);

        if (totals.debit === 0n || totals.debit !== totals.credit) {
          return yield* Effect.fail(new CreateJournalEntryError({ code: "UNBALANCED_ENTRY" }));
        }

        const companyAccounts = yield* accountsRepo.listByCompany({ companyId: input.companyId });
        const companyAccountIds = new Set(companyAccounts.map((account) => account.id));

        if (input.lines.some((line) => !companyAccountIds.has(line.accountId))) {
          return yield* Effect.fail(new CreateJournalEntryError({ code: "INVALID_ACCOUNT" }));
        }

        const { lines, ...entry } = input;

        return yield* journalRepo.createEntryWithLines(entry, lines);
      });
    }

    return { create };
  }),
}) {}

function sumLines(lines: Omit<InsertJournalEntryLine, "entryId">[]) {
  return Effect.gen(function* () {
    let debit = 0n;
    let credit = 0n;

    for (const line of lines) {
      const cents = amountToCents(line.amount);

      if (cents === null) {
        return yield* Effect.fail(new CreateJournalEntryError({ code: "INVALID_AMOUNT" }));
      }

      if (line.type === "debit") {
        debit += cents;
      } else {
        credit += cents;
      }
    }

    return { credit, debit };
  });
}

function amountToCents(amount: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) return null;

  const [units = "0", cents = ""] = amount.split(".");
  const value = BigInt(units) * 100n + BigInt(cents.padEnd(2, "0"));

  return value > 0n ? value : null;
}

export class CreateJournalEntryError extends Data.TaggedError("CreateJournalEntryError")<{
  readonly code: "EMPTY_LINES" | "INVALID_ACCOUNT" | "INVALID_AMOUNT" | "UNBALANCED_ENTRY";
}> {}
