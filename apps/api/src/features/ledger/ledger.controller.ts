import { LedgerService, LedgerServiceError } from "@api/features/ledger/ledger.service";
import type { AppVariables, AuthVariables } from "@api/hono/appVariables.defs";
import runHonoHandler from "@api/hono/runHonoHandler";
import { ensureAuth } from "@api/http/middlewares/ensureAuth";
import { Effect } from "effect";
import { Hono } from "hono";

export const LedgerController = new Hono<AppVariables & AuthVariables>()
  .use(ensureAuth)
  .get("/", async (c) => {
    const accountId = Number(c.req.param("id"));

    if (!Number.isInteger(accountId) || accountId <= 0) {
      return c.json({ code: "INVALID_ID" }, 400);
    }

    return runHonoHandler(
      c,
      LedgerService.getForUser({ accountId, userId: c.get("user").id }).pipe(
        Effect.map((ledger) => c.json(ledger)),
        Effect.catchIf(
          (err) => err instanceof LedgerServiceError,
          ({ code }) => Effect.succeed(c.json({ code }, code === "ACCOUNT_NOT_FOUND" ? 404 : 400)),
        ),
      ),
    );
  });
