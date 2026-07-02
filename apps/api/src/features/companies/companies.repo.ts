import Database from "@api/db/database";
import { isUniqueViolation } from "@api/db/errors/checkPgError";
import { type Company, companies, type InsertCompany } from "@api/db/schema/companies";
import { Data, Array as EffArray, Effect } from "effect";

export default class CompaniesRepo extends Effect.Service<CompaniesRepo>()("CompaniesRepo", {
  effect: Effect.gen(function* () {
    const db = yield* Database;

    function getFromUser(data: Pick<Company, "userId">) {
      return db.execute((q) =>
        q.query.companies.findFirst({
          where(fields, operators) {
            return operators.eq(fields.userId, data.userId);
          },
        }),
      );
    }

    function insert(company: InsertCompany) {
      return db
        .execute((q) => q.insert(companies).values(company).returning())
        .pipe(
          Effect.map(EffArray.head),
          Effect.catchIf(
            (err) => err._tag === "DatabaseError" && isUniqueViolation(["cnpj"], err),
            () => Effect.fail(new InsertCompaniesRepoError({ code: "CNPJ_ALREADY_EXISTS" })),
          ),
        );
    }

    return { getFromUser, insert };
  }),
}) {}

export class InsertCompaniesRepoError extends Data.TaggedError("InsertCompaniesRepoError")<{
  readonly code: "CNPJ_ALREADY_EXISTS";
}> {}
