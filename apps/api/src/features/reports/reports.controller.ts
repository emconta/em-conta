import { ReportsService, ReportsServiceError } from "@api/features/reports/reports.service";
import type { AppVariables, AuthVariables } from "@api/hono/appVariables.defs";
import runHonoHandler from "@api/hono/runHonoHandler";
import { ensureAuth } from "@api/http/middlewares/ensureAuth";
import { BalanceSheetQueryDto, CurrentLiquidityQueryDto, DreQueryDto } from "@dto/reports.dto";
import { Effect } from "effect";
import { Hono } from "hono";
import { validator } from "hono-openapi";

export const ReportsController = new Hono<AppVariables & AuthVariables>()
  .use(ensureAuth)
  .get("/dre", validator("query", DreQueryDto), async (c) =>
    runHonoHandler(
      c,
      ReportsService.getDreForUser({
        ...c.req.valid("query"),
        userId: c.get("user").id,
      }).pipe(
        Effect.map((report) => c.json(report)),
        Effect.catchIf(
          (err) => err instanceof ReportsServiceError,
          ({ code }) => Effect.succeed(c.json({ code }, 400)),
        ),
      ),
    ),
  )
  .get("/balance-sheet", validator("query", BalanceSheetQueryDto), async (c) =>
    runHonoHandler(
      c,
      ReportsService.getBalanceSheetForUser({
        ...c.req.valid("query"),
        userId: c.get("user").id,
      }).pipe(
        Effect.map((report) => c.json(report)),
        Effect.catchIf(
          (err) => err instanceof ReportsServiceError,
          ({ code }) => Effect.succeed(c.json({ code }, 400)),
        ),
      ),
    ),
  )
  .get("/current-liquidity", validator("query", CurrentLiquidityQueryDto), async (c) =>
    runHonoHandler(
      c,
      ReportsService.getCurrentLiquidityForUser({
        ...c.req.valid("query"),
        userId: c.get("user").id,
      }).pipe(
        Effect.map((report) => c.json(report)),
        Effect.catchIf(
          (err) => err instanceof ReportsServiceError,
          ({ code }) => Effect.succeed(c.json({ code }, 400)),
        ),
      ),
    ),
  );
