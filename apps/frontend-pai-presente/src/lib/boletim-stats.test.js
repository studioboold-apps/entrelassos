/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { buildMonthStats, isInCalendarMonth } from './boletim-stats';

const SETEMBRO = new Date(2026, 8, 15);
const AGOSTO = new Date(2026, 7, 15);

describe('o mes de uma atividade e o mes do CALENDARIO dela', () => {
  /**
   * Medido: `new Date('2026-09-01')` e' meia-noite em Greenwich, que a oeste
   * dela e' 21h do dia 31/08. Comparado com `startOfMonth`, que e' meia-noite
   * LOCAL, o primeiro dia de todo mes caia fora — e reaparecia contado no mes
   * ANTERIOR. A API janela por dia de calendario (`buildMonthRange`: de
   * `2026-09-01` a `2026-09-30`), entao a nota que a IA dava e os numeros que a
   * tela mostrava eram de conjuntos diferentes de atividades.
   */
  test('a atividade do dia 1 pertence ao mes dela, nao ao anterior', () => {
    expect(isInCalendarMonth('2026-09-01', SETEMBRO)).toBe(true);
    expect(isInCalendarMonth('2026-09-01', AGOSTO)).toBe(false);
  });

  test('o ultimo dia do mes tambem pertence a ele', () => {
    expect(isInCalendarMonth('2026-09-30', SETEMBRO)).toBe(true);
  });

  test('dia de outro mes fica de fora', () => {
    expect(isInCalendarMonth('2026-10-01', SETEMBRO)).toBe(false);
  });

  /** Atividade sem data nao entra em mes nenhum — nem no que estiver aberto. */
  test('data ausente nao conta', () => {
    expect(isInCalendarMonth(undefined, SETEMBRO)).toBe(false);
  });
});

describe('buildMonthStats', () => {
  const activities = [
    { date: '2026-09-01', completed: true, rating: 5, category: 'aventura' },
    { date: '2026-09-20', completed: true, rating: 3, category: 'aventura' },
    { date: '2026-09-25', completed: false, category: 'jogos' },
    { date: '2026-08-31', completed: true, rating: 1, category: 'jogos' },
  ];

  const ratings = [
    { created_date: '2026-09-10T12:00:00.000Z', rating: 4, category: 'saude' },
    { created_date: '2026-08-10T12:00:00.000Z', rating: 2, category: 'saude' },
  ];

  test('conta a atividade do dia 1 e ignora a do mes passado', () => {
    const stats = buildMonthStats({ activities, ratings, month: SETEMBRO });

    expect(stats.totalActivities).toBe(3);
    expect(stats.completedActivities).toBe(2);
  });

  test('a taxa de conclusao e sobre o mes aberto', () => {
    const stats = buildMonthStats({ activities, ratings, month: SETEMBRO });

    expect(stats.completionRate).toBe(67);
  });

  test('a media so considera o que foi avaliado', () => {
    const stats = buildMonthStats({ activities, ratings, month: SETEMBRO });

    expect(stats.avgActivityRating).toBe('4.0');
  });

  /**
   * Sem nenhuma avaliacao a tela mostrava `0/5`. Zero e' uma nota — a pior — e o
   * pai lia como se tivesse tirado ela; o que aconteceu foi ninguem ter avaliado.
   */
  test('sem avaliacao nenhuma nao ha media, e isso nao e zero', () => {
    const stats = buildMonthStats({ activities: [], ratings: [], month: SETEMBRO });

    expect(stats.avgActivityRating).toBeUndefined();
    expect(stats.avgInsightRating).toBeUndefined();
  });

  test('insight lido conta pelo mes em que foi lido', () => {
    const stats = buildMonthStats({ activities, ratings, month: SETEMBRO });

    expect(stats.totalInsightsRead).toBe(1);
    expect(stats.avgInsightRating).toBe('4.0');
  });

  /** Mes sem atividade nenhuma nao divide por zero. */
  test('mes vazio devolve zeros, nao NaN', () => {
    const stats = buildMonthStats({ activities: [], ratings: [], month: SETEMBRO });

    expect(stats.completionRate).toBe(0);
    expect(stats.totalActivities).toBe(0);
  });
});
