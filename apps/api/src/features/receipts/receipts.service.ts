import type { Account, InsertReceipt } from "@api/db/schema";
import AccountsRepo from "@api/features/accounts/accounts.repo";
import ReceiptsRepo, { type ReceiptJournalEntry } from "@api/features/receipts/receipts.repo";
import SalesRepo from "@api/features/sales/sales.repo";
import { Data, Effect } from "effect";

export type CreateReceiptInput = {
  companyId: number;
  saleId: number;
  receiptDate: Date;
  amount: string;
  cashAccountId: number;
  notes?: string | null;
};

export class ReceiptsService extends Effect.Service<ReceiptsService>()("ReceiptsService", {
  effect: Effect.gen(function* () {
    const accountsRepo = yield* AccountsRepo;
    const receiptsRepo = yield* ReceiptsRepo;
    const salesRepo = yield* SalesRepo;

    function create(input: CreateReceiptInput) {
      return Effect.gen(function* () {
        const amount = moneyToCents(input.amount);

        if (amount === null || amount <= 0n) {
          return yield* Effect.fail(new CreateReceiptError({ code: "INVALID_AMOUNT" }));
        }

        const sale = yield* salesRepo.getByCompanyAndId({
          companyId: input.companyId,
          id: input.saleId,
        });

        if (sale?.status !== "posted") {
          return yield* Effect.fail(new CreateReceiptError({ code: "SALE_NOT_FOUND" }));
        }

        if (sale.paymentTerms !== "credit") {
          return yield* Effect.fail(new CreateReceiptError({ code: "SALE_NOT_ON_CREDIT" }));
        }

        const companyAccounts = yield* accountsRepo.listByCompany({ companyId: input.companyId });
        const cashAccount = yield* resolveCashAccount(input.cashAccountId, companyAccounts);
        const accountsReceivable = yield* accountsRepo.getByCompanyAndKey({
          companyId: input.companyId,
          key: "accounts_receivable",
        });

        if (!accountsReceivable) {
          return yield* Effect.fail(new CreateReceiptError({ code: "MISSING_ACCOUNT" }));
        }

        const receipts = yield* receiptsRepo.listByCompanyAndSale({
          companyId: input.companyId,
          saleId: input.saleId,
        });
        const received = yield* sumReceived(receipts.map((receipt) => receipt.amount));
        const saleTotal = moneyToCents(sale.netAmount);

        if (saleTotal === null) {
          return yield* Effect.fail(new CreateReceiptError({ code: "INVALID_AMOUNT" }));
        }

        if (received + amount > saleTotal) {
          return yield* Effect.fail(new CreateReceiptError({ code: "OVER_RECEIPT" }));
        }

        const receipt: InsertReceipt = {
          companyId: input.companyId,
          saleId: input.saleId,
          receiptDate: input.receiptDate,
          amount: centsToMoney(amount),
          cashAccountId: cashAccount.id,
          notes: input.notes ?? null,
        };

        const journalEntry: Omit<ReceiptJournalEntry, "sourceId"> = {
          companyId: input.companyId,
          sourceType: "receipt",
          entryDate: input.receiptDate,
          memo: input.notes ?? "Credit sale receipt",
          status: "posted",
          lines: [
            { accountId: cashAccount.id, type: "debit", amount: centsToMoney(amount) },
            { accountId: accountsReceivable.id, type: "credit", amount: centsToMoney(amount) },
          ],
        };

        const posted = yield* receiptsRepo.createPostedReceipt({ receipt, journalEntry });

        return {
          receiptId: posted.receipt.id,
          journalEntryId: posted.journalEntry.entry.id,
        };
      });
    }

    return { create };
  }),
}) {}

function resolveCashAccount(cashAccountId: number, companyAccounts: Account[]) {
  return Effect.gen(function* () {
    const account = companyAccounts.find((candidate) => candidate.id === cashAccountId);

    if (!account || (account.key !== "cash" && account.key !== "bank_checking")) {
      return yield* Effect.fail(new CreateReceiptError({ code: "INVALID_CASH_ACCOUNT" }));
    }

    return account;
  });
}

function sumReceived(amounts: string[]) {
  return Effect.gen(function* () {
    let total = 0n;

    for (const amount of amounts) {
      const cents = moneyToCents(amount);

      if (cents === null) {
        return yield* Effect.fail(new CreateReceiptError({ code: "INVALID_AMOUNT" }));
      }

      total += cents;
    }

    return total;
  });
}

function moneyToCents(amount: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) return null;

  const [units = "0", cents = ""] = amount.split(".");

  return BigInt(units) * 100n + BigInt(cents.padEnd(2, "0"));
}

function centsToMoney(cents: bigint) {
  const units = cents / 100n;
  const decimals = (cents % 100n).toString().padStart(2, "0");

  return `${units}.${decimals}`;
}

export class CreateReceiptError extends Data.TaggedError("CreateReceiptError")<{
  readonly code:
    | "INVALID_AMOUNT"
    | "INVALID_CASH_ACCOUNT"
    | "MISSING_ACCOUNT"
    | "OVER_RECEIPT"
    | "SALE_NOT_FOUND"
    | "SALE_NOT_ON_CREDIT";
}> {}
