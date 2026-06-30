import { resolve } from "node:path";
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" },
      },
    },
  },

  resolve: {
    alias: {
      "@api": resolve(import.meta.dirname, "src"),
    },
  },
});
