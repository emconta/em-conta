import {
  InternalServerErrorSchema,
  UnauthorizedErrorSchema,
  ValidationErrorSchema,
} from "@api/http/errors";
import { resolver } from "hono-openapi";

type ResolvableSchema = Parameters<typeof resolver>[0];
type ResolverOptions = Parameters<typeof resolver>[1];

type JsonResponseOptions = {
  resolver?: ResolverOptions;
  example?: unknown;
  examples?: Record<string, { summary?: string; value: unknown }>;
};

export function jsonResponse<Schema extends ResolvableSchema>(
  description: string,
  schema: Schema,
  options?: JsonResponseOptions,
) {
  return {
    description,
    content: {
      "application/json": {
        schema: resolver(schema, options?.resolver),
        ...(options?.example === undefined ? {} : { example: options.example }),
        ...(options?.examples === undefined ? {} : { examples: options.examples }),
      },
    },
  };
}

const responses = {
  validation: {
    schema: jsonResponse("Request validation failed", ValidationErrorSchema),
    status: 422,
  },
  unauthorized: {
    status: 401,
    schema: jsonResponse("Missing or invalid API key", UnauthorizedErrorSchema),
  },
  internalServerError: {
    status: 500,
    schema: jsonResponse("Unexpected internal error", InternalServerErrorSchema),
  },
};

export function errResponses(list: (keyof typeof responses)[] | "*") {
  return Object.fromEntries(
    list === "*"
      ? Object.values(responses).map((r) => [r.status, r.schema])
      : list.map((key) => [responses[key].status, responses[key].schema]),
  );
}
