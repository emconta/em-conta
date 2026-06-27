import type { AppVariables } from "@api/hono/appVariables.defs";
import { internalServerErrorBody } from "@api/http/errors";
import type { AppLayer } from "@api/runtime";
import { Effect } from "effect";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import * as v from "valibot";

type ResponseSchema = v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>;
type Response<S extends ResponseSchema = ResponseSchema> = {
  status: ContentfulStatusCode;
  schema: S;
};

export default function runHonoHandler<A extends ResponseSchema, E>(
  c: Context<AppVariables>,
  effect:
    | Effect.Effect<v.InferInput<A>, E, AppLayer>
    | (() => Effect.Effect<v.InferInput<A>, E, AppLayer>),
  options: {
    success: Response<A> & { map?: (input: v.InferInput<A>) => unknown };
    error?: Partial<{
      [K in Extract<E, { _tag: string }>["_tag"]]: Partial<{
        default: Response;
        cases: Partial<Record<Extract<E, { code: string; _tag: K }>["code"], Response>>;
        map: (input: Extract<E, { _tag: K }>) => unknown;
      }>;
    }>;
  },
) {
  function jsonResponse(input: unknown, response: Response, c: Context) {
    return Effect.try({
      try: () => v.parse(response.schema, input),
      catch: (error) => {
        if (error instanceof v.ValiError) return error;
        throw error;
      },
    }).pipe(Effect.map((it) => c.json(it, response.status)));
  }

  return c.env.runtime.runPromise(
    (typeof effect === "function" ? effect() : effect).pipe(
      Effect.map((it) => (options.success.map ? options.success.map(it) : it)),
      Effect.flatMap((it) => jsonResponse(it, options.success, c)),
      Effect.catchAll((error) => {
        const taggedErrorResult = v.safeParse(
          v.object({ _tag: v.string(), code: v.string() }),
          error,
        );

        const taggedError = taggedErrorResult.success ? taggedErrorResult.output : null;

        const errorConfig = options.error?.[taggedError?._tag as keyof typeof options.error];

        if (!taggedError || !errorConfig) return Effect.fail(error);

        // biome-ignore lint/suspicious/noExplicitAny: _
        const mappedError = errorConfig.map?.(taggedError as any) || error;

        const responseCase =
          errorConfig.cases?.[taggedError.code as keyof typeof errorConfig.cases] ||
          errorConfig.default;

        if (!responseCase) return Effect.fail(error);

        return jsonResponse(mappedError, responseCase, c);
      }),
      Effect.tapError(Effect.logError),
      Effect.catchAll(() => Effect.succeed(c.json(internalServerErrorBody, 500))),
    ),
  );
}
