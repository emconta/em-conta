import { JournalService } from "@api/features/journal/journal.service";
import type { AppVariables, AuthVariables } from "@api/hono/appVariables.defs";
import runHonoHandler from "@api/hono/runHonoHandler";
import { ensureAuth } from "@api/http/middlewares/ensureAuth";
import { JournalListQueryDto } from "@dto/journal.dto";
import { Effect } from "effect";
import { Hono } from "hono";
import { validator } from "hono-openapi";

export const JournalController = new Hono<AppVariables & AuthVariables>()
  .use(ensureAuth)
  .get("/", validator("query", JournalListQueryDto), async (c) =>
    runHonoHandler(
      c,
      JournalService.listForUser({
        userId: c.get("user").id,
        query: c.req.valid("query"),
      }).pipe(Effect.map((entries) => c.json(entries))),
    ),
  )
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ code: "INVALID_ID" }, 400);
    }

    return runHonoHandler(
      c,
      JournalService.getForUser({ id, userId: c.get("user").id }).pipe(
        Effect.map((entry) => c.json(entry)),
      ),
    );
  });
