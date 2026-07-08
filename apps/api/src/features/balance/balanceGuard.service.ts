import type { Account, InsertJournalEntryLine } from "@api/db/schema";
import { isCashOrBankType } from "@api/features/accounts/accountTypes";
import AccountsRepo from "@api/features/accounts/accounts.repo";
import LedgerRepo from "@api/features/ledger/ledger.repo";
import { Data, Effect } from "effect";

export type CheckBalanceInput = {
  companyId: number;
  lines: Pick<InsertJournalEntryLine, "accountId" | "type" | "amount">[];
  accountsById?: Map<number, Pick<Account, "id" | "name" | "type">>;
};

export function parseMoneyToCents(amount: string): bigint | null {
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) return null;

  const [units = "0", cents = ""] = amount.split(".");
  const value = BigInt(units) * 100n + BigInt(cents.padEnd(2, "0"));

  return value > 0n ? value : null;
}

export function computeCashBankCredits(
  lines: Pick<InsertJournalEntryLine, "accountId" | "type" | "amount">[],
  accountsById: Map<number, Pick<Account, "id" | "name" | "type">>,
): Map<number, bigint> {
  const proposedCreditsByAccount = new Map<number, bigint>();

  for (const line of lines) {
    if (line.type !== "credit") continue;

    const account = accountsById.get(line.accountId);

    if (!account || !isCashOrBankType(account.type)) continue;

    const cents = parseMoneyToCents(line.amount);

    if (cents === null || cents <= 0n) continue;

    const current = proposedCreditsByAccount.get(line.accountId) ?? 0n;
    proposedCreditsByAccount.set(line.accountId, current + cents);
  }

  return proposedCreditsByAccount;
}

export class BalanceGuardService extends Effect.Service<BalanceGuardService>()(
  "BalanceGuardService",
  {
    effect: Effect.gen(function* () {
      const accountsRepo = yield* AccountsRepo;
      const ledgerRepo = yield* LedgerRepo;

      function checkCashBankBalance(input: CheckBalanceInput) {
        return Effect.gen(function* () {
          let accountsById = input.accountsById;

          if (!accountsById) {
            const companyAccounts = yield* accountsRepo.listByCompany({
              companyId: input.companyId,
            });
            accountsById = new Map<number, Account>();

            for (const account of companyAccounts) {
              accountsById.set(account.id, account);
            }
          }

          const proposedCreditsByAccount = computeCashBankCredits(input.lines, accountsById);

          if (proposedCreditsByAccount.size === 0) return;

          for (const [accountId, totalProposedCredit] of proposedCreditsByAccount) {
            const result = yield* ledgerRepo.getAccountBalance({
              accountId,
              companyId: input.companyId,
            });

            const currentBalance =
              (parseMoneyToCents(result.debitTotal) ?? 0n) -
              (parseMoneyToCents(result.creditTotal) ?? 0n);
            const newBalance = currentBalance - totalProposedCredit;

            if (newBalance < 0n) {
              const account = accountsById.get(accountId);
              return yield* Effect.fail(
                new InsufficientBalanceError({
                  accountId,
                  accountName: account?.name ?? "Unknown",
                  shortfall: formatCents(-newBalance),
                }),
              );
            }
          }
        });
      }

      return { checkCashBankBalance };
    }),
    accessors: true,
  },
) {}

export class InsufficientBalanceError extends Data.TaggedError("InsufficientBalanceError")<{
  readonly accountId: number;
  readonly accountName: string;
  readonly shortfall: string;
}> {}

function formatCents(cents: bigint) {
  const units = cents / 100n;
  const decimals = (cents % 100n).toString().padStart(2, "0");
  return `${units}.${decimals}`;
}
