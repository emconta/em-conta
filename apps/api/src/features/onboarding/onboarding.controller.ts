import OnboardingService from "@api/features/onboarding/onboarding.service";
import type { AppVariables, AuthVariables } from "@api/hono/appVariables.defs";
import runHonoHandler from "@api/hono/runHonoHandler";
import { ensureAuth } from "@api/http/middlewares/ensureAuth";
import { FinishOnboardingDto } from "@dto/onboarding.dto";
import { Effect } from "effect";
import { Hono } from "hono";
import { validator } from "hono-openapi";

export const OnboardingController = new Hono<AppVariables & AuthVariables>()
  .use(ensureAuth)
  .get("/status", async (c) =>
    runHonoHandler(
      c,
      OnboardingService.getStatus({ userId: c.get("user").id }).pipe(
        Effect.map((status) => c.json(status)),
      ),
    ),
  )
  .post("/", validator("json", FinishOnboardingDto), async (c) =>
    runHonoHandler(c, () => {
      const company = c.req.valid("json");
      const user = c.get("user");

      return OnboardingService.finish({ ...company, userId: user.id }).pipe(
        Effect.map(({ id }) => c.json({ id }, 201)),
        Effect.catchIf(
          (err) => err._tag === "InsertCompaniesRepoError" && err.code === "CNPJ_ALREADY_EXISTS",
          ({ code }) => Effect.succeed(c.json({ code }, 400)),
        ),
      );
    }),
  );
