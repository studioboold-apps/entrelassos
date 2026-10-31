/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/locale';
import { MESSAGES_BY_LOCALE } from '@/locales';

const NAMED_ARGUMENT_PATTERN = /\{(\w+)\}/g;

/** @returns {Map<string, string>} chave completa -> frase */
function flatten(tree, prefix = '') {
  const leaves = new Map();

  for (const [segment, value] of Object.entries(tree)) {
    const key = prefix === '' ? segment : `${prefix}.${segment}`;

    if (typeof value === 'string') leaves.set(key, value);
    else for (const [leafKey, leaf] of flatten(value, key)) leaves.set(leafKey, leaf);
  }

  return leaves;
}

function argumentsOf(message) {
  return [...message.matchAll(NAMED_ARGUMENT_PATTERN)].map(([, name]) => name).sort();
}

const SOURCE = flatten(MESSAGES_BY_LOCALE[DEFAULT_LOCALE]);
const TRANSLATIONS = SUPPORTED_LOCALES.filter(({ id }) => id !== DEFAULT_LOCALE).map(({ id }) => id);

describe('o registro conhece todo idioma oferecido', () => {
  test('cada idioma da lista tem mensagens, e nenhuma sobra', () => {
    expect(Object.keys(MESSAGES_BY_LOCALE).sort()).toEqual(SUPPORTED_LOCALES.map(({ id }) => id).sort());
  });
});

/**
 * O portugues e' a origem. Frase que falta na traducao cai no portugues em
 * silencio — e e' por isso que quem tem de reclamar e' este teste, nao o pai que
 * abriu a tela em ingles e leu uma linha em portugues.
 */
describe.each(TRANSLATIONS)('a traducao %s acompanha o portugues', (locale) => {
  const translated = flatten(MESSAGES_BY_LOCALE[locale]);

  test('nenhuma chave do portugues falta', () => {
    expect([...SOURCE.keys()].filter((key) => !translated.has(key))).toEqual([]);
  });

  test('nenhuma chave sobra sem origem', () => {
    expect([...translated.keys()].filter((key) => !SOURCE.has(key))).toEqual([]);
  });

  test('nenhuma frase vazia', () => {
    expect([...translated].filter(([, message]) => message.trim() === '').map(([key]) => key)).toEqual([]);
  });

  /**
   * `{child}` que vira `{crianca}` na traducao fica a mostra na tela: o
   * tradutor reordena a frase, mas nao renomeia o que nao e' dele.
   */
  test('os argumentos nomeados sao os mesmos', () => {
    const divergent = [...SOURCE]
      .filter(([key, message]) => translated.has(key) && argumentsOf(message).join() !== argumentsOf(translated.get(key)).join())
      .map(([key]) => key);

    expect(divergent).toEqual([]);
  });
});
