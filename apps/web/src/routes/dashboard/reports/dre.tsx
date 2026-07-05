import { createFileRoute } from "@tanstack/react-router";
import DrePage from "@web/features/reports/dre.page";

export const Route = createFileRoute("/dashboard/reports/dre")({
  component: DrePage,
});
