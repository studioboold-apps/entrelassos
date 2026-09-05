/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { ForbiddenOriginError } from '../errors/shared.error';
import { handleUncaughtError } from './exception-filter';
import {
  CORS_ALLOWED_HEADERS,
  CORS_ALLOWED_METHODS,
  CORS_MAX_AGE_SECONDS,
  HTTP_METHODS,
  HTTP_STATUS,
  ORIGIN_HEADER,
  SECURITY_HEADERS,
} from './http.constant';

export type CorsPolicy = {
  /** Devolve resposta pronta quando a requisicao termina aqui (pre-flight ou recusa). */
  intercept(request: Request): Response | undefined;
  decorate(request: Request, response: Response): Response;
};

/**
 * A sessao viaja em cookie, entao o navegador manda credencial: `*` e proibido
 * pelo proprio protocolo aqui, e a allowlist tem de ecoar a origem exata.
 */
export function createCorsPolicy(allowedOrigins: readonly string[]): CorsPolicy {
  const allowed = new Set(allowedOrigins);

  function readAllowedOrigin(request: Request): string | undefined {
    const origin = request.headers.get(ORIGIN_HEADER);
    // Sem `Origin` nao ha navegador de outro site: e chamada de mesma origem
    // ou de servidor, e nenhum cabecalho de CORS faz sentido na resposta.
    if (origin === null) return undefined;
    if (!allowed.has(origin)) throw new ForbiddenOriginError();
    return origin;
  }

  function buildCorsHeaders(origin: string): Record<string, string> {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      Vary: ORIGIN_HEADER,
    };
  }

  return {
    intercept(request: Request): Response | undefined {
      const url = new URL(request.url);
      try {
        const origin = readAllowedOrigin(request);
        if (request.method !== HTTP_METHODS.OPTIONS) return undefined;
        if (origin === undefined) return new Response(null, { status: HTTP_STATUS.NO_CONTENT });
        return new Response(null, {
          status: HTTP_STATUS.NO_CONTENT,
          headers: {
            ...SECURITY_HEADERS,
            ...buildCorsHeaders(origin),
            'Access-Control-Allow-Methods': CORS_ALLOWED_METHODS,
            'Access-Control-Allow-Headers': CORS_ALLOWED_HEADERS,
            'Access-Control-Max-Age': CORS_MAX_AGE_SECONDS,
          },
        });
      } catch (error) {
        return handleUncaughtError({ error, method: request.method, path: url.pathname });
      }
    },

    decorate(request: Request, response: Response): Response {
      const origin = request.headers.get(ORIGIN_HEADER);
      if (origin === null || !allowed.has(origin)) return response;
      const headers = new Headers(response.headers);
      for (const [name, value] of Object.entries(buildCorsHeaders(origin))) {
        headers.set(name, value);
      }
      return new Response(response.body, { status: response.status, headers });
    },
  };
}
