import type { api } from "@web/lib/api";
import { type ClassValue, clsx } from "clsx";
import {
  type ClientResponse,
  type DetailedError,
  type InferResponseType,
  parseResponse,
} from "hono/client";
import type {
  ClientErrorStatusCode,
  ServerErrorStatusCode,
  SuccessStatusCode,
} from "hono/utils/http-status";
import { ResultAsync } from "neverthrow";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ensureNullable<T>(value: T | null | undefined): T | null {
  return value ?? null;
}
type InferErrorResponse<T> = NonNullable<
  InferResponseType<T, ClientErrorStatusCode | ServerErrorStatusCode>
>;

type ClientHandler = (...args: any[]) => Promise<ClientResponse<unknown>>;

type InferSuccessResponse<T> =
  InferResponseType<T, SuccessStatusCode> extends never
    ? undefined
    : InferResponseType<T, SuccessStatusCode>;

export function callApi<T extends ClientHandler>(handler: T, ...args: Parameters<T>) {
  return (params?: { mapError?: (err: InferErrorResponse<T>) => unknown }) => {
    return ResultAsync.fromPromise(parseResponse(handler(...args)), (err) => {
      const detailedError = err as DetailedError;
      const { data } = detailedError.detail as { data: InferErrorResponse<T> };

      return params?.mapError?.(data) ?? { code: "UNEXPECTED_ERROR" as const };
    });
  };
}

export type InferErrorCodeResponse<T> = Extract<
  InferResponseType<typeof api.onboarding.$post>,
  { code: string }
>["code"];
