import { ProductsService, ProductsServiceError } from "@api/features/products/products.service";
import type { AppVariables, AuthVariables } from "@api/hono/appVariables.defs";
import runHonoHandler from "@api/hono/runHonoHandler";
import { ensureAuth } from "@api/http/middlewares/ensureAuth";
import { CreateProductDto } from "@dto/products.dto";
import { Effect } from "effect";
import { Hono } from "hono";
import { validator } from "hono-openapi";

export const ProductsController = new Hono<AppVariables & AuthVariables>()
  .use(ensureAuth)
  .get("/", async (c) =>
    runHonoHandler(
      c,
      ProductsService.listForUser({ userId: c.get("user").id }).pipe(
        Effect.map((products) => c.json(products)),
      ),
    ),
  )
  .post("/", validator("json", CreateProductDto), async (c) =>
    runHonoHandler(
      c,
      ProductsService.createForUser({ ...c.req.valid("json"), userId: c.get("user").id }).pipe(
        Effect.map((product) => c.json(product, 201)),
        Effect.catchIf(
          (err) => err instanceof ProductsServiceError,
          ({ code }) => Effect.succeed(c.json({ code }, 400)),
        ),
      ),
    ),
  );
