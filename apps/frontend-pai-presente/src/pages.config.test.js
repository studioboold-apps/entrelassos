/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'bun:test';

const SOURCE_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PAGE_EXTENSION = '.jsx';

/**
 * O teste le o TEXTO do `pages.config.js` em vez de importa-lo: importar
 * arrastaria as 8 telas, o React e o Tailwind para dentro do teste, e a
 * pergunta aqui nao e se a tela renderiza — e se ela foi registrada.
 */
const PAGE_KEY_PATTERN = /^\s*"([A-Za-z0-9_]+)":/gm;

function readRegisteredPageNames() {
  const source = readFileSync(join(SOURCE_DIRECTORY, 'pages.config.js'), 'utf8');
  const pagesBlock = source.slice(source.indexOf('export const PAGES'), source.indexOf('export const pagesConfig'));
  return [...pagesBlock.matchAll(PAGE_KEY_PATTERN)].map(([, name]) => name).sort();
}

function readPageFileNames() {
  return readdirSync(join(SOURCE_DIRECTORY, 'pages'))
    .filter((entry) => entry.endsWith(PAGE_EXTENSION))
    .map((entry) => entry.slice(0, -PAGE_EXTENSION.length))
    .sort();
}

describe('pages.config.js', () => {
  /**
   * `Comunidade.jsx` existia, o menu ja tinha a aba, e o roteador nao conhecia a
   * rota: quem clicava caia em `PageNotFound`. O defeito nao aparece em nenhum
   * teste de tela porque a tela esta certa — falta o registro.
   */
  test('toda tela em src/pages esta registrada', () => {
    expect(readRegisteredPageNames()).toEqual(readPageFileNames());
  });
});
