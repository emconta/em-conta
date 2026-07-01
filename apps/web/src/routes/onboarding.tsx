import { createFileRoute, redirect } from "@tanstack/react-router";
import OnboardingPage from "@web/features/onboarding/onboarding.page";
import { getOnboardingStatusOptions } from "@web/features/onboarding/onboarding.queries";

export const Route = createFileRoute("/onboarding")({
  async beforeLoad(ctx) {
    const { status } = await ctx.context.queryClient.fetchQuery(getOnboardingStatusOptions);

    if (status !== "pending") throw redirect({ to: "/dashboard" });
  },
  component: OnboardingPage,
});
