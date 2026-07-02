import type { App } from "@api/app";
import { hc } from "hono/client";

const client = hc<App>(import.meta.env.VITE_API_URL, {
  init: {
    credentials: "include",
  },
});

export const api = client.api.v1;
