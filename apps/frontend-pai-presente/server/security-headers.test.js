/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { describe, expect, test } from 'bun:test';

import {
  CONTENT_SECURITY_POLICY,
  WEB_SECURITY_HEADERS,
  decorateWithSecurityHeaders,
  readPolicyDirective,
} from './security-headers.js';

/**
 * `S-005`: a imagem da web servia `dist` sem cabecalho de seguranca NENHUM. O
 * `Bun.serve` de desenvolvimento nunca precisou deles, e a imagem nasceu do
 * mesmo arquivo — entao a tela do pai iria ao ar sem CSP, sem HSTS e
 * emoldurável por qualquer site.
 */
describe('a tela vai ao ar com os cabecalhos que security.md §3 exige', () => {
  test('os quatro cabecalhos basicos estao declarados', () => {
    expect(WEB_SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
    expect(WEB_SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
    expect(WEB_SECURITY_HEADERS['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(WEB_SECURITY_HEADERS['Permissions-Policy']).toContain('camera=()');
  });

  test('HSTS por um ano, incluindo subdominio', () => {
    expect(WEB_SECURITY_HEADERS['Strict-Transport-Security']).toBe(
      'max-age=31536000; includeSubDomains',
    );
  });

  test('a resposta sai carimbada, sem perder o que ja tinha', () => {
    const original = new Response('oi', { headers: { 'Cache-Control': 'no-cache' } });
    const decorated = decorateWithSecurityHeaders(original);

    expect(decorated.headers.get('Cache-Control')).toBe('no-cache');
    expect(decorated.headers.get('X-Frame-Options')).toBe('DENY');
    expect(decorated.headers.get('Content-Security-Policy')).toBe(CONTENT_SECURITY_POLICY);
  });

  test('o corpo atravessa o carimbo', async () => {
    expect(await decorateWithSecurityHeaders(new Response('oi')).text()).toBe('oi');
  });
});

/**
 * O que mais importa da CSP e' `script-src`: e' ela que decide se um texto
 * injetado vira codigo. Medido no `dist` gerado: ZERO `<script>` embutido no
 * `index.html` — o registro do service worker virou arquivo proprio
 * (`registerSW.js`, `injectRegister: 'script-defer'`), entao `'self'` basta.
 */
describe('a CSP nao deixa texto injetado virar codigo', () => {
  test('script-src nao tem unsafe-inline nem unsafe-eval', () => {
    const scriptSrc = readPolicyDirective('script-src');

    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    expect(scriptSrc).toContain("'self'");
  });

  test('a entrada pelo Google e pela Apple continua possivel', () => {
    expect(readPolicyDirective('script-src')).toContain('https://accounts.google.com');
    expect(readPolicyDirective('script-src')).toContain('https://appleid.cdn-apple.com');
    expect(readPolicyDirective('frame-src')).toContain('https://accounts.google.com');
    expect(readPolicyDirective('connect-src')).toContain('https://accounts.google.com');
  });

  test('nada mais e permitido por padrao', () => {
    expect(readPolicyDirective('default-src')).toBe("default-src 'self'");
    expect(readPolicyDirective('object-src')).toBe("object-src 'none'");
    expect(readPolicyDirective('base-uri')).toBe("base-uri 'none'");
    expect(readPolicyDirective('frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(readPolicyDirective('form-action')).toBe("form-action 'self'");
  });

  /**
   * A API mora na MESMA origem (a imagem repassa `/v1`), entao `connect-src`
   * nao precisa listar endereco de API nenhum — e o provedor de IA e' chamado
   * pelo servidor, nunca pelo navegador.
   */
  test('connect-src nao abre endereco de API nem de IA', () => {
    const connectSrc = readPolicyDirective('connect-src');

    expect(connectSrc).toContain("'self'");
    expect(connectSrc).not.toContain('api.');
    expect(connectSrc).not.toContain('openai');
    expect(connectSrc).not.toContain('anthropic');
  });

  /**
   * `style-src` fica com `'unsafe-inline'`, e isso e' DIVIDA declarada, nao
   * descuido. Medido: 35 usos de `<motion.` em 12 arquivos, e o framer-motion
   * anima escrevendo no ATRIBUTO `style` a cada quadro; o Radix posiciona
   * popover do mesmo jeito, e o `offline.html` tem um `<style>` embutido.
   * `style-src-attr` sem `'unsafe-inline'` mataria os tres. Tirar isso e'
   * trocar de biblioteca de animacao — decisao de produto, nao de cabecalho.
   *
   * O risco que sobra e' baixo perto do de script: estilo injetado desfigura a
   * pagina, nao executa codigo. O teste existe para que a divida seja VISTA
   * quando alguem mexer aqui, nunca para autorizar o mesmo em `script-src`.
   */
  test('a divida do style-src esta escrita, e nao contamina script-src', () => {
    expect(readPolicyDirective('style-src')).toContain("'unsafe-inline'");
    expect(CONTENT_SECURITY_POLICY.match(/'unsafe-inline'/g)).toHaveLength(1);
  });
});
