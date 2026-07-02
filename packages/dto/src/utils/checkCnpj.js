/**
 * Check if a CNPJ is valid, using the calculation method of the
 * verification digits in [IN RFB 2.229/2024](https://www.gov.br/fazenda/pt-br/assuntos/noticias/2024/outubro/receita-federal-anuncia-que-cnpj-tera-letras-e-numeros-a-partir-de-julho-de-2026).
 *
 * @param {string} cnpj Only digits or formatted
 */
export function checkCnpj(cnpj) {
  cnpj = cnpj.toUpperCase();
  cnpj = cnpj.replace(/[^A-Z\d]/g, "");

  if (!/^[A-Z\d]{14}$/i.test(cnpj)) return false;
  if (new Set(Array.from(cnpj)).size === 1) return false;
  if (cnpj.slice(8, 12) === "0000") return false;

  const cnpjWithFirstDv = addDv(cnpj.slice(0, -2));

  console.log(cnpjWithFirstDv);

  const fullCnpj = addDv(cnpjWithFirstDv);

  console.log(fullCnpj);

  return fullCnpj === cnpj;
}

/**
 * Calculates and adds a DV (Dígito Verificador) at the end of the informed CNPJ.
 * If the length if lesser then 12 or greater then 13, the informed CNPJ will be
 * returned without any modifications.
 *
 * @param {string} cnpj CNPJ with 12 or 13 characters
 * @returns {string}
 */
function addDv(cnpj) {
  if (cnpj.length < 12 || cnpj.length > 13) return cnpj;

  const weights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  if (cnpj.length === 13) weights.unshift(6);

  const sum = cnpj
    .split("")
    .map((v, idx) => (v.charCodeAt(0) - 48) * weights[idx])
    .reduce((v, acc) => v + acc, 0);

  const rest = sum % 11;

  const dv = rest === 1 || rest === 0 ? 0 : 11 - rest;

  return `${cnpj}${dv}`;
}
