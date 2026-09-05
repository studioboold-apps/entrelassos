/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PAGES_DIRECTORY = join(import.meta.dir, 'pages');
const DEBT_DOCUMENT = join(import.meta.dir, '..', '..', '..', 'docs', 'DEBITO.md');

/** `web.md` §8 e o teto de 200 linhas de `code-standards.md`. */
const LINE_CEILING = 200;

const PAGES = readdirSync(PAGES_DIRECTORY).filter((name) => name.endsWith('.jsx'));

function readPage(name) {
  return readFileSync(join(PAGES_DIRECTORY, name), 'utf8');
}

describe('a tela desenha, o hook decide (web.md §4)', () => {
  /**
   * A lista de paginas e' varrida, nao escrita a mao: pagina nova nasce coberta
   * por esta regra sem ninguem lembrar de vir aqui inscreve-la. Foi assim que a
   * divida anterior cresceu — cada tela nova era uma excecao que ninguem media.
   */
  test('toda pagina tem hook do lado', () => {
    const withoutHook = PAGES.filter((name) => !readPage(name).includes('.hook'));

    expect(withoutHook).toEqual([]);
  });

  test('nenhuma pagina guarda estado nem chama a API', () => {
    const offenders = PAGES.filter((name) => {
      const source = readPage(name);
      return source.includes('useState') || source.includes('api.');
    });

    expect(offenders).toEqual([]);
  });
});

describe('nenhum texto de usuario nasce cravado na tela (web.md §6)', () => {
  /**
   * A busca e' pelo NO DE TEXTO com letra solta entre tags. Cravar frase em
   * `*.jsx` nao quebra nada e o portugues continua certo — o idioma novo e' que
   * nasce faltando linha, e isso so aparece na traducao.
   */
  const TEXT_NODE = />[ \t]*[A-Za-zÀ-ú][^<>{}]{2,}</;

  test('toda pagina fala por chave de traducao', () => {
    const offenders = PAGES.filter((name) => TEXT_NODE.test(readPage(name)));

    expect(offenders).toEqual([]);
  });

  test('toda pagina tem o arquivo de frases do lado', () => {
    const locales = new Set(readdirSync(PAGES_DIRECTORY).filter((name) => name.endsWith('.locale.json')));
    const withoutLocale = PAGES.filter((name) => !locales.has(name.replace('.jsx', '.locale.json')));

    expect(withoutLocale).toEqual([]);
  });
});

describe('a divida que sobrou tem dono e data', () => {
  /**
   * Aceite de F6.1: nenhuma divida sem dono. O que nao foi corrigido esta
   * escrito com data e com tamanho medido — divida escrita e' divida que alguem
   * encontra; divida lembrada some na proxima rodada.
   */
  test('nenhuma pagina passa do teto de linhas', () => {
    const oversized = PAGES.filter((name) => readPage(name).split('\n').length > LINE_CEILING);

    expect(oversized).toEqual([]);
  });

  test('o documento de divida nomeia cada componente que ficou de fora', () => {
    const debt = readFileSync(DEBT_DOCUMENT, 'utf8');

    for (const component of ['CommunityPostCard', 'CommunityCreatePost', 'SignIn', 'EnvironmentBanner', 'AuthLayout']) {
      expect(debt).toContain(component);
    }

    expect(debt).toContain('05/09/2026');
  });
});
