import { createAuth } from "@api/auth";
import { AccountsController } from "@api/features/accounts/accounts.controller";
import { InternalController } from "@api/features/internal/internal.controller";
import { JournalController } from "@api/features/journal/journal.controller";
import { OnboardingController } from "@api/features/onboarding/onboarding.controller";
import { ProductsController } from "@api/features/products/products.controller";
import { ReceiptsController } from "@api/features/receipts/receipts.controller";
import { SalesController } from "@api/features/sales/sales.controller";
import type { AppVariables } from "@api/hono/appVariables.defs";
import { getCorsOrigins } from "@api/hono/getCorsOrigins";
import { scalar } from "@api/http/openapi/scalar";
import { openApiSpecOptions } from "@api/http/openapi/spec";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { openAPIRouteHandler } from "hono-openapi";

const app = new Hono<AppVariables>();

app.use(
  "/api/*",
  cors({
    origin: (origin, c) => {
      const allowedOrigins = getCorsOrigins(c.env.CORS_ORIGINS);

      return allowedOrigins.includes(origin) ? origin : null;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use("*", async (c, next) => {
  if (new URL(c.req.url).pathname.startsWith("/api/auth/")) {
    c.set("user", null);
    c.set("session", null);

    return await next();
  }

  const auth = await c.env.runtime.runPromise(createAuth());
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);

  await next();
});

app.on(["GET", "POST"], "/api/auth/*", async (c) => {
  const auth = await c.env.runtime.runPromise(createAuth());

  return auth.handler(c.req.raw);
});

const routes = app
  .get("/api/v1/health", async (c) => c.text("OK"))
  .route("/api/v1/accounts", AccountsController)
  .route("/api/v1/internal", InternalController)
  .route("/api/v1/journal", JournalController)
  .route("/api/v1/onboarding", OnboardingController)
  .route("/api/v1/products", ProductsController)
  .route("/api/v1/receipts", ReceiptsController)
  .route("/api/v1/sales", SalesController);

// OpenAPI
routes
  .get("/api/v1/openapi.json", openAPIRouteHandler(app, openApiSpecOptions))
  .get("/api/v1/docs", scalar);

export default app;

export type App = typeof routes;
