import Database from "@api/db/database";
import type { AccountsChart } from "@api/db/schema";
import { Effect } from "effect";

export default class AccountsChartsRepo extends Effect.Service<AccountsChartsRepo>()(
  "AccountsChartsRepo",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database;

      function get({ id }: Pick<AccountsChart, "id">) {
        return db.execute((q) =>
          q.query.accountsCharts.findFirst({
            where(fields, operators) {
              return operators.eq(fields.id, id);
            },
          }),
        );
      }

      function getFirst() {
        return db.execute((q) => q.query.accountsCharts.findFirst());
      }

      return { get, getFirst };
    }),
  },
) {}
