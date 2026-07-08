import * as v from "valibot";

export const AccountDto = v.object({
  id: v.number(),
  name: v.string(),
  type: v.string(),
  typeLabel: v.string(),
  description: v.nullable(v.string()),
  category: v.string(),
  nature: v.string(),
  parentId: v.nullable(v.number()),
});

export type AccountDto = v.InferInput<typeof AccountDto>;
