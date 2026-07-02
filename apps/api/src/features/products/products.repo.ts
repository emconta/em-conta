import Database from "@api/db/database";
import { type InsertProduct, type Product, products } from "@api/db/schema";
import { Effect, Array as EffArray } from "effect";

export default class ProductsRepo extends Effect.Service<ProductsRepo>()("ProductsRepo", {
  effect: Effect.gen(function* () {
    const db = yield* Database;

    function insert(product: InsertProduct) {
      return db
        .execute((q) => q.insert(products).values(product).returning())
        .pipe(Effect.map(EffArray.head));
    }

    function getByCompanyAndId({ companyId, id }: Pick<Product, "companyId" | "id">) {
      return db.execute((q) =>
        q.query.products.findFirst({
          where(fields, operators) {
            return operators.and(
              operators.eq(fields.companyId, companyId),
              operators.eq(fields.id, id),
            );
          },
        }),
      );
    }

    function listByCompany({ companyId }: Pick<Product, "companyId">) {
      return db.execute((q) =>
        q.query.products.findMany({
          where(fields, operators) {
            return operators.eq(fields.companyId, companyId);
          },
        }),
      );
    }

    return { getByCompanyAndId, insert, listByCompany };
  }),
}) {}
