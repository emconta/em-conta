import Database from "@api/db/database";
import { type Account, type AccountKey, accounts, type InsertAccount } from "@api/db/schema";
import { Effect, Array as ErrArray } from "effect";

export default class AccountsRepo extends Effect.Service<AccountsRepo>()("AccountsRepo", {
  effect: Effect.gen(function* () {
    const db = yield* Database;

    function getByCompanyAndKey({
      companyId,
      key,
    }: Pick<Account, "companyId"> & { key: AccountKey }) {
      return db.execute((q) =>
        q.query.accounts.findFirst({
          where(fields, operators) {
            return operators.and(
              operators.eq(fields.companyId, companyId),
              operators.eq(fields.key, key),
            );
          },
        }),
      );
    }

    function listByCompany({ companyId }: Pick<Account, "companyId">) {
      return db.execute((q) =>
        q.query.accounts.findMany({
          where(fields, operators) {
            return operators.eq(fields.companyId, companyId);
          },
        }),
      );
    }

    function insert(account: InsertAccount) {
      return db
        .execute((q) => q.insert(accounts).values(account).returning())
        .pipe(Effect.map(ErrArray.head));
    }

    return { getByCompanyAndKey, insert, listByCompany };
  }),
}) {}
