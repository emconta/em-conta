import CompaniesRepo from "@api/features/companies/companies.repo";
import type { FinishOnboardingDto } from "@dto/onboarding.dto";
import { Effect, Option } from "effect";

export default class OnboardingService extends Effect.Service<OnboardingService>()(
  "OnboardingService",
  {
    effect: Effect.gen(function* () {
      const companiesRepo = yield* CompaniesRepo;

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
        return companiesRepo.insert(data).pipe(Effect.map(Option.getOrThrow));
      }

      return {
        getStatus,
        finish,
      };
    }),

    accessors: true,
  },
) {}
