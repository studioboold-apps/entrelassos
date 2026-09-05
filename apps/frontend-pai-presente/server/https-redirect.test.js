/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { buildHttpsRedirect } from './https-redirect.js';

const ask = (headers) => new Request('http://interno:8080/perfil?aba=filhos', { headers });

describe('quem chegou em texto puro e desviado para HTTPS', () => {
  test('o desvio guarda caminho, busca e o host publico', () => {
    const redirect = buildHttpsRedirect(
      ask({ 'x-forwarded-proto': 'http', 'x-forwarded-host': 'paipresente.app', host: 'interno' }),
    );

    expect(redirect?.headers.get('location')).toBe('https://paipresente.app/perfil?aba=filhos');
  });

  /** 301 faz cliente antigo trocar POST por GET, e o corpo do login some. */
  test('o desvio e 308, para o metodo sobreviver', () => {
    expect(buildHttpsRedirect(ask({ 'x-forwarded-proto': 'http', host: 'p.app' }))?.status).toBe(
      308,
    );
  });

  test('sem x-forwarded-host vale o host da requisicao', () => {
    const redirect = buildHttpsRedirect(ask({ 'x-forwarded-proto': 'http', host: 'p.app' }));

    expect(redirect?.headers.get('location')).toBe('https://p.app/perfil?aba=filhos');
  });
});

describe('quem ja veio seguro, ou sem proxy nenhum, passa direto', () => {
  test('https nao desvia', () => {
    expect(buildHttpsRedirect(ask({ 'x-forwarded-proto': 'https', host: 'p.app' }))).toBeUndefined();
  });

  /**
   * Sem o cabecalho nao ha proxy na frente: e' a imagem rodando direto, na
   * maquina de quem desenvolve. Desviar ali quebraria a fumaca local — e nao
   * protegeria ninguem, porque nao ha rede publica no caminho.
   */
  test('sem proxy na frente nao ha desvio', () => {
    expect(buildHttpsRedirect(ask({ host: 'localhost:5410' }))).toBeUndefined();
  });
});
