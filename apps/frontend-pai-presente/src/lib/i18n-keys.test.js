/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

import { LOCALE_MESSAGES } from '@/locales';

const SOURCE_ROOT = join(import.meta.dir, '..');
const SKIPPED_DIRECTORIES = new Set(['ui', 'api', 'vite-plugins', 'node_modules']);
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx']);

/**
 * A chave literal aparece de duas formas: `t('escopo.chave')` na tela, e
 * `labelKey: 'escopo.chave'` nas tabelas de categoria, que sao lidas por `t()`
 * mais tarde. `t(category.labelKey)` nao entra aqui de proposito — a chave dele
 * ja foi contada na tabela.
 */
const KEY_PATTERN = /(?:\bt\(|\b\w*[kK]ey: )'([a-z][\w.]*\.[\w.]+)'/g;

function listSourceFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      return SKIPPED_DIRECTORIES.has(entry) ? [] : listSourceFiles(path);
    }

    if (entry.endsWith('.test.js')) return [];

    return SOURCE_EXTENSIONS.has(extname(entry)) ? [path] : [];
  });
}

function collectUsedKeys() {
  const used = new Map();

  for (const path of listSourceFiles(SOURCE_ROOT)) {
    const source = readFileSync(path, 'utf8');

    for (const [, key] of source.matchAll(KEY_PATTERN)) {
      if (!used.has(key)) used.set(key, path.slice(SOURCE_ROOT.length + 1));
    }
  }

  return used;
}

function resolveMessage(key) {
  return key
    .split('.')
    .reduce((branch, segment) => (branch === undefined || branch === null ? undefined : branch[segment]), LOCALE_MESSAGES);
}

const USED_KEYS = collectUsedKeys();

describe('nenhuma chave usada na tela fica sem frase', () => {
  /**
   * `translate` devolve a propria chave quando nao acha — a tela nao quebra, e
   * por isso o buraco e' invisivel ate alguem abrir aquela aba. Quem tem de
   * descobrir isso e' este teste, varrendo o codigo-fonte.
   */
  test('toda chave literal resolve para uma frase', () => {
    const missing = [...USED_KEYS]
      .filter(([key]) => typeof resolveMessage(key) !== 'string')
      .map(([key, file]) => `${key} (${file})`);

    expect(missing).toEqual([]);
  });

  test('a varredura achou chave em quantidade de tela inteira', () => {
    expect(USED_KEYS.size).toBeGreaterThan(100);
  });
});

describe('o registro de escopos cobre os arquivos de traducao', () => {
  /**
   * Escopo que existe em arquivo mas nao entra no registro nao vira frase
   * nenhuma, e o sintoma e' a chave crua na tela — nada quebra.
   */
  test('todo escopo usado tem entrada no registro', () => {
    const scopes = new Set([...USED_KEYS.keys()].map((key) => key.split('.')[0]));
    const missing = [...scopes].filter((scope) => !Object.hasOwn(LOCALE_MESSAGES, scope));

    expect(missing).toEqual([]);
  });

  test('o registro nao carrega escopo que ninguem usa', () => {
    const scopes = new Set([...USED_KEYS.keys()].map((key) => key.split('.')[0]));
    const unused = Object.keys(LOCALE_MESSAGES).filter((scope) => !scopes.has(scope));

    expect(unused).toEqual([]);
  });
});
