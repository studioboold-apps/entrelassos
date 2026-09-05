/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = readFileSync(join(import.meta.dir, 'InsightCard.jsx'), 'utf8');

describe('o nome do filho no cartao de insight', () => {
  /**
   * `toPagePayload` entrega a resposta em `snake_case`: o `childName` da API
   * chega a tela como `child_name`. Lendo a chave da API, a linha "Para Lia"
   * nunca renderizava — o codigo existia e nunca era alcancado.
   */
  test('o cartao le a chave que a tela recebe, nao a que a API manda', () => {
    expect(SOURCE).toContain('child_name');
    expect(SOURCE).not.toContain('childName');
  });

  test('sem nome de filho, o cartao nao imprime a linha vazia', () => {
    expect(SOURCE).toContain('child_name && (');
  });
});
