/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { toAverageGrade } from './average-grade';

describe('media de nota', () => {
  test('sem nota nenhuma nao existe media', () => {
    expect(toAverageGrade([])).toBeUndefined();
  });

  /** Zero e a pior nota possivel, e nao o mesmo que ninguem ter avaliado. */
  test('a ausencia nao vira zero', () => {
    expect(toAverageGrade([])).not.toBe(0);
    expect(toAverageGrade([])).not.toBe('0');
  });

  test('a media sai com uma casa', () => {
    expect(toAverageGrade([5, 4])).toBe('4.5');
  });
});
