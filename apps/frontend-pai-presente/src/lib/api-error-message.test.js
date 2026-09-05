/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { ApiError } from '../api/http';
import { describeApiFailure, GENERIC_FAILURE_MESSAGE } from './api-error-message';

function buildValidationError(details) {
  return new ApiError({ status: 400, code: 'VALIDATION_FAILED', message: 'Requisicao invalida.', details });
}

describe('describeApiFailure', () => {
  /**
   * `Onboarding.jsx` so fazia `console.error`: o botao voltava de "Salvando..."
   * para "Concluir" e nada mais acontecia. O pai nao tem console — para ele o
   * aplicativo simplesmente nao salva, sem dizer o que esta errado. A recusa ja
   * chegava nomeando os campos (`ApiError.details`); ninguem desenhava.
   */
  test('nomeia TODOS os campos recusados, nao o primeiro', () => {
    const failure = describeApiFailure(
      buildValidationError([
        { field: 'favoriteHobby', message: 'Too small' },
        { field: 'favoriteColor', message: 'Too small' },
      ]),
    );

    expect(failure.fields).toEqual(['Hobby favorito', 'Cor favorita']);
    expect(failure.message).toBe('Confira: Hobby favorito, Cor favorita.');
  });

  /** Um campo que viola duas regras e um item do aviso, nao dois. */
  test('campo repetido aparece uma vez so', () => {
    const failure = describeApiFailure(
      buildValidationError([
        { field: 'age', message: 'Too small' },
        { field: 'age', message: 'Not an integer' },
      ]),
    );

    expect(failure.fields).toEqual(['Idade']);
  });

  /**
   * Esconder o campo sem rotulo conhecido devolveria exatamente o aviso generico
   * que esta funcao existe para consertar.
   */
  test('campo sem rotulo conhecido sai com o nome que a API usou', () => {
    const failure = describeApiFailure(buildValidationError([{ field: 'campoNovoDaApi', message: 'Invalid' }]));

    expect(failure.fields).toEqual(['campoNovoDaApi']);
  });

  test('recusa que nao aponta campo nenhum cai na mensagem da API', () => {
    const failure = describeApiFailure(
      new ApiError({ status: 409, code: 'CHILD_ALREADY_EXISTS', message: 'Esse filho ja esta cadastrado.' }),
    );

    expect(failure.fields).toEqual([]);
    expect(failure.message).toBe('Esse filho ja esta cadastrado.');
  });

  /** Queda de rede nao e recusa: nao ha campo para conferir, e nao ha texto da API. */
  test('falha sem resposta da API cai na mensagem generica', () => {
    const failure = describeApiFailure(new TypeError('Failed to fetch'));

    expect(failure.fields).toEqual([]);
    expect(failure.message).toBe(GENERIC_FAILURE_MESSAGE);
  });
});
