import { checkCnpj } from "@dto/utils/checkCnpj";
import * as v from "valibot";

export const zCnpj = v.pipe(v.string(), v.check(checkCnpj, "CNPJ inválido."));
export const zMoney = v.pipe(v.string(), v.regex(/^\d+(\.\d{1,2})?$/));
export const zQuantity = v.pipe(v.string(), v.regex(/^\d+(\.\d{1,3})?$/));
export const zPositiveIntegerString = v.pipe(v.string(), v.regex(/^\d+$/));
