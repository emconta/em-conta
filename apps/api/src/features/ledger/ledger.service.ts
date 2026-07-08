import type { Account, AccountNature } from "@api/db/schema";
import AccountsRepo from "@api/features/accounts/accounts.repo";
import CompaniesRepo from "@api/features/companies/companies.repo";
import type { LedgerLineWithEntry } from "@api/features/ledger/ledger.repo";
import LedgerRepo from "@api/features/ledger/ledger.repo";
import type { AccountLedgerDto } from "@dto/ledger.dto";
import { Data, Effect } from "effect";

export class LedgerService extends Effect.Service<LedgerService>()("LedgerService", {
  effect: Effect.gen(function* () {
    const accountsRepo = yield* AccountsRepo;
    const companiesRepo = yield* CompaniesRepo;
    const ledgerRepo = yield* LedgerRepo;

    function getForUser({ accountId, userId }: { accountId: number; userId: string }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId });

        if (!company) {
          return yield* Effect.fail(new LedgerServiceError({ code: "COMPANY_NOT_FOUND" }));
        }

        const account = yield* accountsRepo
          .listByCompany({ companyId: company.id })
          .pipe(
            Effect.map(
              (accounts) => accounts.find((candidate) => candidate.id === accountId) ?? null,
            ),
          );

        if (!account) {
          return yield* Effect.fail(new LedgerServiceError({ code: "ACCOUNT_NOT_FOUND" }));
        }

        const rowsWithEntry = yield* ledgerRepo.listPostedLinesByAccount({
          accountId,
          companyId: company.id,
        });

        return buildLedgerDto(account, rowsWithEntry);
      });
    }

    return { getForUser };
  }),

  accessors: true,
}) {}

export class LedgerServiceError extends Data.TaggedError("LedgerServiceError")<{
  readonly code: "COMPANY_NOT_FOUND" | "ACCOUNT_NOT_FOUND";
}> {}

export function buildLedgerDto(
  account: Pick<Account, "id" | "name" | "type" | "nature">,
  rowsWithEntry: LedgerLineWithEntry[],
): AccountLedgerDto {
  const openingBalance = moneyFromCents(0n);
  let runningBalance = 0n;
  const nature = account.nature;

  // The repo already orders rows; this sort is a safety net for unit tests and callers.
  const sortedRows = [...rowsWithEntry].sort((a, b) => {
    const dateA = a.entry?.entryDate.getTime() ?? 0;
    const dateB = b.entry?.entryDate.getTime() ?? 0;

    if (dateA !== dateB) return dateA - dateB;

    const entryIdA = a.entry?.id ?? 0;
    const entryIdB = b.entry?.id ?? 0;

    if (entryIdA !== entryIdB) return entryIdA - entryIdB;

    return a.line.id - b.line.id;
  });

  const movementRows = sortedRows.map(({ entry, line }) => {
    const cents = moneyToCents(line.amount);
    const debit = line.type === "debit" ? cents : 0n;
    const credit = line.type === "credit" ? cents : 0n;

    runningBalance = updateRunningBalance(runningBalance, nature, debit, credit);

    return {
      entryId: entry?.id ?? null,
      entryDate: entry?.entryDate.toISOString() ?? null,
      memo: buildMemo(entry, line),
      sourceType: entry?.sourceType ?? null,
      debit: moneyFromCents(debit),
      credit: moneyFromCents(credit),
      balance: moneyFromCents(runningBalance),
    };
  });

  const openingRow = {
    entryId: null,
    entryDate: null,
    memo: "Saldo inicial",
    sourceType: null,
    debit: "0.00",
    credit: "0.00",
    balance: openingBalance,
  };

  return {
    accountId: account.id,
    accountName: account.name,
    accountType: account.type,
    accountNature: nature,
    openingBalance,
    rows: [openingRow, ...movementRows],
  };
}

function buildMemo(
  entry: { memo: string | null; sourceType: string } | null,
  line: { description: string | null },
) {
  const parts = [entry?.memo, line.description].filter(Boolean);

  if (parts.length > 0) return parts.join(" — ");

  return null;
}

export function updateRunningBalance(
  previous: bigint,
  nature: AccountNature,
  debit: bigint,
  credit: bigint,
) {
  if (nature === "debit") {
    return previous + debit - credit;
  }

  return previous + credit - debit;
}

export function moneyToCents(amount: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
    throw new Error(`Invalid ledger amount: ${amount}`);
  }

  const [units = "0", cents = ""] = amount.split(".");

  return BigInt(units) * 100n + BigInt(cents.padEnd(2, "0"));
}

export function moneyFromCents(cents: bigint) {
  const negative = cents < 0n;
  const absoluteCents = negative ? -cents : cents;
  const units = absoluteCents / 100n;
  const decimals = (absoluteCents % 100n).toString().padStart(2, "0");

  return negative ? `-${units}.${decimals}` : `${units}.${decimals}`;
}
