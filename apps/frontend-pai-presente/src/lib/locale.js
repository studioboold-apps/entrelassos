/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { enUS, es, ptBR } from 'date-fns/locale';

/**
 * O idioma de origem e' o portugues: todo texto nasce em `*.locale.json`, e os
 * outros idiomas sao traducao dele (`*.locale.en.json`, `*.locale.es.json`).
 * Frase que faltar na traducao cai no portugues, nunca na chave crua.
 */
export const DEFAULT_LOCALE = 'pt-BR';

/**
 * O nome de cada idioma vai escrito NELE MESMO, e por isso nao mora em
 * `*.locale.json`: quem abriu o app em ingles sem querer precisa achar
 * "Português" na lista, e nao "Portuguese".
 *
 * `appleScriptLocale` e' o sufixo da pasta do script da Apple, que nao segue a
 * BCP 47 (`pt_BR`, e nao `pt-BR`).
 */
export const SUPPORTED_LOCALES = Object.freeze([
  Object.freeze({ id: 'pt-BR', nativeName: 'Português', dateLocale: ptBR, appleScriptLocale: 'pt_BR' }),
  Object.freeze({ id: 'en', nativeName: 'English', dateLocale: enUS, appleScriptLocale: 'en_US' }),
  Object.freeze({ id: 'es', nativeName: 'Español', dateLocale: es, appleScriptLocale: 'es_ES' }),
]);

/** @type {Set<string>} */
const SUPPORTED_IDS = new Set(SUPPORTED_LOCALES.map(({ id }) => id));

/** Exportado para o teste ler a mesma chave que a tela grava. */
export const LOCALE_STORAGE_KEY = 'entrelacos.locale';

/** @param {string} locale */
export function isSupportedLocale(locale) {
  return SUPPORTED_IDS.has(locale);
}

/** @param {string} locale */
export function findLocale(locale) {
  return SUPPORTED_LOCALES.find(({ id }) => id === locale) ?? SUPPORTED_LOCALES[0];
}

/**
 * `pt-PT` le o app em portugues, `en-GB` em ingles e `es-MX` em espanhol: o
 * idioma conta, a regiao nao. Primeiro a forma exata, depois so a lingua.
 *
 * @param {string | undefined | null} candidate
 */
export function matchLocale(candidate) {
  if (typeof candidate !== 'string' || candidate.trim() === '') return undefined;

  const normalized = candidate.trim().replace('_', '-');
  const exact = SUPPORTED_LOCALES.find(({ id }) => id.toLowerCase() === normalized.toLowerCase());

  if (exact) return exact.id;

  const language = normalized.split('-')[0].toLowerCase();

  return SUPPORTED_LOCALES.find(({ id }) => id.split('-')[0].toLowerCase() === language)?.id;
}

/**
 * A escolha feita no perfil vence o navegador; o navegador vence o padrao.
 *
 * @param {{ stored?: string | null, browserLanguages?: readonly string[] }} sources
 */
export function detectLocale({ stored, browserLanguages = [] } = {}) {
  if (stored && isSupportedLocale(stored)) return stored;

  for (const language of browserLanguages) {
    const match = matchLocale(language);
    if (match) return match;
  }

  return DEFAULT_LOCALE;
}

/**
 * `localStorage` some em aba anonima de alguns navegadores e lanca em vez de
 * devolver nulo. Idioma nao lembrado e' menos grave que a tela em branco.
 */
function readStoredLocale() {
  try {
    return globalThis.localStorage?.getItem(LOCALE_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

/** @param {string} locale */
function writeStoredLocale(locale) {
  try {
    globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Sem armazenamento a escolha vale so ate fechar a aba.
  }
}

/**
 * O `lang` do `<html>` decide a voz do leitor de tela e a hifenizacao. Deixa-lo
 * em `pt-BR` com a tela em ingles faz o leitor ler ingles com sotaque.
 *
 * @param {string} locale
 */
function applyDocumentLanguage(locale) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
}

let currentLocale = detectLocale({
  stored: readStoredLocale(),
  browserLanguages: globalThis.navigator?.languages ?? [],
});

applyDocumentLanguage(currentLocale);

/** @type {Set<() => void>} */
const listeners = new Set();

export function getLocale() {
  return currentLocale;
}

/**
 * Idioma desconhecido e' recusado em silencio: a lista da tela so oferece os
 * suportados, e um valor estranho aqui so pode vir de codigo errado.
 *
 * @param {string} locale
 */
export function setLocale(locale) {
  if (!isSupportedLocale(locale) || locale === currentLocale) return;

  currentLocale = locale;
  writeStoredLocale(locale);
  applyDocumentLanguage(locale);
  listeners.forEach((listener) => listener());
}

/** @param {() => void} listener */
export function subscribeLocale(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
