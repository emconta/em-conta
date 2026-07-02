import { AccountsService } from "@api/features/accounts/accounts.service";
import AccountsChartsRepo from "@api/features/accountsCharts/accountsCharts.repo";
import CompaniesRepo from "@api/features/companies/companies.repo";
import type { FinishOnboardingDto } from "@dto/onboarding.dto";
import { Data, Effect, Option } from "effect";

export default class OnboardingService extends Effect.Service<OnboardingService>()(
  "OnboardingService",
  {
    effect: Effect.gen(function* () {
      const companiesRepo = yield* CompaniesRepo;
      const accountsChartsRepo = yield* AccountsChartsRepo;
      const accountsService = yield* AccountsService;

      function getStatus(data: { userId: string }) {
        return companiesRepo
          .getFromUser(data)
          .pipe(
            Effect.map((it) =>
              it ? { status: "onboarded" as const } : { status: "pending" as const },
            ),
          );
      }

      function finish(data: FinishOnboardingDto & { userId: string }) {
        return Effect.gen(function* () {
          const createdCompany = yield* companiesRepo
            .insert(data)
            .pipe(Effect.map(Option.getOrThrow));

          const accountsChart = yield* accountsChartsRepo.getFirst();

          if (!accountsChart)
            return yield* Effect.fail(
              new FinishOnboardingServiceError({ code: "NO_CHART_CREATED" }),
            );

          yield* accountsService.createFromChart({
            chartId: accountsChart.id,
            companyId: createdCompany.id,
          });

          return createdCompany;
        });
      }

      return {
        getStatus,
        finish,
      };
    }),

    accessors: true,
  },
) {}

export class FinishOnboardingServiceError extends Data.TaggedError("FinishOnboardingServiceError")<{
  readonly code: "NO_CHART_CREATED";
}> {}
