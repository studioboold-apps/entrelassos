/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { toInsightId, withInsightIds } from './insight-identity';

const INSIGHT = Object.freeze({
  category: 'comportamento',
  title: 'Como falar de dinheiro',
  content: 'Comece pela mesada.',
  childName: 'Ana',
});

describe('o insight tem identidade, e ela vem do TEXTO', () => {
  /**
   * Medido: a tela batizava cada insight de `insight_<agora>_<indice>`. Duas
   * geracoes do MESMO texto, a cinco milissegundos de distancia, sairam
   * `insight_1788619351442_0` e `insight_1788619351448_0`.
   *
   * O id nao e enfeite: ele e' a CHAVE da nota (`PUT /v1/insight-ratings/:id`,
   * com unique em `userId + insightId`). Id novo a cada geracao significa que a
   * estrela que o pai deu nunca mais reaparece, e que a tabela ganha uma linha
   * por leitura de um texto que ninguem mais consegue reencontrar.
   */
  test('o mesmo texto tem sempre o mesmo id', () => {
    expect(toInsightId(INSIGHT)).toBe(toInsightId({ ...INSIGHT }));
  });

  test('texto diferente tem id diferente', () => {
    expect(toInsightId(INSIGHT)).not.toBe(toInsightId({ ...INSIGHT, title: 'Outro assunto' }));
  });

  /** A categoria faz parte da identidade: o mesmo titulo em outra area e' outro insight. */
  test('a categoria entra na identidade', () => {
    expect(toInsightId(INSIGHT)).not.toBe(toInsightId({ ...INSIGHT, category: 'saude' }));
  });

  /** O id vai no CAMINHO da URL e na coluna: nada de espaco, acento ou barra. */
  test('o id e seguro para caminho de URL', () => {
    expect(toInsightId({ ...INSIGHT, title: 'Educação / limites' })).toMatch(/^[a-z0-9_-]+$/);
  });

  test('a posicao na lista nao muda o id', () => {
    const [primeiro] = withInsightIds([INSIGHT, { ...INSIGHT, title: 'Outro' }]);
    const [, segundo] = withInsightIds([{ ...INSIGHT, title: 'Outro' }, INSIGHT]);

    expect(primeiro.id).toBe(segundo.id);
  });

  test('withInsightIds preserva o insight inteiro', () => {
    const [identified] = withInsightIds([INSIGHT]);

    expect(identified.title).toBe(INSIGHT.title);
    expect(identified.content).toBe(INSIGHT.content);
    expect(identified.category).toBe(INSIGHT.category);
  });
});
