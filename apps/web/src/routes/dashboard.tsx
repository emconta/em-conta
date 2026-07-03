import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { Button } from "@web/components/ui/button";
import { getOnboardingStatusOptions } from "@web/features/onboarding/onboarding.queries";
import { authClient } from "@web/lib/auth";
import { cn } from "@web/lib/utils";
import { BookOpenIcon, BoxesIcon, LayoutDashboardIcon, ReceiptTextIcon } from "lucide-react";

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
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const links = [
    { to: "/dashboard", label: "Resumo", icon: LayoutDashboardIcon },
    { to: "/dashboard/products", label: "Produtos", icon: BoxesIcon },
    { to: "/dashboard/sales", label: "Vendas", icon: ReceiptTextIcon },
    { to: "/api/v1/docs", label: "API docs", icon: BookOpenIcon, external: true },
  ] as const;

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="flex flex-col gap-4 rounded-2xl bg-background p-4 ring-1 ring-border md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">em-conta</p>
            <h1 className="text-2xl font-semibold tracking-tight">Operação comercial</h1>
          </div>

          <nav className="flex flex-wrap gap-2">
            {links.map(({ external, icon: Icon, label, to }) =>
              external ? (
                <Button key={to} variant="outline" asChild>
                  <a href={to} target="_blank" rel="noreferrer">
                    <Icon data-icon="inline-start" />
                    {label}
                  </a>
                </Button>
              ) : (
                <Button
                  key={to}
                  variant={pathname === to ? "default" : "outline"}
                  asChild
                  className={cn(pathname === to && "pointer-events-none")}
                >
                  <Link to={to}>
                    <Icon data-icon="inline-start" />
                    {label}
                  </Link>
                </Button>
              ),
            )}
          </nav>
        </header>

        <Outlet />
      </div>
    </main>
  );
}
