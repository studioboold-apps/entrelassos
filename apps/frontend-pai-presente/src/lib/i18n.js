/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { LOCALE_MESSAGES } from '@/locales';

/**
 * Argumento NOMEADO, nunca posicional. `{child}` diz o que entra ali; `{0}` faz
 * o tradutor adivinhar, e em idioma que reordena a frase ele reordena o que nao
 * e' dele.
 */
const NAMED_ARGUMENT_PATTERN = /\{(\w+)\}/g;

const KEY_SEPARATOR = '.';

/** @param {string} key */
function resolveMessage(key) {
  return key.split(KEY_SEPARATOR).reduce(
    (branch, segment) => (branch === undefined || branch === null ? undefined : branch[segment]),
    LOCALE_MESSAGES,
  );
}

/** @param {string} key */
export function hasTranslation(key) {
  return typeof resolveMessage(key) === 'string';
}

/**
 * Chave sem traducao devolve a PROPRIA chave. Lancar deixaria a tela em branco
 * por causa de uma frase, o que e' pior que a frase errada — e quem garante que
 * nao ha buraco e' `i18n-keys.test.js`, que varre o codigo-fonte, nao o usuario
 * descobrindo em producao.
 *
 * @param {string} key
 * @param {Record<string, string | number>} [parameters]
 */
export function translate(key, parameters = {}) {
  const message = resolveMessage(key);

  if (typeof message !== 'string') return key;

  return message.replace(NAMED_ARGUMENT_PATTERN, (whole, name) =>
    Object.hasOwn(parameters, name) ? String(parameters[name]) : whole,
  );
}

/**
 * Identidade estavel de proposito: `t` entra em dependencia de `useMemo` e de
 * `useCallback` pelas telas, e uma funcao nova a cada render invalidaria todas.
 */
const TRANSLATION = Object.freeze({ t: translate });

export function useTranslation() {
  return TRANSLATION;
}
