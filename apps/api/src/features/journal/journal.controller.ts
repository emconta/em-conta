import { CreateJournalEntryError, JournalService } from "@api/features/journal/journal.service";
import type { AppVariables, AuthVariables } from "@api/hono/appVariables.defs";
import runHonoHandler from "@api/hono/runHonoHandler";
import { ensureAuth } from "@api/http/middlewares/ensureAuth";
import { CreateManualJournalEntryDto, JournalListQueryDto } from "@dto/journal.dto";
import { Effect } from "effect";
import { Hono } from "hono";
import { validator } from "hono-openapi";

export const JournalController = new Hono<AppVariables & AuthVariables>()
  .use(ensureAuth)
  .post("/", validator("json", CreateManualJournalEntryDto), async (c) =>
    runHonoHandler(
      c,
      JournalService.createManualForUser({ ...c.req.valid("json"), userId: c.get("user").id }).pipe(
        Effect.map((entry) => c.json(entry, 201)),
        Effect.catchIf(
          (err) => err instanceof CreateJournalEntryError,
          ({ code }) => Effect.succeed(c.json({ code }, 400)),
        ),
      ),
    ),
  )
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
