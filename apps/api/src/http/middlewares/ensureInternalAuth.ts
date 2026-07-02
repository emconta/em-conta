import type { AppVariables } from "@api/hono/appVariables.defs";
import { createMiddleware } from "hono/factory";

export const ensureInternalAuth = createMiddleware<AppVariables>(async (c, next) => {
  const providedSecret = c.req.header("x-internal-api-secret");

  if (!providedSecret || providedSecret !== c.env.INTERNAL_API_SECRET) {
    return c.body("Unauthorized", 401);
  }

  await next();
});
