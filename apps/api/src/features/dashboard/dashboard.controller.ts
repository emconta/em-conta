import { DashboardService, DashboardServiceError } from "@api/features/dashboard/dashboard.service";
import type { AppVariables, AuthVariables } from "@api/hono/appVariables.defs";
import runHonoHandler from "@api/hono/runHonoHandler";
import { ensureAuth } from "@api/http/middlewares/ensureAuth";
import { MonthlyRevenueExpensesQueryDto } from "@dto/dashboard.dto";
import { Effect } from "effect";
import { Hono } from "hono";
import { validator } from "hono-openapi";

export const DashboardController = new Hono<AppVariables & AuthVariables>()
  .use(ensureAuth)
  .get("/", async (c) =>
    runHonoHandler(
      c,
      DashboardService.getSummaryForUser({
        userId: c.get("user").id,
      }).pipe(
        Effect.map((summary) => c.json(summary)),
        Effect.catchIf(
          (err) => err instanceof DashboardServiceError,
          ({ code }) => Effect.succeed(c.json({ code }, 400)),
        ),
      ),
    ),
  )
  .get("/monthly-revenue-expenses", validator("query", MonthlyRevenueExpensesQueryDto), async (c) => {
    const { months } = c.req.valid("query");

    return runHonoHandler(
      c,
      DashboardService.getMonthlyRevenueExpenses({
        userId: c.get("user").id,
        months: months ? Number(months) : 12,
      }).pipe(
        Effect.map((data) => c.json(data)),
        Effect.catchIf(
          (err) => err instanceof DashboardServiceError,
          ({ code }) => Effect.succeed(c.json({ code }, 400)),
        ),
      ),
    );
  });
