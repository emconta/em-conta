import "dotenv/config";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "postgresql",

	dbCredentials: {
		url: process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE,
	},

	casing: "snake_case",

	schema: "./src/db/schema/*.ts",
	out: "./src/db/migrations",
});
