import "dotenv/config";

import Database from "@api/db/database";
import { seedSimpleAccountsChart } from "@api/db/seeds/accountsCharts.seed";
import Env from "@api/env";
import { Layer, Logger, ManagedRuntime } from "effect";

const connectionString = process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE;

if (!connectionString) {
  throw new Error(
    "Missing CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE in environment.",
  );
}

const env = {
  HYPERDRIVE: {
    connectionString,
  },
} as Cloudflare.Env;

const baseLayer = Layer.provide(
  Layer.mergeAll(Database.Default),
  Layer.mergeAll(Env.Default(env), Logger.pretty),
);
const runtime = ManagedRuntime.make(Layer.mergeAll(Env.Default(env), Logger.pretty, baseLayer));

await runtime.runPromise(seedSimpleAccountsChart);
await runtime.dispose();
