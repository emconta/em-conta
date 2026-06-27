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

app.get("/api/v1/health", async (c) => c.text("OK"));

// OpenAPI
app
  .get("/api/v1/openapi.json", openAPIRouteHandler(app, openApiSpecOptions))
  .get("/api/v1/docs", scalar);

export default app;

export type App = typeof app;
