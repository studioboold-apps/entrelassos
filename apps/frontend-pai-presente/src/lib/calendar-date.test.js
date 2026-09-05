/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { toCalendarDate, toLocalDate } from './calendar-date';

describe('toLocalDate', () => {
  /**
   * `new Date('2026-09-10')` e lido como meia-noite UTC pela especificacao da
   * linguagem: a oeste de Greenwich isso e o DIA ANTERIOR. Foi o que punha a
   * atividade do dia 10 sob o dia 9 na agenda e o ponto no quadrado errado.
   */
  test('dia de calendario vira meia-noite LOCAL, nao meia-noite UTC', () => {
    const parsed = toLocalDate('2026-09-10');

    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(8);
    expect(parsed?.getDate()).toBe(10);
    expect(parsed?.getHours()).toBe(0);
  });

  /** A API antiga publicava instante; quem ja tem a tela aberta nao recarrega. */
  test('instante herdado da API antiga cai no mesmo dia', () => {
    const parsed = toLocalDate('2026-09-10T00:00:00.000Z');

    expect(parsed?.getDate()).toBe(10);
    expect(parsed?.getMonth()).toBe(8);
  });

  test('primeiro dia do ano nao escorrega para dezembro', () => {
    const parsed = toLocalDate('2026-01-01');

    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(0);
    expect(parsed?.getDate()).toBe(1);
  });

  test('ausencia nao vira Invalid Date', () => {
    expect(toLocalDate(null)).toBeUndefined();
    expect(toLocalDate(undefined)).toBeUndefined();
    expect(toLocalDate('')).toBeUndefined();
  });

  test('texto que nao e dia de calendario nao vira data', () => {
    expect(toLocalDate('amanha')).toBeUndefined();
  });
});

describe('toCalendarDate', () => {
  test('le a data com os getters LOCAIS, para casar com o que a pessoa ve', () => {
    expect(toCalendarDate(new Date(2026, 8, 10, 23, 30))).toBe('2026-09-10');
  });

  test('mes e dia de um digito ganham zero a esquerda', () => {
    expect(toCalendarDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  /** Ida e volta: o dia que sai e o mesmo que entrou, em qualquer fuso. */
  test('toCalendarDate desfaz toLocalDate', () => {
    const day = '2026-12-31';

    expect(toCalendarDate(toLocalDate(day))).toBe(day);
  });
});
