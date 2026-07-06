import { createFileRoute } from "@tanstack/react-router";
import AccountsPage from "@web/features/accounts/accounts.page";

export const Route = createFileRoute("/dashboard/accounts")({
  component: AccountsPage,
});
