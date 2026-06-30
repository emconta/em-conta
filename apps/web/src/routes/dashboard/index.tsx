import { createFileRoute } from "@tanstack/react-router";
import DashboardPage from "@web/features/dashboard/dashboard.page";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});
