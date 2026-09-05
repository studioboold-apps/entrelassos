/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'bun:test';

/**
 * O teste le o TEXTO da tela: nao ha harness de DOM neste app, e a pergunta aqui
 * nao e como o React pinta — e se a recusa da API chega a algum lugar visivel.
 */
const SOURCE = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'Onboarding.jsx'), 'utf8');

describe('Onboarding.jsx', () => {
  /**
   * `handleComplete` so fazia `console.error`. Medido contra a API viva: com os
   * campos opcionais em branco a chamada volta 400 nomeando cada um, e a tela
   * devolvia o botao de "Salvando..." para "Comecar minha jornada" sem uma
   * palavra. O pai nao tem console.
   */
  test('a falha ao salvar aparece na tela, nao so no console', () => {
    expect(SOURCE).toContain('describeApiFailure(error)');
    expect(SOURCE).toContain('role="alert"');
  });

  /** O aviso da tentativa anterior nao pode sobreviver a tentativa seguinte. */
  test('nova tentativa limpa o aviso anterior', () => {
    expect(SOURCE).toContain('setSaveFailure(null)');
  });
});
