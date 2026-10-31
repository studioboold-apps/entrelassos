/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { getTranslation, hasTranslation, translate, translateIn } from '@/lib/i18n';
import { DEFAULT_LOCALE } from '@/lib/locale';

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
    expect(getTranslation('en')).toBe(getTranslation('en'));
    expect(getTranslation(DEFAULT_LOCALE)).toBe(getTranslation(DEFAULT_LOCALE));
  });

  /** Trocar de idioma TEM de trocar o objeto: e' o que recalcula o que dependia de `t`. */
  test('cada idioma tem o seu', () => {
    expect(getTranslation('en')).not.toBe(getTranslation('es'));
  });

  test('idioma desconhecido cai no portugues', () => {
    expect(getTranslation('fr')).toBe(getTranslation(DEFAULT_LOCALE));
  });
});

describe('o idioma escolhido decide a frase', () => {
  test('a mesma chave fala tres linguas', () => {
    expect(translateIn('pt-BR', 'perfil.logout')).toBe('Sair da conta');
    expect(translateIn('en', 'perfil.logout')).toBe('Sign out');
    expect(translateIn('es', 'perfil.logout')).toBe('Cerrar sesión');
  });

  test('o argumento nomeado vale em qualquer idioma', () => {
    expect(translateIn('en', 'insightCard.forChild', { child: 'Ana' })).toBe('For Ana');
  });

  test('o formato de data tambem e traducao', () => {
    expect(translateIn('en', 'common.dateFormats.dayMonth')).toBe('MMM d');
  });

  /**
   * Frase que a traducao ainda nao tem cai no portugues, que e' a origem: um
   * trecho em portugues numa tela em ingles e' feio, a chave crua e' pior.
   */
  test('o idioma desconhecido cai no portugues', () => {
    expect(translateIn('fr', 'perfil.logout')).toBe('Sair da conta');
  });

  test('chave que nao existe em lingua nenhuma volta crua', () => {
    expect(translateIn('en', 'boletim.naoExiste')).toBe('boletim.naoExiste');
  });

  test('o portugues e o padrao fora do React', () => {
    expect(getTranslation(DEFAULT_LOCALE).t('perfil.logout')).toBe('Sair da conta');
  });
});
