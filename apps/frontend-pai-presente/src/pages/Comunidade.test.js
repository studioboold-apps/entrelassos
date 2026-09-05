/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A tela nao e' importada: puxar a pagina traria React, os cartoes e o
 * roteador. O que se afirma aqui e' a LIGACAO — que a comunidade encaminha
 * identidade, chamada e falha a quem ja tem regra e teste proprios.
 */
const SOURCE = readFileSync(join(import.meta.dir, 'Comunidade.jsx'), 'utf8');

describe('o insight tem identidade estavel', () => {
  /** O relogio como id fazia a nota do pai nunca reaparecer. */
  test('o id nao vem do relogio nem da posicao na lista', () => {
    expect(SOURCE).not.toContain('Date.now()');
  });

  test('a identidade vem do modulo que tem teste', () => {
    expect(SOURCE).toContain('withInsightIds');
  });
});

describe('a IA que recusa nao fica em silencio', () => {
  /**
   * Medido: sem chave, `POST /v1/insights` responde 503 `AI_NOT_CONFIGURED`. A
   * frase morria no log do navegador: o pai abria a aba de insights, via o
   * carregando girar e parar, e a lista ficava vazia. Vazia e "deu errado" sao
   * coisas diferentes, e a tela mostrava a mesma coisa para as duas.
   */
  test('a falha nao morre no log do navegador', () => {
    expect(SOURCE).not.toContain('console.error');
  });

  test('a falha vira frase pelo tradutor unico', () => {
    expect(SOURCE).toContain('describeApiFailure');
  });

  test('a falha aparece como aviso', () => {
    expect(SOURCE).toContain('role="alert"');
  });
});

describe('quem chama a API e o TanStack, nao estado de tela', () => {
  /** `web.md` §5: proibido `useEffect` + `useState` para carregar dado de API. */
  test('os insights nao vivem em estado a mao', () => {
    expect(SOURCE).not.toContain('setInsights');
  });

  test('o "carregando" sai da propria chamada', () => {
    expect(SOURCE).not.toContain('setLoadingInsights');
  });

  /**
   * `react.md`: nunca usar `useEffect` para transformar dado — o mapa de notas
   * e' derivavel do que a query ja trouxe, e a copia em estado divergia dela na
   * primeira reavaliacao.
   */
  test('o mapa de notas e derivado, nao copiado para estado', () => {
    expect(SOURCE).not.toContain('setRatings');
  });

  /** Avaliar e' escrita: passa por mutation, e a lista de notas se refaz depois. */
  test('avaliar e mutation, e invalida a lista de notas', () => {
    expect(SOURCE).toContain('useMutation');
    expect(SOURCE).toContain('invalidateQueries');
  });
});
