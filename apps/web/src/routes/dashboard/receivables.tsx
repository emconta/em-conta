import { createFileRoute } from "@tanstack/react-router";
import ReceivablesPage from "@web/features/receivables/receivables.page";

export const Route = createFileRoute("/dashboard/receivables")({
  component: ReceivablesPage,
});
