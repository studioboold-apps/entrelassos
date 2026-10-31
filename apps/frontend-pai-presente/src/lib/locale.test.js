/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  detectLocale,
  findLocale,
  getLocale,
  matchLocale,
  setLocale,
  subscribeLocale,
} from '@/lib/locale';

describe('o idioma do navegador vira idioma do app', () => {
  test('a forma exata vale', () => {
    expect(matchLocale('pt-BR')).toBe('pt-BR');
    expect(matchLocale('en')).toBe('en');
  });

  /** O idioma conta, a regiao nao: `pt-PT` le em portugues, `es-MX` em espanhol. */
  test('a regiao diferente cai na mesma lingua', () => {
    expect(matchLocale('pt-PT')).toBe('pt-BR');
    expect(matchLocale('en-GB')).toBe('en');
    expect(matchLocale('es_MX')).toBe('es');
  });

  test('lingua que o app nao fala nao casa', () => {
    expect(matchLocale('fr-FR')).toBeUndefined();
    expect(matchLocale('')).toBeUndefined();
    expect(matchLocale(undefined)).toBeUndefined();
  });
});

describe('quem decide o idioma', () => {
  test('a escolha do perfil vence o navegador', () => {
    expect(detectLocale({ stored: 'es', browserLanguages: ['en-US'] })).toBe('es');
  });

  test('escolha guardada que nao existe mais fica de fora', () => {
    expect(detectLocale({ stored: 'fr', browserLanguages: ['en-US'] })).toBe('en');
  });

  test('o primeiro idioma do navegador que o app fala vence', () => {
    expect(detectLocale({ browserLanguages: ['fr-FR', 'es-ES', 'en-US'] })).toBe('es');
  });

  test('sem pista nenhuma, portugues', () => {
    expect(detectLocale()).toBe(DEFAULT_LOCALE);
    expect(detectLocale({ browserLanguages: ['de-DE'] })).toBe(DEFAULT_LOCALE);
  });
});

describe('trocar de idioma', () => {
  test('avisa quem escuta, e so quando muda', () => {
    const original = getLocale();
    const target = original === 'en' ? 'es' : 'en';
    let calls = 0;
    const unsubscribe = subscribeLocale(() => {
      calls += 1;
    });

    setLocale(target);
    setLocale(target);
    expect(getLocale()).toBe(target);
    expect(calls).toBe(1);

    unsubscribe();
    setLocale(original);
    expect(calls).toBe(1);
  });

  test('idioma desconhecido e recusado', () => {
    const original = getLocale();
    setLocale('fr');
    expect(getLocale()).toBe(original);
  });

  test('a escolha fica guardada quando ha armazenamento', () => {
    const store = new Map();
    const previous = globalThis.localStorage;
    globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
    const original = getLocale();
    const target = original === 'es' ? 'en' : 'es';

    try {
      setLocale(target);
      expect(store.get(LOCALE_STORAGE_KEY)).toBe(target);
    } finally {
      setLocale(original);
      globalThis.localStorage = previous;
    }
  });

  test('o idioma desconhecido acha o padrao na tabela', () => {
    expect(findLocale('fr').id).toBe(DEFAULT_LOCALE);
  });
});
