/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A tela nao e importada: puxar a pagina traria React, os dialogos e o
 * roteador. O que se afirma aqui e a LIGACAO — que o perfil encaminha o corpo
 * da requisicao, a media e a falha a quem ja tem regra e teste proprios.
 */
const SOURCE = readFileSync(join(import.meta.dir, 'Perfil.jsx'), 'utf8');

describe('a tela nao oferece campo que a base nao tem', () => {
  /**
   * Medido contra a API de pe: `PATCH /v1/me` com qualquer um dos tres campos
   * de orientacao responde `400 — Unrecognized key`, e o `GET /v1/me` devolve
   * oito chaves sem nenhuma delas. O cliente ainda filtrava antes de enviar,
   * entao o pai escolhia, o dialogo fechava com cara de salvo, e o painel
   * seguia mostrando o traco.
   *
   * A permanencia desses campos no produto e a decisao TL.1, da Fase 3. Ate la
   * eles nao existem em lugar nenhum, e a tela nao pode fingir que sim.
   */
  test('nao ha mais campo de orientacao sexual', () => {
    expect(SOURCE).not.toContain('sexual_orientation');
  });

  test('nao ha mais campo de orientacao religiosa', () => {
    expect(SOURCE).not.toContain('religious_orientation');
  });

  test('nao ha mais campo de orientacao politica', () => {
    expect(SOURCE).not.toContain('political_orientation');
  });

  /** O corpo da requisicao sai de funcao pura, com teste que cobre o branco. */
  test('o corpo do salvar vem do modulo que tem teste', () => {
    expect(SOURCE).toContain('toProfileUpdate');
  });
});

describe('o salvar que falha diz o que houve', () => {
  /**
   * Nenhuma das duas recusas medidas aparecia: o dialogo ficava aberto, o botao
   * voltava de "Salvando..." para "Salvar", e nada mais. Erro invisivel vira
   * "o app nao salva", que e o relato mais caro de investigar que existe.
   */
  test('a falha vira frase pelo tradutor unico', () => {
    expect(SOURCE).toContain('describeApiFailure');
  });

  test('a falha aparece como aviso', () => {
    expect(SOURCE).toContain('role="alert"');
  });
});

describe('o que o pai digita nao e apagado por baixo dele', () => {
  /**
   * O formulario era reescrito a cada resposta nova da consulta do usuario.
   * Basta a janela reganhar o foco durante a edicao para o TanStack refazer a
   * busca e o que estava sendo digitado sumir. O formulario passa a ser
   * preenchido quando o dialogo ABRE, que e o unico momento em que isso e o
   * que o pai quer.
   */
  test('o formulario nao e reescrito por efeito', () => {
    expect(SOURCE).not.toContain('useEffect');
  });
});

describe('a media diz a diferenca entre zero e nenhuma', () => {
  /**
   * Sem nota nenhuma a tela mostrava `0`, que e a pior nota possivel — nao a
   * ausencia dela. O mesmo defeito ja tinha sido corrigido no boletim, e a
   * conta agora e a MESMA funcao dos dois lados.
   */
  test('a media sai do modulo unico', () => {
    expect(SOURCE).toContain('toAverageGrade');
  });
});

describe('apagar filho pergunta antes', () => {
  /**
   * O clique na lixeira apagava na hora. Nao ha desfazer, e o cadastro do filho
   * leva sete campos para refazer — sem contar o que se perde junto por ser
   * dele.
   */
  test('apagar passa por confirmacao', () => {
    expect(SOURCE).toContain('AlertDialog');
  });
});
