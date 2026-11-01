/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { toProfileUpdate } from './profile-form';

describe('o perfil so manda o que a API tem', () => {
  /**
   * Medido contra a API de pe: `PATCH /v1/me` com o campo de orientacao junto
   * responde `400 VALIDATION_FAILED — Unrecognized key`, e sozinho tambem. O
   * `GET /v1/me` devolve oito chaves, e nenhuma delas guarda orientacao.
   *
   * A tela oferecia tres desses campos para o pai escolher. Ele escolhia, o
   * dialogo fechava com cara de salvo, e o painel continuava com o traco — para
   * sempre. Campo que promete guardar dado sensivel e joga fora em silencio e
   * pior que campo que falha.
   */
  test('campo que a base nao tem nao viaja', () => {
    const update = toProfileUpdate({
      age: '40',
      marital_status: 'casado',
      religious_orientation: 'catolico',
      political_orientation: 'centro',
      sexual_orientation: 'heterossexual',
    });

    expect(Object.keys(update).sort()).toEqual(['age', 'marital_status']);
  });

  /**
   * Medido: com o campo em branco, o navegador manda `{"age":null}` e a API
   * responde `400 — expected number, received null`. Apagar a idade nao e pedir
   * para gravar coisa nenhuma nela.
   */
  test('idade em branco fica de fora, em vez de virar numero invalido', () => {
    expect(toProfileUpdate({ age: '', marital_status: 'casado' })).toEqual({ marital_status: 'casado' });
  });

  test('idade preenchida viaja como numero', () => {
    expect(toProfileUpdate({ age: '40', marital_status: '' })).toEqual({ age: 40 });
  });

  test('nada escolhido nao vira requisicao com chave vazia', () => {
    expect(toProfileUpdate({ age: '', marital_status: '' })).toEqual({});
  });
});

describe('cidade e foto do perfil', () => {
  test('cidade em branco pede para apagar; preenchida vai sem espacos', () => {
    expect(toProfileUpdate({ city: '  ' })).toEqual({ city: null });
    expect(toProfileUpdate({ city: ' Campinas, SP ' })).toEqual({ city: 'Campinas, SP' });
  });

  test('foto so viaja quando a tela mexeu nela', () => {
    expect(toProfileUpdate({ age: '30' })).toEqual({ age: 30 });
    expect(toProfileUpdate({ avatar_url: null })).toEqual({ avatar_url: null });
  });
});
