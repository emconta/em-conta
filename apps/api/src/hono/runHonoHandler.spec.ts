import runHonoHandler from "@api/hono/runHonoHandler";
import { Effect, Layer, ManagedRuntime } from "effect";
import type { Context } from "hono";
import * as v from "valibot";
import { describe, expect, it, vi } from "vitest";

const context = {
  env: {
    runtime: ManagedRuntime.make(Layer.empty),
  },
  json: vi.fn((body: unknown, status: number) => Response.json(body, { status })),
} as unknown as Context;

describe("runHonoHandler", () => {
  it("valid effect succes value validation", async () => {
    const successSchema = v.object({
      text: v.string(),
    });

    const result = await runHonoHandler(context, Effect.succeed({ text: "" }), {
      success: {
        schema: successSchema,
        status: 200,
      },
    });

    expect(result.status).toBe(200);
  });

  it("error when success schema is invalid", async () => {
    const successSchema = v.object({
      number: v.number(),
    });

    const result = await runHonoHandler(
      context,
      //@ts-expect-error Wrong for tests purposes
      Effect.succeed({ text: "" }),
      {
        success: {
          schema: successSchema,
          status: 200,
        },
      },
    );

    expect(result.status).toBe(500);
  });

  it("error correctly mapped to its case", async () => {
    const result = await runHonoHandler(
      context,
      Effect.gen(function* () {
        yield* Effect.fail({
          _tag: "ExampleError" as const,
          code: "ERROR_CODE" as const,
        });

        return { foo: "bar" };
      }),
      {
        success: {
          schema: v.object({ foo: v.string() }),
          status: 200,
        },
        error: {
          ExampleError: {
            cases: {
              ERROR_CODE: {
                schema: v.object({ code: v.literal("ERROR_CODE") }),
                status: 400,
              },
            },
          },
        },
      },
    );

    expect(result.status).toBe(400);
    expect(await result.json()).toEqual({ code: "ERROR_CODE" });
  });

  it("unkown error mapped to default 500", async () => {
    const result = await runHonoHandler(
      context,
      Effect.gen(function* () {
        yield* Effect.fail(new Error());

        return { foo: "bar" };
      }),
      {
        success: {
          status: 200,
          schema: v.any(),
        },
      },
    );

    expect(result.status).toBe(500);
    expect(await result.json()).toEqual({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    });
  });

  it("error map correctly applied", async () => {
    const result = await runHonoHandler(
      context,
      Effect.gen(function* () {
        yield* Effect.fail({
          _tag: "ExampleError" as const,
          code: "ERROR_CODE" as const,
        });

        return { foo: "bar" };
      }),
      {
        success: {
          status: 200,
          schema: v.any(),
        },
        error: {
          ExampleError: {
            cases: {
              ERROR_CODE: {
                schema: v.object({
                  code: v.literal("ERROR_CODE"),
                  message: v.string(),
                }),
                status: 400,
              },
            },
            map: ({ code }) => ({ code, message: "mapped message." }),
          },
        },
      },
    );

    expect(result.status).toBe(400);
    expect(await result.json()).toEqual({
      code: "ERROR_CODE",
      message: "mapped message.",
    });
  });
});
