import { CreateSaleError, ReadSaleError, SalesService } from "@api/features/sales/sales.service";
import type { AppVariables, AuthVariables } from "@api/hono/appVariables.defs";
import runHonoHandler from "@api/hono/runHonoHandler";
import { ensureAuth } from "@api/http/middlewares/ensureAuth";
import { CreateSaleDto } from "@dto/sales.dto";
import { Effect } from "effect";
import { Hono } from "hono";
import { validator } from "hono-openapi";

export const SalesController = new Hono<AppVariables & AuthVariables>()
  .use(ensureAuth)
  .get("/", async (c) =>
    runHonoHandler(
      c,
      SalesService.listForUser({ userId: c.get("user").id }).pipe(
        Effect.map((sales) => c.json(sales)),
      ),
    ),
  )
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));

    if (!Number.isInteger(id) || id <= 0) return c.json({ code: "INVALID_ID" }, 400);

    return runHonoHandler(
      c,
      SalesService.getForUser({ id, userId: c.get("user").id }).pipe(
        Effect.map((sale) => c.json(sale)),
        Effect.catchIf(
          (err) => err instanceof ReadSaleError,
          ({ code }) => Effect.succeed(c.json({ code }, 404)),
        ),
      ),
    );
  })
  .post("/", validator("json", CreateSaleDto), async (c) =>
    runHonoHandler(
      c,
      SalesService.createForUser({ ...c.req.valid("json"), userId: c.get("user").id }).pipe(
        Effect.map((sale) => c.json(sale, 201)),
        Effect.catchIf(
          (err) => err instanceof CreateSaleError,
          ({ code }) => Effect.succeed(c.json({ code }, 400)),
        ),
      ),
    ),
  );
