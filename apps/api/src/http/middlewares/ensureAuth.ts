import type { AppVariables } from "@api/hono/appVariables.defs";
import { createMiddleware } from "hono/factory";

export const ensureAuth = createMiddleware<AppVariables>(async (c, next) => {
  if (!c.get("user")) return c.body("Unauthenticated", 401);

  await next();
});
