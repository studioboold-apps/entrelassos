/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { UNKNOWN_CLIENT_IP } from '../shared.constant';
import { readClientIp } from './request.util';

function buildRequest(headers: Record<string, string>): Request {
  return new Request('https://api.exemplo.test/v1/me', { headers });
}

/**
 * `security.md` §10 pede IP na trilha de auditoria, e a decisao D6 poe a API
 * atras de Fly.io ou Railway. Ali `server.requestIP()` devolve o endereco do
 * PROXY — sempre o mesmo, para todo mundo —, o que e' pior que nao registrar:
 * a trilha ficaria com uma coluna cheia e inutil, parecendo prova.
 *
 * Quem sabe o endereco de origem e' o proxy, e ele conta no cabecalho.
 */
describe('readClientIp', () => {
  test('a origem e o PRIMEIRO endereco da cadeia, nao o ultimo', () => {
    const request = buildRequest({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18, 10.0.0.1' });

    expect(readClientIp(request)).toBe('203.0.113.7');
  });

  test('sem cadeia, vale o endereco que o proxy declara sozinho', () => {
    expect(readClientIp(buildRequest({ 'x-real-ip': '198.51.100.4' }))).toBe('198.51.100.4');
  });

  /**
   * Sem cabecalho nenhum (chamada local, teste, ferramenta), a trilha diz que
   * NAO SABE. Guardar string vazia faria a coluna parecer preenchida.
   */
  test('sem cabecalho nenhum, a trilha admite que nao sabe', () => {
    expect(readClientIp(buildRequest({}))).toBe(UNKNOWN_CLIENT_IP);
  });

  test('cabecalho em branco nao vira endereco em branco', () => {
    expect(readClientIp(buildRequest({ 'x-forwarded-for': '   ' }))).toBe(UNKNOWN_CLIENT_IP);
  });

  /**
   * O cabecalho e' entrada NAO CONFIAVEL: quem chama direto escreve o que
   * quiser nele. Sem corte, um cabecalho de dez mil caracteres derruba o
   * `INSERT` da auditoria — e derrubar a auditoria e' derrubar a exclusao
   * inteira, que roda na mesma transacao.
   */
  test('endereco absurdamente longo e cortado, nao rejeitado', () => {
    const hostile = 'x'.repeat(500);

    expect(readClientIp(buildRequest({ 'x-forwarded-for': hostile })).length).toBeLessThanOrEqual(64);
  });
});
