import type { AuthSession } from "@api/auth";
import type { Runtime } from "@api/runtime";

export type AppVariables = {
  Bindings: Cloudflare.Env & {
    runtime: Runtime;
  };
  Variables: {
    user: AuthSession["user"] | null;
    session: AuthSession["session"] | null;
  };
};
