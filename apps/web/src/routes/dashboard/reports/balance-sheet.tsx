import { createFileRoute } from "@tanstack/react-router";
import BalanceSheetPage from "@web/features/reports/balance-sheet.page";

export const Route = createFileRoute("/dashboard/reports/balance-sheet")({
  component: BalanceSheetPage,
});
