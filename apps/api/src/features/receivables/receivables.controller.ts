import {
  ReceivablesError,
  ReceivablesService,
} from "@api/features/receivables/receivables.service";
import type { AppVariables, AuthVariables } from "@api/hono/appVariables.defs";
import runHonoHandler from "@api/hono/runHonoHandler";
import { ensureAuth } from "@api/http/middlewares/ensureAuth";
import { Effect } from "effect";
import { Hono } from "hono";

export const ReceivablesController = new Hono<AppVariables & AuthVariables>()
  .use(ensureAuth)
  .get("/", async (c) =>
    runHonoHandler(
      c,
      ReceivablesService.listForUser({ userId: c.get("user").id }).pipe(
        Effect.map((items) => c.json(items)),
        Effect.catchIf(
          (err) => err instanceof ReceivablesError,
          ({ code }) => Effect.succeed(c.json({ code }, 400)),
        ),
      ),
    ),
  );
