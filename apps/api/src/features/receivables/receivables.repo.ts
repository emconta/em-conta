import Database from "@api/db/database";
import { receipts, sales } from "@api/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { Effect } from "effect";

export type CreditSaleWithReceipts = {
  saleId: number;
  issueDate: Date;
  customerName: string | null;
  description: string | null;
  netAmount: string;
  receivedAmount: string;
  receiptCount: number;
};

export default class ReceivablesRepo extends Effect.Service<ReceivablesRepo>()("ReceivablesRepo", {
  effect: Effect.gen(function* () {
    const db = yield* Database;

    function listCreditSalesWithReceipts({ companyId }: { companyId: number }) {
      return db.execute(async (q) => {
        const result = await q
          .select({
            saleId: sales.id,
            issueDate: sales.issueDate,
            customerName: sales.customerName,
            description: sales.description,
            netAmount: sales.netAmount,
            receivedAmount: sql<string>`COALESCE(SUM(${receipts.amount}), '0.00')`.as(
              "received_amount",
            ),
            receiptCount: sql<number>`COUNT(${receipts.id})`.as("receipt_count"),
          })
          .from(sales)
          .leftJoin(receipts, eq(receipts.saleId, sales.id))
          .where(
            and(
              eq(sales.companyId, companyId),
              eq(sales.paymentTerms, "credit"),
              eq(sales.status, "posted"),
            ),
          )
          .groupBy(sales.id)
          .orderBy(sales.issueDate);

        return result;
      });
    }

    return { listCreditSalesWithReceipts };
  }),
}) {}
