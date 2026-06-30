import { hc } from "hono/client";
import type { App } from "@api/app";

const client = hc<App>(import.meta.env.VITE_API_URL, {
  init: {
    credentials: "include",
  },
});

export const api = client.api.v1;
