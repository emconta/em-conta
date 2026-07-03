import type { DatabaseError } from "@api/db/errors/databaseError";
import type { Account, AccountCategory, AccountInChart, InsertAccount } from "@api/db/schema";
import AccountsRepo from "@api/features/accounts/accounts.repo";
import AccountsChartsRepo from "@api/features/accountsCharts/accountsCharts.repo";
import CompaniesRepo from "@api/features/companies/companies.repo";
import { Data, Effect, Option } from "effect";

export class AccountsService extends Effect.Service<AccountsService>()("AccountsService", {
  effect: Effect.gen(function* () {
    const accountsChartsRepo = yield* AccountsChartsRepo;
    const accountsRepo = yield* AccountsRepo;
    const companiesRepo = yield* CompaniesRepo;

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
            key: account.key ?? null,
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

    function listForUser({ userId }: { userId: string }) {
      return Effect.gen(function* () {
        const company = yield* companiesRepo.getFromUser({ userId });

        if (!company) {
          return yield* Effect.fail(new ListAccountsServiceError({ code: "COMPANY_NOT_FOUND" }));
        }

        const accounts = yield* accountsRepo.listByCompany({ companyId: company.id });

        return accounts.map((account) => ({
          id: account.id,
          name: account.name,
          key: account.key,
          description: account.description,
          category: account.category,
          nature: account.nature,
          parentId: account.parentId,
        }));
      });
    }

    return { createFromChart, listForUser };
  }),

  accessors: true,
}) {}

export class CreateFromChartAccountsServiceError extends Data.TaggedError(
  "CreateFromChartAccountsServiceError",
)<{
  readonly code: "CHART_NOT_FOUND";
}> {}

export class ListAccountsServiceError extends Data.TaggedError("ListAccountsServiceError")<{
  readonly code: "COMPANY_NOT_FOUND";
}> {}
