/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/** Um ano, com subdominio (security.md §3). Sem `preload`: nao ha volta rapida. */
const HSTS = 'max-age=31536000; includeSubDomains';

const GOOGLE_SIGN_IN = 'https://accounts.google.com';
const APPLE_SIGN_IN_SCRIPT = 'https://appleid.cdn-apple.com';
const APPLE_SIGN_IN_FRAME = 'https://appleid.apple.com';

/**
 * `default-src 'self'` fecha por padrao, e cada abertura abaixo tem motivo
 * medido no `dist` gerado — nao ha entrada de catalogo aqui.
 *
 * - `script-src` SEM `'unsafe-inline'`: o `index.html` construido nao tem um
 *   `<script>` embutido sequer (o registro do service worker virou arquivo
 *   proprio). E' esta linha que faz a CSP valer alguma coisa.
 * - `style-src` COM `'unsafe-inline'`: divida declarada — o framer-motion anima
 *   escrevendo no atributo `style`, e `style-src-attr` bloquearia isso. Estilo
 *   injetado desfigura; nao executa.
 * - `connect-src 'self'`: a API mora na mesma origem (a imagem repassa `/v1`),
 *   e a IA e' chamada pelo servidor.
 * - `img-src data:`: o Vite embute asset pequeno como URI de dados.
 */
const POLICY_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' ${GOOGLE_SIGN_IN} ${APPLE_SIGN_IN_SCRIPT}`,
  `style-src 'self' 'unsafe-inline' ${GOOGLE_SIGN_IN}`,
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self' ${GOOGLE_SIGN_IN}`,
  `frame-src ${GOOGLE_SIGN_IN} ${APPLE_SIGN_IN_FRAME}`,
  "manifest-src 'self'",
  "worker-src 'self'",
  'upgrade-insecure-requests',
];

export const CONTENT_SECURITY_POLICY = POLICY_DIRECTIVES.join('; ');

export const WEB_SECURITY_HEADERS = Object.freeze({
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'Strict-Transport-Security': HSTS,
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
});

/** Le uma diretiva pelo nome — o teste afirma a diretiva, nao a linha inteira. */
export function readPolicyDirective(name) {
  return POLICY_DIRECTIVES.find(directive => directive.split(' ')[0] === name);
}

/**
 * Carimba o que a propria web produziu. Resposta REPASSADA da API nao passa por
 * aqui: ela ja traz os cabecalhos dela, e uma CSP de documento em cima de JSON
 * so confundiria quem for depurar.
 */
export function decorateWithSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(WEB_SECURITY_HEADERS)) headers.set(name, value);

  return new Response(response.body, { status: response.status, headers });
}
