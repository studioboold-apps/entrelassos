/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { toCalendarDate } from './date.util';

describe('toCalendarDate', () => {
  test('dia de calendario ja em texto atravessa inteiro', () => {
    expect(toCalendarDate('2026-09-10')).toBe('2026-09-10');
  });

  /**
   * O driver do Bun devolve coluna `date` como `Date` na meia-noite UTC. Ler
   * isso com getter local numa maquina a oeste de Greenwich devolve o dia
   * anterior — que e exatamente o defeito medido na tela de Juntinhos.
   */
  test('instante de meia-noite UTC volta ao dia que estava gravado', () => {
    expect(toCalendarDate(new Date('2026-09-10T00:00:00.000Z'))).toBe('2026-09-10');
  });

  test('primeiro dia do mes nao perde o zero a esquerda', () => {
    expect(toCalendarDate(new Date('2026-01-01T00:00:00.000Z'))).toBe('2026-01-01');
  });

  test('texto que ja veio com sufixo de instante perde o sufixo, nao o dia', () => {
    expect(toCalendarDate('2026-09-10T00:00:00.000Z')).toBe('2026-09-10');
  });

  test('ausencia continua ausencia', () => {
    expect(toCalendarDate(null)).toBeNull();
  });
});
