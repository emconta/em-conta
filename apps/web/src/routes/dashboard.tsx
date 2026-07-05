import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "@web/components/app-sidebar";
import { SiteHeader } from "@web/components/site-header";
import { SidebarInset, SidebarProvider } from "@web/components/ui/sidebar";
import { TooltipProvider } from "@web/components/ui/tooltip";
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

const pageTitles: Record<string, string> = {
  "/dashboard": "Resumo",
  "/dashboard/journal": "Lançamentos",
  "/dashboard/ledger": "Razão",
  "/dashboard/products": "Produtos",
  "/dashboard/sales": "Vendas",
  "/dashboard/reports/dre": "DRE",
  "/dashboard/reports/balance-sheet": "Balanço Patrimonial",
  "/dashboard/reports/current-liquidity": "Liquidez Corrente",
};

function RouteComponent() {
  const { me } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const normalizedPathname = pathname.replace(/\/$/, "") || "/dashboard";
  const title = pageTitles[normalizedPathname] ?? "Dashboard";

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar user={me.user} />
        <SidebarInset>
          <SiteHeader title={title} />
          <div className="flex flex-1 flex-col gap-6 bg-muted/30 p-4 md:p-6">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
