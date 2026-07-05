import { createFileRoute } from "@tanstack/react-router";
import CurrentLiquidityPage from "@web/features/reports/current-liquidity.page";

export const Route = createFileRoute("/dashboard/reports/current-liquidity")({
  component: CurrentLiquidityPage,
});
