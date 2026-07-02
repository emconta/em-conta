import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getOnboardingStatusOptions } from "@web/features/onboarding/onboarding.queries";
import { authClient } from "@web/lib/auth";

export const Route = createFileRoute("/dashboard")({
  async beforeLoad(ctx) {
    const { data: me, error } = await authClient.getSession();

    if (error || !me) throw redirect({ to: "/login" });

    const statusResult = await ctx.context.queryClient.fetchQuery(getOnboardingStatusOptions);

    if (statusResult.isOk() && statusResult.value.status !== "onboarded")
      throw redirect({ to: "/onboarding" });

    return { me };
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
