/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { ERROR_CODES } from '../shared/errors/codes';

import { LlmNotConfiguredError } from './ai.error';

describe('a falta de chave e a mesma para os quatro caminhos de IA', () => {
  /**
   * Uma classe de erro serve insight, sugestao, boletim e chat. Enquanto a frase
   * dizia "Sugestoes por IA", o pai que perguntava no chat lia sobre um recurso
   * que nao pediu — e a mensagem agora chega inteira a tela, nao mais ao console.
   */
  test('a frase nao fala de um recurso so', () => {
    const error = new LlmNotConfiguredError('anthropic');

    expect(error.message).not.toContain('Sugestoes');
  });

  test('a frase nomeia o provedor que esta sem chave', () => {
    const error = new LlmNotConfiguredError('anthropic');

    expect(error.message).toContain('anthropic');
  });

  test('o codigo e estavel: e por ele que a tela decide', () => {
    const error = new LlmNotConfiguredError('anthropic');

    expect(error.code).toBe(ERROR_CODES.ai.NOT_CONFIGURED);
  });
});
