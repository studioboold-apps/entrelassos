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
const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = readFileSync(join(HERE, 'Onboarding.jsx'), 'utf8');
const HOOK = readFileSync(join(HERE, 'Onboarding.hook.js'), 'utf8');
const SOURCE = `${PAGE}\n${HOOK}`;

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

  /**
   * Em producao (31/10/2026) o pai concluiu o cadastro e caiu de novo nele: a
   * Home leu o `currentUser` antigo do cache, com `onboarding_completed` falso.
   */
  test('concluir descarta o usuario em cache antes de ir para a Home', () => {
    const removeAt = HOOK.indexOf("removeQueries({ queryKey: ['currentUser'] })");
    expect(removeAt).toBeGreaterThan(-1);
    expect(removeAt).toBeLessThan(HOOK.indexOf("navigate(createPageUrl('Home'))"));
  });

  /** O aviso da tentativa anterior nao pode sobreviver a tentativa seguinte. */
  test('nova tentativa limpa o aviso anterior', () => {
    expect(SOURCE).toContain('setSaveFailure(null)');
  });
});

/**
 * `TL.1` — os tres campos de orientacao (sexual, religiosa, politica).
 *
 * Medido contra a API viva: `PATCH /v1/me` com qualquer um deles responde
 * `400 VALIDATION_FAILED — Unrecognized key`, e `GET /v1/me` devolve so
 * `email, fullName, age, maritalStatus, onboardingCompleted`. Nao existe coluna
 * para eles em lugar nenhum da base nova, e o prompt de IA — o unico consumidor
 * que eles tinham na Base44 — deixou de os pedir.
 *
 * Continuar perguntando e' pior que nao ter o campo: o pai declara religiao e
 * posicao politica, o cliente descarta antes de enviar, e ele fica achando que
 * o aplicativo guarda isso.
 */
describe('a tela nao coleta dado sensivel que ninguem guarda', () => {
  test('o passo de preferencias nao pergunta orientacao', () => {
    expect(SOURCE).not.toContain('sexual_orientation');
    expect(SOURCE).not.toContain('religious_orientation');
    expect(SOURCE).not.toContain('political_orientation');
  });

  /**
   * Mesmo defeito do Perfil, e o mesmo conserto: idade em branco virava
   * `parseInt('')` -> `NaN` -> `null` no corpo, e a API recusava a conclusao
   * INTEIRA do onboarding. O corpo do `PATCH` se monta num lugar so.
   */
  test('o corpo do PATCH sai do modulo unico', () => {
    expect(SOURCE).toContain('toProfileUpdate');
    expect(SOURCE).not.toContain("parseInt(userData.age)");
  });
});

describe('a tela desenha, o hook decide (web.md §4)', () => {
  test('a pagina nao guarda estado nem chama a API', () => {
    expect(PAGE).not.toContain('useState');
    expect(PAGE).not.toContain('api.');
  });

  test('a decisao mora no hook do lado', () => {
    expect(PAGE).toContain('useOnboarding()');
    expect(HOOK).toContain('toProfileUpdate');
  });
});
