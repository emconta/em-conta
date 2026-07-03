import { AccountsService } from "@api/features/accounts/accounts.service";
import type { AppVariables, AuthVariables } from "@api/hono/appVariables.defs";
import runHonoHandler from "@api/hono/runHonoHandler";
import { ensureAuth } from "@api/http/middlewares/ensureAuth";
import { Effect } from "effect";
import { Hono } from "hono";

export const AccountsController = new Hono<AppVariables & AuthVariables>()
  .use(ensureAuth)
  .get("/", async (c) =>
    runHonoHandler(
      c,
      AccountsService.listForUser({ userId: c.get("user").id }).pipe(
        Effect.map((accounts) => c.json(accounts)),
      ),
    ),
  );
