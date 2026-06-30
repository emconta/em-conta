import Database from "@api/db/database";
import * as schema from "@api/db/schema/auth";
import Env from "@api/env";
import { getCorsOrigins } from "@api/hono/getCorsOrigins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { Effect } from "effect";

export function createAuth() {
  return Effect.gen(function* () {
    const env = yield* Env;
    const { $drizzle } = yield* Database;

    const baseURL = new URL(env.BETTER_AUTH_URL);

    return betterAuth({
      baseURL: baseURL.toString(),
      secret: env.BETTER_AUTH_SECRET,
      trustedOrigins: getCorsOrigins(env.CORS_ORIGINS),
      database: drizzleAdapter($drizzle, {
        provider: "pg",
        schema,
      }),
      socialProviders: {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      },
      advanced: {
        crossSubDomainCookies: {
          enabled: true,
          domain: baseURL.hostname
            .split(".")
            .slice(-2, baseURL.hostname.split(".").length)
            .join("."),
        },
        useSecureCookies: baseURL.protocol === "https:",
      },
    });
  });
}

export type Auth = Effect.Effect.Success<ReturnType<typeof createAuth>>;
export type AuthSession = Auth["$Infer"]["Session"];
