import type {
  InsertJournalEntry,
  InsertJournalEntryLine,
  JournalEntry,
  JournalEntryLine,
} from "@api/db/schema";
import AccountsRepo from "@api/features/accounts/accounts.repo";
import CompaniesRepo from "@api/features/companies/companies.repo";
import JournalRepo from "@api/features/journal/journal.repo";
import type {
  JournalEntryDetailDto,
  JournalEntryListItemDto,
  JournalListQueryDto,
} from "@dto/journal.dto";
import { Data, Effect } from "effect";

export type CreateJournalEntryInput = InsertJournalEntry & {
  lines: Omit<InsertJournalEntryLine, "entryId">[];
};

export class JournalService extends Effect.Service<JournalService>()("JournalService", {
  effect: Effect.gen(function* () {
    const accountsRepo = yield* AccountsRepo;
    const companiesRepo = yield* CompaniesRepo;
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

    function listForUser({ query, userId }: { query: JournalListQueryDto; userId: string }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId });

        if (!company) {
          return yield* Effect.fail(new ReadJournalEntryError({ code: "COMPANY_NOT_FOUND" }));
        }

        const filters = yield* parseFilters(query);
        const entries = yield* journalRepo.listEntriesByCompany({ companyId: company.id });
        const filteredEntries = entries.filter((entry) => matchesFilters(entry, filters));

        if (filteredEntries.length === 0) return [];

        const lines = yield* journalRepo.listLinesByEntries(
          filteredEntries.map((entry) => entry.id),
        );
        const linesByEntry = groupLinesByEntry(lines);
        const accountId = filters.accountId;

        return filteredEntries
          .filter((entry) => {
            if (!accountId) return true;

            return (
              linesByEntry.get(entry.id)?.some((line) => line.accountId === accountId) ?? false
            );
          })
          .sort((a, b) => b.entryDate.getTime() - a.entryDate.getTime())
          .map((entry) => toListItem(entry, linesByEntry.get(entry.id) ?? []));
      });
    }

    function getForUser({ id, userId }: { id: number; userId: string }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId });

        if (!company) {
          return yield* Effect.fail(new ReadJournalEntryError({ code: "COMPANY_NOT_FOUND" }));
        }

        const entry = yield* journalRepo.getEntry({ id });

        if (!entry || entry.companyId !== company.id) {
          return yield* Effect.fail(new ReadJournalEntryError({ code: "ENTRY_NOT_FOUND" }));
        }

        const accounts = yield* accountsRepo.listByCompany({ companyId: company.id });
        const accountNames = new Map(accounts.map((account) => [account.id, account.name]));
        const lines = yield* journalRepo.listLinesByEntry({ entryId: entry.id });
        const listItem = toListItem(entry, lines);

        return {
          ...listItem,
          lines: lines.map((line) => ({
            id: line.id,
            accountId: line.accountId,
            accountName: accountNames.get(line.accountId) ?? "Unknown account",
            amount: line.amount,
            description: line.description,
            type: line.type,
          })),
        } satisfies JournalEntryDetailDto;
      });
    }

    return { create, getForUser, listForUser };
  }),

  accessors: true,
}) {}

type JournalFilters = {
  accountId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  sourceType?: JournalListQueryDto["sourceType"];
};

function parseFilters(query: JournalListQueryDto) {
  return Effect.gen(function* () {
    const parsedDateFrom = query.dateFrom ? parseDate(query.dateFrom) : undefined;
    const parsedDateTo = query.dateTo ? parseDate(query.dateTo) : undefined;

    if ((query.dateFrom && !parsedDateFrom) || (query.dateTo && !parsedDateTo)) {
      return yield* Effect.fail(new ReadJournalEntryError({ code: "INVALID_FILTER" }));
    }

    const dateFrom = parsedDateFrom ?? undefined;
    const dateTo = parsedDateTo ?? undefined;

    return {
      accountId: query.accountId ? Number(query.accountId) : undefined,
      dateFrom,
      dateTo,
      search: query.search?.trim().toLowerCase() || undefined,
      sourceType: query.sourceType,
    } satisfies JournalFilters;
  });
}

function parseDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function matchesFilters(entry: JournalEntry, filters: JournalFilters) {
  if (filters.sourceType && entry.sourceType !== filters.sourceType) return false;
  if (filters.dateFrom && entry.entryDate < filters.dateFrom) return false;
  if (filters.dateTo && entry.entryDate > filters.dateTo) return false;

  if (filters.search) {
    const haystack = [entry.memo, entry.sourceType, entry.sourceId?.toString()]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(filters.search)) return false;
  }

  return true;
}

function groupLinesByEntry(lines: JournalEntryLine[]) {
  const grouped = new Map<number, JournalEntryLine[]>();

  for (const line of lines) {
    const entryLines = grouped.get(line.entryId) ?? [];

    entryLines.push(line);
    grouped.set(line.entryId, entryLines);
  }

  return grouped;
}

function toListItem(
  entry: JournalEntry,
  lines: Pick<InsertJournalEntryLine, "amount" | "type">[],
): JournalEntryListItemDto {
  let totalDebits = 0n;
  let totalCredits = 0n;

  for (const line of lines) {
    const cents = amountToCents(line.amount) ?? 0n;

    if (line.type === "debit") totalDebits += cents;
    else totalCredits += cents;
  }

  return {
    id: entry.id,
    entryDate: entry.entryDate.toISOString(),
    memo: entry.memo,
    sourceId: entry.sourceId,
    sourceType: entry.sourceType,
    status: entry.status,
    totalCredits: centsToMoney(totalCredits),
    totalDebits: centsToMoney(totalDebits),
  };
}

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

function centsToMoney(cents: bigint) {
  const units = cents / 100n;
  const decimals = (cents % 100n).toString().padStart(2, "0");

  return `${units}.${decimals}`;
}

export class ReadJournalEntryError extends Data.TaggedError("ReadJournalEntryError")<{
  readonly code: "COMPANY_NOT_FOUND" | "ENTRY_NOT_FOUND" | "INVALID_FILTER";
}> {}

export class CreateJournalEntryError extends Data.TaggedError("CreateJournalEntryError")<{
  readonly code: "EMPTY_LINES" | "INVALID_ACCOUNT" | "INVALID_AMOUNT" | "UNBALANCED_ENTRY";
}> {}
