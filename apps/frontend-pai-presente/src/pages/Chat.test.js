/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A tela nao e importada: puxar a pagina traria React, o roteador e o markdown
 * para dentro do teste. O que se afirma aqui e a LIGACAO — que o Chat encaminha
 * a recusa a quem ja tem regra e teste proprios.
 *
 * Os DOIS arquivos entram: `web.md` §4 separou desenho de decisao, e a
 * propriedade afirmada aqui e' da tela inteira. Lendo so' o `.jsx`, extrair a
 * logica para o hook apagaria as afirmacoes sem que nada ficasse vermelho — o
 * teste passaria por nao ter mais onde olhar.
 */
const PAGE = readFileSync(join(import.meta.dir, 'Chat.jsx'), 'utf8');
const HOOK = readFileSync(join(import.meta.dir, 'Chat.hook.js'), 'utf8');
const SOURCE = `${PAGE}\n${HOOK}`;

describe('a tela desenha, o hook decide (web.md §4)', () => {
  test('a pagina nao guarda estado nem chama a API', () => {
    expect(PAGE).not.toContain('useState');
    expect(PAGE).not.toContain('api.');
  });

  test('a decisao mora no hook do lado', () => {
    expect(PAGE).toContain('useChat()');
    expect(HOOK).toContain('useMutation');
  });
});

describe('a recusa da IA nao vira fala do mentor', () => {
  /**
   * Medido: sem chave, `POST /v1/chat` responde 503 `AI_NOT_CONFIGURED` com o
   * motivo escrito. A tela trocava isso por uma frase fixa e a punha na conversa
   * como se o mentor tivesse falado — perde o motivo E poe palavra na boca dele.
   */
  test('nenhuma resposta fabricada entra na conversa', () => {
    expect(SOURCE).not.toContain('FAILURE_REPLY');
  });

  test('a falha vira frase pelo tradutor unico', () => {
    expect(SOURCE).toContain('describeApiFailure');
  });

  test('a falha aparece como aviso, fora da conversa', () => {
    expect(SOURCE).toContain('role="alert"');
  });
});

describe('a mensagem do pai nao some calada', () => {
  /**
   * `remember` engolia a falha num log do navegador. A mensagem ficava na tela
   * e nao no banco: ao voltar para a tela, ela tinha sumido, sem nada dito.
   */
  test('a gravacao que falha nao morre no console', () => {
    expect(SOURCE).not.toContain('console.error');
  });
});

describe('a conversa e dado de servidor', () => {
  test('nao ha lista paralela de mensagens em useState', () => {
    expect(SOURCE).not.toContain('setSessionMessages');
  });

  test('o "pensando" sai da propria mutation, nao de um booleano a mao', () => {
    expect(SOURCE).not.toContain('setIsLoading');
  });

  /** Gravou, a verdade passa a ser a do banco: sem invalidar, a tela e uma copia que envelhece. */
  test('depois de gravar, a tela recarrega o historico', () => {
    expect(SOURCE).toContain('invalidateQueries');
  });
});
