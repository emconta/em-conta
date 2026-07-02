import { zCnpj } from "@dto/common";
import * as v from "valibot";

export const FinishOnboardingDto = v.object({
  cnpj: v.nullable(v.optional(zCnpj)),
  name: v.pipe(v.string(), v.nonEmpty()),
});

export type FinishOnboardingDto = v.InferInput<typeof FinishOnboardingDto>;
