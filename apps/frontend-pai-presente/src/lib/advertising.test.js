/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { buildAdsenseScriptUrl, resolveAdvertisingConfig } from './advertising.js';

const CLIENT_ID = 'ca-pub-1234567890123456';

describe('o anuncio liga so com os dois ids', () => {
  test('sem nada, desligado', () => {
    expect(resolveAdvertisingConfig({}).enabled).toBe(false);
  });

  test('so o cliente, desligado — seria um quadro vazio', () => {
    expect(resolveAdvertisingConfig({ clientId: CLIENT_ID, slotId: ' ' }).enabled).toBe(false);
  });

  test('cliente e bloco, ligado', () => {
    const config = resolveAdvertisingConfig({ clientId: CLIENT_ID, slotId: '9876543210', environment: 'production' });
    expect(config).toEqual({ enabled: true, clientId: CLIENT_ID, slotId: '9876543210', testMode: false });
  });

  /** Clique de quem testa conta como invalido, e o Google suspende a conta. */
  test('fora de producao, o bloco vai em modo de teste', () => {
    expect(resolveAdvertisingConfig({ clientId: CLIENT_ID, slotId: '1', environment: 'staging' }).testMode).toBe(true);
    expect(resolveAdvertisingConfig({ clientId: CLIENT_ID, slotId: '1', environment: 'local' }).testMode).toBe(true);
  });
});

describe('o script do Google', () => {
  test('leva o cliente na URL', () => {
    expect(buildAdsenseScriptUrl(CLIENT_ID)).toBe(
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456',
    );
  });
});
