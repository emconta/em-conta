import { authClient } from "@web/lib/auth";
import { err, ok, ResultAsync } from "neverthrow";
import { queryOptions, useQuery } from "@tanstack/react-query";

function redirectUri() {
  return ResultAsync.fromSafePromise(authClient.signIn.social({ provider: "google" })).andThen(
    ({ data, error }) =>
      error ? err({ code: "GET_REDIRECT_URI_ERROR" as const, cause: error }) : ok(data),
  );
}

const getRedirectUriOptions = queryOptions({
  queryKey: ["auth", "oauth", "get-redirect-uri"],
  queryFn: async () => {
    const result = await redirectUri();

    if (result.isOk()) return result.value;

    throw result.error;
  },
});

export const useRedirectUri = (options?: Partial<typeof getRedirectUriOptions>) =>
  useQuery({ ...getRedirectUriOptions, ...options });
