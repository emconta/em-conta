import { CreateReceiptError, ReceiptsService } from "@api/features/receipts/receipts.service";
import type { AppVariables, AuthVariables } from "@api/hono/appVariables.defs";
import runHonoHandler from "@api/hono/runHonoHandler";
import { ensureAuth } from "@api/http/middlewares/ensureAuth";
import { CreateReceiptDto } from "@dto/receipts.dto";
import { Effect } from "effect";
import { Hono } from "hono";
import { validator } from "hono-openapi";

export const ReceiptsController = new Hono<AppVariables & AuthVariables>()
  .use(ensureAuth)
  .post("/", validator("json", CreateReceiptDto), async (c) =>
    runHonoHandler(
      c,
      ReceiptsService.createForUser({ ...c.req.valid("json"), userId: c.get("user").id }).pipe(
        Effect.map((receipt) => c.json(receipt, 201)),
        Effect.catchIf(
          (err) => err instanceof CreateReceiptError,
          ({ code }) => Effect.succeed(c.json({ code }, 400)),
        ),
      ),
    ),
  );
