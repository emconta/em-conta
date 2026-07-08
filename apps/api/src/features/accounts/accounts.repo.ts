import Database from "@api/db/database";
import { type Account, accounts, type InsertAccount } from "@api/db/schema";
import type { AccountType } from "@api/features/accounts/accountTypes";
import { Effect, Array as ErrArray } from "effect";

export default class AccountsRepo extends Effect.Service<AccountsRepo>()("AccountsRepo", {
  effect: Effect.gen(function* () {
    const db = yield* Database;

    function getByCompanyAndType({
      companyId,
      type,
    }: Pick<Account, "companyId"> & { type: AccountType }) {
      return db.execute((q) =>
        q.query.accounts.findFirst({
          where(fields, operators) {
            return operators.and(
              operators.eq(fields.companyId, companyId),
              operators.eq(fields.type, type),
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

    return { getByCompanyAndType, insert, listByCompany };
  }),
}) {}
