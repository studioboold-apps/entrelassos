/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import { SECURITY_HEADERS } from './http.constant';

/**
 * `S-005`: faltavam HSTS e CSP. A API responde JSON, entao a politica dela e' a
 * mais fechada que existe — nada de `script-src` com origem de login, porque
 * dali nunca sai documento. O `frame-ancestors` continua valendo: e' o que
 * impede enquadrar uma resposta de erro num site de terceiro.
 */
describe('a API responde com HSTS e uma CSP de resposta que nao e pagina', () => {
  test('HSTS por um ano, incluindo subdominio', () => {
    expect(SECURITY_HEADERS['Strict-Transport-Security']).toBe(
      'max-age=31536000; includeSubDomains',
    );
  });

  test('a CSP da API nega tudo', () => {
    expect(SECURITY_HEADERS['Content-Security-Policy']).toBe(
      "default-src 'none'; frame-ancestors 'none'",
    );
  });

  test('os quatro basicos continuam de pe', () => {
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
    expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
    expect(SECURITY_HEADERS['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(SECURITY_HEADERS['Permissions-Policy']).toContain('camera=()');
  });
});
