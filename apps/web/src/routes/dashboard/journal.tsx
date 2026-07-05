import { createFileRoute } from "@tanstack/react-router";
import JournalPage from "@web/features/journal/journal.page";

export const Route = createFileRoute("/dashboard/journal")({
  component: JournalPage,
});
