/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = readFileSync(join(import.meta.dir, 'ActivityCard.jsx'), 'utf8');

describe('o cartao le o dia como DIA', () => {
  test('nenhum `new Date` cru sobre o campo de data', () => {
    expect(SOURCE).not.toContain('new Date(activity.date)');
  });

  test('o dia passa pelo modulo que ja tem teste de fuso', () => {
    expect(SOURCE).toContain('toLocalDate');
  });
});
