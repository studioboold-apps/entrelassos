/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { findSameFamilyValue, matchFamilyValueOptions, normalizeFamilyValueKey } from './family-values';

const OPTIONS = ['Católica', 'Evangélica', 'Espírita', 'Sem religião'];

describe('valores da familia: a mesma resposta nao vira duas', () => {
  test('acento e maiuscula nao mudam a chave', () => {
    expect(normalizeFamilyValueKey(' CATÓLICA ')).toBe(normalizeFamilyValueKey('catolica'));
  });

  test('o que ja existe e reconhecido mesmo escrito diferente', () => {
    expect(findSameFamilyValue(OPTIONS, 'espirita')).toBe('Espírita');
    expect(findSameFamilyValue(OPTIONS, 'Messiânica')).toBeUndefined();
  });

  test('as sugestoes filtram pelo que foi digitado, sem acento', () => {
    expect(matchFamilyValueOptions(OPTIONS, 'eli')).toEqual(['Evangélica', 'Sem religião']);
    expect(matchFamilyValueOptions(OPTIONS, '')).toEqual(OPTIONS);
  });
});
