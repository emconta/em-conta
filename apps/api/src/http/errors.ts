import parseStandardSchemaIssues from "@api/util/parseStandardSchemaIssues";
import type { Context } from "hono";
import * as v from "valibot";

export const ApiErrorSchema = v.object({
  code: v.string(),
  message: v.string(),
});

export const ValidationIssueSchema = v.object({
  message: v.string(),
  path: v.optional(v.array(v.string())),
});

export const ValidationErrorSchema = v.object({
  code: v.literal("VALIDATION_ERROR"),
  message: v.literal("Request validation failed"),
  issues: v.array(ValidationIssueSchema),
});

export type ValidationErrorSchema = v.InferInput<typeof ValidationErrorSchema>;

export const UnauthorizedErrorSchema = v.object({
  ...ApiErrorSchema.entries,
  code: v.literal("UNAUTHORIZED"),
  message: v.literal("Unauthorized"),
});

export const InternalServerErrorSchema = v.object({
  ...ApiErrorSchema.entries,
  code: v.literal("INTERNAL_SERVER_ERROR"),
  message: v.literal("Internal server error"),
});

export const unauthorizedErrorBody = {
  code: "UNAUTHORIZED",
  message: "Unauthorized",
} as const;

export const internalServerErrorBody = {
  code: "INTERNAL_SERVER_ERROR",
  message: "Internal server error",
} as const;

export function validationErrorHook(
  result: {
    success: boolean;
    error?: readonly {
      message: string;
      path?: ReadonlyArray<PropertyKey | { key: PropertyKey }>;
    }[];
  },
  c: Context,
) {
  if (result.success) return;

  return c.json(
    {
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      issues: parseStandardSchemaIssues(result.error),
    },
    422,
  );
}
