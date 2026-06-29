import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "@web/lib/auth";

export const Route = createFileRoute("/dashboard")({
  async beforeLoad() {
    const { data: me, error } = await authClient.getSession();

    if (error || !me) throw redirect({ to: "/login" });

    return { me };
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
