import type { AppVariables } from "@api/hono/appVariables.defs";
import type { AppLayer } from "@api/runtime";
import { Effect } from "effect";
import type { Context } from "hono";

export default function runHonoHandler<Env extends AppVariables, A, E>(
  c: Context<Env>,
  effect: Effect.Effect<A, E, AppLayer> | (() => Effect.Effect<A, E, AppLayer>),
): Promise<A | Response> {
  return c.env.runtime.runPromise(
    (typeof effect === "function" ? effect() : effect).pipe(
      Effect.tapError(Effect.logError),
      Effect.catchAll(() => Effect.succeed(c.body(null, 500))),
    ),
  );
}
