import { DatabaseError } from "@api/db/errors/databaseError";
import { type PgErrorCode, pgErrorCodes } from "@api/db/errors/pgErrorCodes";
import { DrizzleQueryError } from "drizzle-orm";
import { DatabaseError as PgDatabaseError } from "pg";

export function makeDatabaseError(error: unknown) {
  if (error instanceof DrizzleQueryError && error.cause instanceof PgDatabaseError) {
    const code = error.cause.code as PgErrorCode;
    const message = pgErrorCodes[code]?.message;

    if (!message) return new DatabaseError({ cause: error.cause });

    return new DatabaseError({ cause: error.cause, code, message });
  }

  throw error;
}
