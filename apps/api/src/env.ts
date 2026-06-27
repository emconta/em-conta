import { Effect } from "effect";

export default class Env extends Effect.Service<Env>()("Env", {
	effect: (env: Cloudflare.Env) => Effect.succeed(env),
}) {}
