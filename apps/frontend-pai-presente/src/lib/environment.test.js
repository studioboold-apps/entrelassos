/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { APP_ENVIRONMENTS, environmentBannerLabel, resolveAppEnvironment } from './environment';

describe('resolveAppEnvironment', () => {
  test('reconhece os tres ambientes declarados', () => {
    expect(resolveAppEnvironment('local')).toBe(APP_ENVIRONMENTS.LOCAL);
    expect(resolveAppEnvironment('staging')).toBe(APP_ENVIRONMENTS.STAGING);
    expect(resolveAppEnvironment('production')).toBe(APP_ENVIRONMENTS.PRODUCTION);
  });

  /**
   * `web.md` §12: variavel esquecida no painel de hospedagem nao pode fazer a
   * instalacao do cliente pedir desculpas. O default seguro e' o contrario do
   * intuitivo — quem esquece de declarar recebe producao, nao desenvolvimento.
   */
  test.each([undefined, '', '   ', 'homolog', 'PRODUCAO', 'dev'])(
    'cai em producao com %p',
    (value) => {
      expect(resolveAppEnvironment(value)).toBe(APP_ENVIRONMENTS.PRODUCTION);
    },
  );

  test('ignora espaco em volta e caixa', () => {
    expect(resolveAppEnvironment('  Staging  ')).toBe(APP_ENVIRONMENTS.STAGING);
  });
});

describe('environmentBannerLabel', () => {
  /** `web.md` §12: a faixa existe fora de producao, e so fora dela. */
  test.each([APP_ENVIRONMENTS.LOCAL, APP_ENVIRONMENTS.STAGING])('%s tem aviso', (environment) => {
    expect(environmentBannerLabel(environment)).toMatch(/dado de verdade/);
  });

  test('producao nao tem aviso nenhum', () => {
    expect(environmentBannerLabel(APP_ENVIRONMENTS.PRODUCTION)).toBeUndefined();
  });
});
