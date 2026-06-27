import { makeDatabaseError } from "@api/db/databaseError";
import * as schema from "@api/db/schema";
import Env from "@api/env";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Effect } from "effect";
import { Client } from "pg";

export default class Database extends Effect.Service<Database>()("Database", {
  effect: Effect.gen(function* () {
    const { HYPERDRIVE } = yield* Env;

    const client = new Client({
      connectionString: HYPERDRIVE.connectionString,
    });

    yield* Effect.tryPromise({
      try: () => client.connect(),
      catch: makeDatabaseError,
    }).pipe(Effect.tapError(() => Effect.promise(() => client.end())));

    const db = drizzle({ client, schema, casing: "snake_case" });

    function execute<T>(fn: (client: NodePgDatabase<typeof schema>) => Promise<T>) {
      return Effect.tryPromise({
        try: () => fn(db),
        catch: makeDatabaseError,
      }).pipe(
        Effect.tap(() => Effect.logInfo("DB Query")),
        Effect.withLogSpan("Database.execute"),
      );
    }

    return { $client: client, execute };
  }),

  accessors: true,
}) {}
