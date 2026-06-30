import app from "@api/app";
import { makeRuntime } from "@api/runtime";

export default {
  async fetch(request, env): Promise<Response> {
    const { runtime } = makeRuntime(env);

    return app.fetch(request, {
      ...env,
      runtime,
    });
  },
} satisfies ExportedHandler<Env>;
