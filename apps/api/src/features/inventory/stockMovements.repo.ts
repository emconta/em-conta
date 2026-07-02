import Database from "@api/db/database";
import { type InsertStockMovement, type StockMovement, stockMovements } from "@api/db/schema";
import { Effect, Array as EffArray } from "effect";

export default class StockMovementsRepo extends Effect.Service<StockMovementsRepo>()(
  "StockMovementsRepo",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database;

      function insert(movement: InsertStockMovement) {
        return db
          .execute((q) => q.insert(stockMovements).values(movement).returning())
          .pipe(Effect.map(EffArray.head));
      }

      function listByCompanyAndProduct({
        companyId,
        productId,
      }: Pick<StockMovement, "companyId" | "productId">) {
        return db.execute((q) =>
          q.query.stockMovements.findMany({
            where(fields, operators) {
              return operators.and(
                operators.eq(fields.companyId, companyId),
                operators.eq(fields.productId, productId),
              );
            },
          }),
        );
      }

      return { insert, listByCompanyAndProduct };
    }),
  },
) {}
