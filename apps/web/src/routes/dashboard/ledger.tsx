import { createFileRoute } from "@tanstack/react-router";
import LedgerPage from "@web/features/ledger/ledger.page";

export const Route = createFileRoute("/dashboard/ledger")({
  component: LedgerPage,
});
