/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { afterEach, describe, expect, test } from 'bun:test';

import { PWA_CACHE_NAMES, forgetCachedApiResponses } from './pwa-cache';

const originalCaches = globalThis.caches;

afterEach(() => {
  globalThis.caches = originalCaches;
});

describe('forgetCachedApiResponses', () => {
  /**
   * O service worker guarda resposta de API em cache do navegador, que e' do
   * DISPOSITIVO e nao da sessao. Num celular emprestado, o proximo pai a entrar
   * leria os filhos do anterior (`security.md` §1) — sair tem de apagar.
   */
  test('apaga o cache da API ao sair', async () => {
    const deleted = [];
    globalThis.caches = { delete: async (name) => deleted.push(name) };

    await forgetCachedApiResponses();

    expect(deleted).toEqual([PWA_CACHE_NAMES.API]);
  });

  /** Navegador sem service worker nao tem `caches`, e sair nao pode explodir. */
  test('nao quebra onde o navegador nao expoe cache', async () => {
    globalThis.caches = undefined;

    expect(await forgetCachedApiResponses()).toBeUndefined();
  });
});
