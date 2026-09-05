/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A tela nao e' importada: puxar a pagina traria React, os graficos e o
 * roteador. O que se afirma aqui e' a LIGACAO — que o boletim encaminha conta e
 * falha a quem ja tem regra e teste proprios.
 */
const SOURCE = readFileSync(join(import.meta.dir, 'Boletim.jsx'), 'utf8');

describe('a conta do mes tem uma fonte so', () => {
  /**
   * `new Date(a.date)` na tela le o dia de calendario como meia-noite UTC e
   * perde o dia 1 de todo mes. O `toLocalDate` nasceu em F2.3 exatamente para
   * isso; a tela reimplementava a leitura por conta propria.
   */
  test('a tela nao interpreta o dia de calendario por conta propria', () => {
    expect(SOURCE).not.toContain('new Date(a.date)');
  });

  test('as estatisticas vem do modulo que tem teste', () => {
    expect(SOURCE).toContain('buildMonthStats');
  });
});

describe('o boletim que a IA recusa nao fica em silencio', () => {
  /**
   * Medido: sem chave, `POST /v1/report` responde 503 `AI_NOT_CONFIGURED`. O
   * `console.error` engolia a frase: o pai clicava em "Gerar Boletim do Mes",
   * via o botao girar, voltar ao normal, e nada acontecia. Nenhuma palavra.
   */
  test('a falha nao morre no console', () => {
    expect(SOURCE).not.toContain('console.error');
  });

  test('a falha vira frase pelo tradutor unico', () => {
    expect(SOURCE).toContain('describeApiFailure');
  });

  test('a falha aparece como aviso ao lado do botao', () => {
    expect(SOURCE).toContain('role="alert"');
  });
});

describe('o boletim e chamada de servidor, nao estado de tela', () => {
  /** `web.md` §5: quem chama a API e' `useMutation`, nao `useState` com async. */
  test('o "gerando" sai da propria mutation', () => {
    expect(SOURCE).not.toContain('setLoadingReport');
  });

  test('o relatorio recebido nao vira estado a mao', () => {
    expect(SOURCE).not.toContain('setReport');
  });
});
