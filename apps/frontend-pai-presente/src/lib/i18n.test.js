/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { hasTranslation, translate, useTranslation } from '@/lib/i18n';

describe('a chave vira frase', () => {
  test('a chave aninhada resolve ate a folha', () => {
    expect(translate('activities.categories.aventura')).toBe('Aventura');
  });

  /**
   * Devolver a propria chave e' de proposito: lancar deixaria a tela em branco
   * por causa de uma frase. Quem garante que nao ha buraco e' `i18n-keys`, que
   * varre o codigo-fonte — nao o usuario descobrindo em producao.
   */
  test('a chave sem traducao devolve a propria chave', () => {
    expect(translate('boletim.naoExiste')).toBe('boletim.naoExiste');
    expect(hasTranslation('boletim.naoExiste')).toBe(false);
  });

  test('o galho intermediario nao passa por frase', () => {
    expect(hasTranslation('activities.categories')).toBe(false);
  });
});

describe('o argumento e nomeado, nunca posicional', () => {
  test('o nome entra no lugar do nome', () => {
    expect(translate('insightCard.forChild', { child: 'Ana' })).toBe('Para Ana');
  });

  /**
   * Argumento que faltou fica visivel como `{child}` em vez de virar
   * `undefined`: a frase quebrada aponta o que faltou, e `undefined` no meio do
   * texto so diz que algo deu errado em algum lugar.
   */
  test('o argumento que nao veio permanece a mostra', () => {
    expect(translate('insightCard.forChild')).toBe('Para {child}');
  });

  test('o numero entra como texto', () => {
    expect(translate('boletim.completedInMonth', { count: 0 })).toContain('0');
  });
});

describe('o tradutor tem identidade estavel', () => {
  /**
   * `t` entra em dependencia de `useMemo` e de `useCallback` pelas telas. Uma
   * funcao nova a cada render invalidaria todas elas de graca.
   */
  test('duas chamadas devolvem o mesmo objeto', () => {
    expect(useTranslation()).toBe(useTranslation());
  });
});
