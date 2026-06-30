import app from "@api/app";
import { describe, expect, it } from "vitest";

const env = {
  runtime: {
    runPromise: async () => ({
      api: {
        getSession: async () => null,
      },
    }),
  },
};

describe("API app", () => {
  it("responds to health checks", async () => {
    const response = await app.fetch(new Request("http://example.com/api/v1/health"), env);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
  });
});
