/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * As telas leem snake_case (heranca do Base44) e a API fala camelCase. A
 * traducao mora aqui, num lugar so, em vez de espalhada pelas oito paginas.
 */

/** No automatico `createdAt` viraria `created_at`, e nenhuma tela le isso. */
const GLOBAL_ALIASES = Object.freeze({
  created_date: 'createdAt',
  updated_date: 'updatedAt',
});

function toCamelCase(key) {
  return key.replace(/_([a-z0-9])/g, (_match, letter) => letter.toUpperCase());
}

function toSnakeCase(key) {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function invertAliases(aliases) {
  return Object.fromEntries(Object.entries(aliases).map(([page, api]) => [api, page]));
}

/** Date, File e afins passam inteiros: entrar neles destruiria o valor. */
function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function mapKeysDeep(value, translateKey) {
  if (Array.isArray(value)) return value.map((item) => mapKeysDeep(item, translateKey));
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [translateKey(key), mapKeysDeep(item, translateKey)]),
  );
}

/** Payload que sai da tela para a API. */
export function toApiPayload(value, aliases = {}) {
  const table = { ...GLOBAL_ALIASES, ...aliases };
  return mapKeysDeep(value, (key) => table[key] ?? toCamelCase(key));
}

/** Resposta que volta da API para a tela. */
export function toPagePayload(value, aliases = {}) {
  const table = invertAliases({ ...GLOBAL_ALIASES, ...aliases });
  return mapKeysDeep(value, (key) => table[key] ?? toSnakeCase(key));
}
