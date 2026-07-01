import type { PgErrorCode, PgErrorMessage } from "@api/db/errors/pgErrorCodes";
import { Data } from "effect";
import type { DatabaseError as PgDatabaseError } from "pg";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly code?: PgErrorCode;
  readonly message?: PgErrorMessage;
  readonly cause: PgDatabaseError;
}> {}
