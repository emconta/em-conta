import { checkCnpj } from "@dto/utils/checkCnpj";
import * as v from "valibot";

export const zCnpj = v.pipe(v.string(), v.check(checkCnpj, "CNPJ inválido."));
