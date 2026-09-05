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

const MAIN_PAGE_PATTERN = /mainPage:\s*"([A-Za-z0-9_]+)"/;

function readMainPageName() {
  const source = readFileSync(join(SOURCE_DIRECTORY, 'pages.config.js'), 'utf8');
  return source.match(MAIN_PAGE_PATTERN)?.[1];
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

  /**
   * `mainPage` era `Onboarding`, e `/` e a rota que o app abre sempre. O pai que
   * ja terminou o cadastro voltava para o assistente a cada visita, com a barra
   * de navegacao escondida (`Layout.jsx` a esconde exatamente nessa tela) e sem
   * saida: o unico botao final exige `children.length > 0`, entao sair de la
   * significava cadastrar o mesmo filho de novo.
   *
   * A porta de entrada e a `Home`, que ja tem a guarda no sentido contrario —
   * usuario sem `onboarding_completed` e mandado para o assistente.
   */
  test('a rota inicial nao e o assistente de cadastro', () => {
    expect(readMainPageName()).toBe('Home');
  });

  test('a Home manda para o assistente quem ainda nao terminou o cadastro', () => {
    const home = readFileSync(join(SOURCE_DIRECTORY, 'pages', 'Home.jsx'), 'utf8');
    expect(home).toContain('!user.onboarding_completed');
    expect(home).toContain("createPageUrl('Onboarding')");
  });
});
