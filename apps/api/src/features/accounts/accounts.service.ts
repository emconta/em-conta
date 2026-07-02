import type { DatabaseError } from "@api/db/errors/databaseError";
import type { Account, AccountCategory, AccountInChart, InsertAccount } from "@api/db/schema";
import AccountsRepo from "@api/features/accounts/accounts.repo";
import AccountsChartsRepo from "@api/features/accountsCharts/accountsCharts.repo";
import { Data, Effect, Option } from "effect";

export class AccountsService extends Effect.Service<AccountsService>()("AccountsService", {
  effect: Effect.gen(function* () {
    const accountsChartsRepo = yield* AccountsChartsRepo;
    const accountsRepo = yield* AccountsRepo;

    function createAccountTree({
      accounts,
      category,
      companyId,
      parentId,
    }: {
      accounts: AccountInChart[];
      category: AccountCategory;
      companyId: number;
      parentId?: number;
    }): Effect.Effect<Account[], DatabaseError> {
      return Effect.gen(function* () {
        const createdAccounts: Account[] = [];

        for (const account of accounts) {
          const accountToInsert: InsertAccount = {
            name: account.name,
            description: account.description,
            nature: account.nature,
            category,
            companyId,
            parentId,
          };

          const createdAccount = yield* accountsRepo
            .insert(accountToInsert)
            .pipe(Effect.map(Option.getOrThrow));

          createdAccounts.push(createdAccount);

          if (account.children?.length) {
            const createdChildren = yield* createAccountTree({
              accounts: account.children,
              category,
              companyId,
              parentId: createdAccount.id,
            });

            createdAccounts.push(...createdChildren);
          }
        }

        return createdAccounts;
      });
    }

    function createFromChart({ chartId, companyId }: { chartId: number; companyId: number }) {
      return Effect.gen(function* () {
        const accountsChart = yield* accountsChartsRepo.get({ id: chartId });

        if (!accountsChart) {
          return yield* Effect.fail(
            new CreateFromChartAccountsServiceError({ code: "CHART_NOT_FOUND" }),
          );
        }

        const createdAccounts: Account[] = [];

        for (const [category, accounts] of Object.entries(accountsChart.chart) as [
          AccountCategory,
          AccountInChart[],
        ][]) {
          const createdCategoryAccounts = yield* createAccountTree({
            accounts,
            category,
            companyId,
          });

          createdAccounts.push(...createdCategoryAccounts);
        }

        return createdAccounts;
      });
    }

    return { createFromChart };
  }),
}) {}

export class CreateFromChartAccountsServiceError extends Data.TaggedError(
  "CreateFromChartAccountsServiceError",
)<{
  readonly code: "CHART_NOT_FOUND";
}> {}
