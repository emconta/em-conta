import { DrizzleQueryError } from 'drizzle-orm';
import { Data } from 'effect';
import { DatabaseError as PgDatabaseError } from 'pg';

export class DatabaseError extends Data.TaggedError('DatabaseError')<{
	readonly cause: PgDatabaseError;
}> {}

export function makeDatabaseError(error: unknown) {
	if (error instanceof DrizzleQueryError && error.cause instanceof PgDatabaseError) return new DatabaseError({ cause: error.cause });

	throw error;
}
