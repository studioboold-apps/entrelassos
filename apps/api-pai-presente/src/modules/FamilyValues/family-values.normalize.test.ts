/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { normalizeFamilyValueKey, tidyFamilyValueLabel } from './family-values.normalize';

describe('a mesma resposta escrita de jeitos diferentes', () => {
  test('acento, maiuscula e espaco nao criam outra opcao', () => {
    const keys = ['Católica', 'catolica', '  CATÓLICA ', 'católica.'].map(normalizeFamilyValueKey);
    expect(new Set(keys).size).toBe(1);
  });

  test('palavras diferentes continuam diferentes', () => {
    expect(normalizeFamilyValueKey('Evangélica')).not.toBe(normalizeFamilyValueKey('Católica'));
  });

  test('o rotulo guardado sai arrumado', () => {
    expect(tidyFamilyValueLabel('  sem   religião ')).toBe('Sem religião');
  });
});
