import type { Runtime } from "@api/runtime";

export type AppVariables = {
  Bindings: Cloudflare.Env & {
    runtime: Runtime;
  };
};
