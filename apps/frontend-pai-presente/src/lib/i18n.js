/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { useSyncExternalStore } from 'react';

import { MESSAGES_BY_LOCALE } from '@/locales';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, findLocale, getLocale, subscribeLocale } from '@/lib/locale';

/**
 * Argumento NOMEADO, nunca posicional. `{child}` diz o que entra ali; `{0}` faz
 * o tradutor adivinhar, e em idioma que reordena a frase ele reordena o que nao
 * e' dele.
 */
const NAMED_ARGUMENT_PATTERN = /\{(\w+)\}/g;

const KEY_SEPARATOR = '.';

/**
 * @param {string} locale
 * @param {string} key
 */
function resolveIn(locale, key) {
  return key.split(KEY_SEPARATOR).reduce(
    (branch, segment) => (branch === undefined || branch === null ? undefined : branch[segment]),
    MESSAGES_BY_LOCALE[locale],
  );
}

/**
 * Frase que a traducao ainda nao tem cai no portugues, que e' a origem de todo
 * texto. Portugues no meio de uma tela em ingles e' feio; a chave crua e' pior.
 *
 * @param {string} locale
 * @param {string} key
 */
function resolveMessage(locale, key) {
  const message = resolveIn(locale, key);

  return typeof message === 'string' ? message : resolveIn(DEFAULT_LOCALE, key);
}

/**
 * @param {string} key
 * @param {string} [locale]
 */
export function hasTranslation(key, locale = DEFAULT_LOCALE) {
  return typeof resolveIn(locale, key) === 'string';
}

/**
 * Chave sem traducao devolve a PROPRIA chave. Lancar deixaria a tela em branco
 * por causa de uma frase, o que e' pior que a frase errada — e quem garante que
 * nao ha buraco e' `i18n-keys.test.js`, que varre o codigo-fonte, nao o usuario
 * descobrindo em producao.
 *
 * @param {string} locale
 * @param {string} key
 * @param {Record<string, string | number>} [parameters]
 */
export function translateIn(locale, key, parameters = {}) {
  const message = resolveMessage(locale, key);

  if (typeof message !== 'string') return key;

  return message.replace(NAMED_ARGUMENT_PATTERN, (whole, name) =>
    Object.hasOwn(parameters, name) ? String(parameters[name]) : whole,
  );
}

/**
 * Para codigo fora do React: traduz no idioma escolhido AGORA.
 *
 * @param {string} key
 * @param {Record<string, string | number>} [parameters]
 */
export function translate(key, parameters = {}) {
  return translateIn(getLocale(), key, parameters);
}

/**
 * Um objeto por idioma, criado uma vez: `t` entra em dependencia de `useMemo` e
 * de `useCallback` pelas telas, e uma funcao nova a cada render invalidaria
 * todas. Trocar de idioma troca o objeto — e e' exatamente isso que tem de
 * recalcular o que dependia de `t`.
 */
const TRANSLATIONS = new Map(
  SUPPORTED_LOCALES.map(({ id, dateLocale }) => [
    id,
    Object.freeze({
      locale: id,
      dateLocale,
      /**
       * @param {string} key
       * @param {Record<string, string | number>} [parameters]
       */
      t: (key, parameters) => translateIn(id, key, parameters),
    }),
  ]),
);

/** @param {string} locale */
export function getTranslation(locale) {
  return TRANSLATIONS.get(findLocale(locale).id);
}

const serverLocale = () => DEFAULT_LOCALE;

/**
 * `locale` para `Intl` e `toLocaleDateString`; `dateLocale` para o `format` do
 * date-fns. Os dois saem do mesmo lugar para a data nunca falar outra lingua
 * que a frase em volta dela.
 */
export function useTranslation() {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, serverLocale);

  return getTranslation(locale);
}
