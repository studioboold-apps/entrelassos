/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * Os tres campos sensiveis, na ordem da tela. `kind` e' o valor que a API
 * entende; `field` e' a chave do corpo e da resposta.
 */
export const FAMILY_VALUE_FIELDS = Object.freeze([
  { field: 'religion', kind: 'religiao', labelKey: 'profile.familyValues.fields.religion' },
  { field: 'politics', kind: 'politica', labelKey: 'profile.familyValues.fields.politics' },
  { field: 'orientation', kind: 'orientacao', labelKey: 'profile.familyValues.fields.orientation' },
]);

/** Quantas sugestoes cabem embaixo do campo sem empurrar o resto do dialogo. */
export const FAMILY_VALUE_SUGGESTION_LIMIT = 12;

/** Mesma regra da API: acento, maiuscula e pontuacao nao fazem outra resposta. */
export function normalizeFamilyValueKey(label) {
  return (label ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/**
 * Sugestoes para o que o pai esta digitando. Vazio mostra as primeiras; com
 * texto, as que contem o que ele escreveu, ignorando acento e maiuscula.
 *
 * @param {readonly string[]} options
 * @param {string} typed
 */
export function matchFamilyValueOptions(options, typed) {
  const key = normalizeFamilyValueKey(typed);
  const matching = key === '' ? options : options.filter((option) => normalizeFamilyValueKey(option).includes(key));
  return matching.slice(0, FAMILY_VALUE_SUGGESTION_LIMIT);
}

/**
 * A opcao que ja' existe com a MESMA chave do que foi digitado, se houver: a
 * tela mostra que "catolica" vai virar "Católica", em vez de deixar o pai achar
 * que criou outra.
 *
 * @param {readonly string[]} options
 * @param {string} typed
 */
export function findSameFamilyValue(options, typed) {
  const key = normalizeFamilyValueKey(typed);
  if (key === '') return undefined;
  return options.find((option) => normalizeFamilyValueKey(option) === key);
}
