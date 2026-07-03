import { createFileRoute } from "@tanstack/react-router";
import SalesPage from "@web/features/sales/sales.page";

export const Route = createFileRoute("/dashboard/sales")({
  component: SalesPage,
});
