/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { INSIGHT_ID_MAX_LENGTH, toInsightId, withStableIds } from './insight-id';

/**
 * O insight como a TELA o recebe: sem id proprio — a API nao manda um — e com
 * as chaves em `snake_case`, que e a forma que `toPagePayload` entrega.
 */
const INSIGHT = Object.freeze({
  title: 'Leia com a Lia antes de dormir',
  content: 'Vinte minutos de leitura viram conversa.',
  category: 'comportamento',
  child_name: 'Lia',
});

describe('toInsightId', () => {
  test('o mesmo insight tem o mesmo id em duas geracoes', () => {
    expect(toInsightId(INSIGHT)).toBe(toInsightId({ ...INSIGHT }));
  });

  test('insight de titulo diferente tem id diferente', () => {
    expect(toInsightId({ ...INSIGHT, title: 'Outro titulo' })).not.toBe(toInsightId(INSIGHT));
  });

  test('o mesmo titulo em categoria diferente e outro insight', () => {
    expect(toInsightId({ ...INSIGHT, category: 'saude' })).not.toBe(toInsightId(INSIGHT));
  });

  test('o mesmo conselho para outro filho e outro insight', () => {
    expect(toInsightId({ ...INSIGHT, child_name: 'Theo' })).not.toBe(toInsightId(INSIGHT));
  });

  test('o id cabe no caminho da rota e no limite da coluna', () => {
    const identifier = toInsightId(INSIGHT);
    expect(identifier.length).toBeLessThanOrEqual(INSIGHT_ID_MAX_LENGTH);
    expect(identifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encodeURIComponent(identifier)).toBe(identifier);
  });
});

describe('withStableIds', () => {
  test('duas geracoes da mesma lista produzem os mesmos ids', () => {
    const first = withStableIds([INSIGHT]);
    const second = withStableIds([{ ...INSIGHT }]);

    expect(second.map(({ id }) => id)).toEqual(first.map(({ id }) => id));
  });

  test('o conteudo do insight continua inteiro ao lado do id', () => {
    const [insight] = withStableIds([INSIGHT]);

    expect(insight).toMatchObject(INSIGHT);
    expect(insight.id).toBe(toInsightId(INSIGHT));
  });

  test('insight repetido no mesmo lote sai uma vez so', () => {
    expect(withStableIds([INSIGHT, { ...INSIGHT }])).toHaveLength(1);
  });
});
