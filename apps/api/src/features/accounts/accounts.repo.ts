import Database from "@api/db/database";
import { accounts, type InsertAccount } from "@api/db/schema";
import { Effect, Array as ErrArray } from "effect";

export default class AccountsRepo extends Effect.Service<AccountsRepo>()("AccountsRepo", {
  effect: Effect.gen(function* () {
    const db = yield* Database;

    function insert(account: InsertAccount) {
      return db
        .execute((q) => q.insert(accounts).values(account).returning())
        .pipe(Effect.map(ErrArray.head));
    }

    return { insert };
  }),
}) {}
