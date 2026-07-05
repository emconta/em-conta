import CompaniesRepo from "@api/features/companies/companies.repo";
import ReceivablesRepo from "@api/features/receivables/receivables.repo";
import { Data, Effect } from "effect";

export type ReceivableItem = {
  saleId: number;
  issueDate: string;
  customerName: string | null;
  description: string | null;
  netAmount: string;
  receivedAmount: string;
  outstandingAmount: string;
  receiptCount: number;
};

export class ReceivablesService extends Effect.Service<ReceivablesService>()("ReceivablesService", {
  effect: Effect.gen(function* () {
    const companiesRepo = yield* CompaniesRepo;
    const receivablesRepo = yield* ReceivablesRepo;

    function listForUser({ userId }: { userId: string }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId });

        if (!company) {
          return yield* Effect.fail(new ReceivablesError({ code: "COMPANY_NOT_FOUND" }));
        }

        const rows = yield* receivablesRepo.listCreditSalesWithReceipts({
          companyId: company.id,
        });

        const items: ReceivableItem[] = rows.map((row) => {
          const net = Number(row.netAmount);
          const received = Number(row.receivedAmount);

          return {
            saleId: row.saleId,
            issueDate:
              row.issueDate instanceof Date ? row.issueDate.toISOString() : String(row.issueDate),
            customerName: row.customerName,
            description: row.description,
            netAmount: row.netAmount,
            receivedAmount: row.receivedAmount,
            outstandingAmount: (net - received).toFixed(2),
            receiptCount: row.receiptCount,
          };
        });

        return items;
      });
    }

    return { listForUser };
  }),

  accessors: true,
}) {}

export class ReceivablesError extends Data.TaggedError("ReceivablesError")<{
  readonly code: "COMPANY_NOT_FOUND";
}> {}
