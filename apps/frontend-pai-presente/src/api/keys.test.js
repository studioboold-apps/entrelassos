/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { toApiPayload, toPagePayload } from './keys';

/** O objeto exato que `Onboarding.jsx` monta quando o pai preenche so o obrigatorio. */
const CHILD_AS_THE_SCREEN_BUILDS_IT = Object.freeze({
  name: 'Lia',
  age: 7,
  gender: 'feminino',
  favorite_hobby: '',
  favorite_color: '',
  favorite_food: '',
  favorite_movie_genre: '',
});

describe('toApiPayload', () => {
  /**
   * Medido contra a API viva: `POST /v1/children` com este corpo devolveu 400
   * `VALIDATION_FAILED` nomeando os quatro campos ("Too small: expected string to
   * have >=1 characters"). A tela herdou do Base44 o habito de mandar todo campo
   * sempre, e para a API `''` nao e ausencia — e valor invalido. O pai que
   * preenche so nome, idade e genero nao conseguia cadastrar filho NENHUM.
   */
  test('campo em branco nao vai no corpo', () => {
    expect(toApiPayload(CHILD_AS_THE_SCREEN_BUILDS_IT)).toEqual({
      name: 'Lia',
      age: 7,
      gender: 'feminino',
    });
  });

  /**
   * Medido: `PATCH /v1/me` com `maritalStatus: ''` devolveu 400 "Invalid option".
   * Pular a etapa de preferencias impedia o pai de salvar o proprio perfil.
   */
  test('estado civil em branco nao vai no corpo', () => {
    expect(toApiPayload({ full_name: 'Joao', age: 34, marital_status: '' })).toEqual({
      fullName: 'Joao',
      age: 34,
    });
  });

  /**
   * `false` e `0` sao resposta, nao ausencia: `completed: false` e a atividade que
   * o pai marcou como nao feita, e some-la reverteria a escolha dele em silencio.
   */
  test('false e zero continuam no corpo', () => {
    expect(toApiPayload({ completed: false, age: 0, note: '' })).toEqual({
      completed: false,
      age: 0,
    });
  });

  test('o branco some tambem dentro de objeto aninhado', () => {
    expect(toApiPayload({ child: { name: 'Lia', favorite_color: '' } })).toEqual({
      child: { name: 'Lia' },
    });
  });

  test('o apelido continua valendo', () => {
    expect(toApiPayload({ date: '2026-09-05', time: '' }, { date: 'activityDate', time: 'activityTime' })).toEqual({
      activityDate: '2026-09-05',
    });
  });
});

describe('toPagePayload', () => {
  /**
   * O caminho de volta NAO poda: um campo que a API devolve vazio e informacao
   * sobre o estado do dado, e a tela le `child.favorite_color || ''` para decidir
   * o que mostrar.
   */
  test('a resposta da API chega inteira na tela', () => {
    expect(toPagePayload({ favoriteColor: '', name: 'Lia' })).toEqual({
      favorite_color: '',
      name: 'Lia',
    });
  });
});
