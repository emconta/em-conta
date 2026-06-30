import { createFileRoute, redirect } from "@tanstack/react-router";
import LoginPage from "@web/features/auth/login/login.page";
import { authClient } from "@web/lib/auth";

export const Route = createFileRoute("/login")({
  async beforeLoad() {
    const { data: me } = await authClient.getSession();

    if (me) throw redirect({ from: "/dashboard" });
  },
  component: LoginPage,
});
