import { seedSimpleAccountsChart } from "@api/db/seeds/accountsCharts.seed";
import type { AppVariables } from "@api/hono/appVariables.defs";
import runHonoHandler from "@api/hono/runHonoHandler";
import { ensureInternalAuth } from "@api/http/middlewares/ensureInternalAuth";
import { Effect } from "effect";
import { Hono } from "hono";

export const InternalController = new Hono<AppVariables>()
  .use(ensureInternalAuth)
  .post("/seeds/accounts-chart", async (c) =>
    runHonoHandler(
      c,
      seedSimpleAccountsChart.pipe(
        Effect.map(({ chart, created }) =>
          c.json({ id: chart.id, name: chart.name, created }, created ? 201 : 200),
        ),
      ),
    ),
  );
