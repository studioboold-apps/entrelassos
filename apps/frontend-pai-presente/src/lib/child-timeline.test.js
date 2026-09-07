/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { TIMELINE_ENTRY_KINDS, activityDay, buildChildTimeline, childFileDay } from './child-timeline';

const CHILD_ID = 'child-1';

function buildFile(overrides) {
  return { id: 'f1', child_id: CHILD_ID, kind: 'foto', created_date: '2026-09-01T10:00:00.000Z', ...overrides };
}

function buildActivity(overrides) {
  return { id: 'a1', child_id: CHILD_ID, title: 'Parque', date: '2026-09-01', created_date: '2026-09-01T09:00:00.000Z', ...overrides };
}

describe('o dia de cada registro', () => {
  /**
   * A API ordena por `coalesce(taken_on, created_at::date)`. A tela repete a
   * conta: arquivo antigo digitalizado hoje tem de cair no dia da FOTO, nao no
   * dia do envio.
   */
  test('a foto vale pelo dia em que foi tirada, nao pelo dia do envio', () => {
    expect(childFileDay(buildFile({ taken_on: '2024-03-02' }))).toBe('2024-03-02');
  });

  test('sem dia da foto, vale o dia do envio', () => {
    expect(childFileDay(buildFile({ taken_on: null }))).toBe('2026-09-01');
  });

  test('a atividade vale pelo dia dela', () => {
    expect(activityDay(buildActivity({ date: '2026-08-20' }))).toBe('2026-08-20');
  });

  /** `new Date('2026-09-01')` seria 31/08 a oeste de Greenwich; o corte de texto nao move o dia. */
  test('o dia nao anda de fuso', () => {
    expect(activityDay(buildActivity({ date: '2026-09-01' }))).toBe('2026-09-01');
  });
});

describe('atividade, foto e exame na mesma ordem de data', () => {
  test('o mais recente vem primeiro, misturando os tres', () => {
    const timeline = buildChildTimeline({
      childId: CHILD_ID,
      files: [
        buildFile({ id: 'foto', kind: 'foto', taken_on: '2026-09-05' }),
        buildFile({ id: 'exame', kind: 'exame', taken_on: '2026-08-01' }),
      ],
      activities: [buildActivity({ id: 'ativ', date: '2026-09-03' })],
    });

    expect(timeline.map((entry) => entry.item.id)).toEqual(['foto', 'ativ', 'exame']);
  });

  test('cada registro diz de que tipo e', () => {
    const timeline = buildChildTimeline({
      childId: CHILD_ID,
      files: [buildFile({ taken_on: '2026-09-05' })],
      activities: [buildActivity({ date: '2026-09-03' })],
    });

    expect(timeline.map((entry) => entry.entryKind)).toEqual([
      TIMELINE_ENTRY_KINDS.FILE,
      TIMELINE_ENTRY_KINDS.ACTIVITY,
    ]);
  });

  /**
   * A lista de atividades e' da CONTA, nao do filho: sem o filtro, a linha do
   * tempo de um filho mostraria o passeio do irmao.
   */
  test('a atividade do outro filho fica fora', () => {
    const timeline = buildChildTimeline({
      childId: CHILD_ID,
      activities: [buildActivity({ id: 'irmao', child_id: 'child-2' }), buildActivity({ id: 'meu' })],
    });

    expect(timeline.map((entry) => entry.item.id)).toEqual(['meu']);
  });

  /** Atividade sem filho vinculado nao e' de ninguem, e nao pode virar de todos. */
  test('a atividade sem filho fica fora', () => {
    const timeline = buildChildTimeline({
      childId: CHILD_ID,
      activities: [buildActivity({ id: 'solta', child_id: undefined })],
    });

    expect(timeline).toHaveLength(0);
  });

  /**
   * Dois registros no mesmo dia sem terceiro criterio trocavam de lugar entre
   * duas renderizacoes — a lista pulava debaixo do dedo de quem ia apagar.
   */
  test('empate no dia se desfaz pelo instante da gravacao', () => {
    const timeline = buildChildTimeline({
      childId: CHILD_ID,
      files: [
        buildFile({ id: 'manha', taken_on: '2026-09-05', created_date: '2026-09-05T08:00:00.000Z' }),
        buildFile({ id: 'noite', taken_on: '2026-09-05', created_date: '2026-09-05T21:00:00.000Z' }),
      ],
    });

    expect(timeline.map((entry) => entry.item.id)).toEqual(['noite', 'manha']);
  });

  /** Arquivo e atividade tem ids independentes: sem o prefixo, o `key` do React colidiria. */
  test('a chave separa arquivo de atividade com o mesmo id', () => {
    const timeline = buildChildTimeline({
      childId: CHILD_ID,
      files: [buildFile({ id: 'x', taken_on: '2026-09-05' })],
      activities: [buildActivity({ id: 'x', date: '2026-09-05' })],
    });

    expect(new Set(timeline.map((entry) => entry.key)).size).toBe(2);
  });

  test('sem nada guardado a linha do tempo e vazia', () => {
    expect(buildChildTimeline()).toEqual([]);
  });
});
