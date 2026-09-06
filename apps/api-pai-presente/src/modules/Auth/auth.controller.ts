/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import { HTTP_METHODS, HTTP_STATUS } from '../shared/http/http.constant';
import type { RateLimiter } from '../shared/http/rate-limit';
import { parseJsonBody } from '../shared/http/request.util';
import { respondWithData, withCookies } from '../shared/http/response.util';
import type { PublicRouteDefinition } from '../shared/http/route.types';
import {
  PASSWORD_AUTH_PROVIDER,
  REGISTRATIONS_PATH,
  ACCESS_COOKIE_NAME,
  ACCESS_COOKIE_PATH,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_TTL_SECONDS,
  SESSIONS_PATH,
} from './auth.constant';
import { RefreshTokenInvalidError } from './auth.error';
import { registerWithPasswordSchema, signInSchema } from './auth.schema';
import { buildClearedCookie, buildSessionCookie, readCookie } from './cookie.util';
import type { AuthUseCases, IssuedSession } from './types/auth.types';

export type BuildAuthRoutesParams = {
  readonly useCases: AuthUseCases;
  readonly isSecureCookie: boolean;
  readonly signInRateLimiter: RateLimiter;
};

export function buildAuthRoutes({
  useCases,
  isSecureCookie,
  signInRateLimiter,
}: BuildAuthRoutesParams): readonly PublicRouteDefinition[] {
  // O corpo devolve APENAS a identidade. Os dois tokens saem em `Set-Cookie`
  // `HttpOnly`, entao nem o JavaScript da pagina nem o histórico os alcancam —
  // e e isso que o teste de aceite do TB.6 cobra.
  function respondWithSession(session: IssuedSession, status: number): Response {
    const body = respondWithData({ user: { id: session.user.userId, email: session.user.email } }, status);
    return withCookies(body, [
      buildSessionCookie({
        name: ACCESS_COOKIE_NAME,
        value: session.accessToken,
        path: ACCESS_COOKIE_PATH,
        maxAgeSeconds: ACCESS_TOKEN_TTL_SECONDS,
        isSecure: isSecureCookie,
      }),
      buildSessionCookie({
        name: REFRESH_COOKIE_NAME,
        value: session.refreshTokenValue,
        path: REFRESH_COOKIE_PATH,
        maxAgeSeconds: REFRESH_TOKEN_TTL_SECONDS,
        isSecure: isSecureCookie,
      }),
    ]);
  }

  function readRefreshToken(request: Request): string {
    const value = readCookie(request, REFRESH_COOKIE_NAME);
    if (value === undefined) throw new RefreshTokenInvalidError();
    return value;
  }

  return [
    {
      method: HTTP_METHODS.POST,
      path: SESSIONS_PATH,
      summary: 'Abre a sessao a partir do id_token do provedor.',
      handle: async ({ request }) => {
        const body = await parseJsonBody(request, signInSchema);
        // O limite e por CONTA, e nao por IP: quem tenta adivinhar escolhe o
        // alvo, e contar por IP faria o predio inteiro pagar pelo vizinho.
        if (body.provider === PASSWORD_AUTH_PROVIDER) signInRateLimiter.consume(body.email);
        const session = await useCases.signIn(body);
        return respondWithSession(session, HTTP_STATUS.CREATED);
      },
    },
    {
      // Recurso proprio: `POST /sessions` abre sessao de quem ja existe, e
      // cadastrar CRIA a pessoa. Mesma rota para as duas coisas deixaria
      // "e-mail ja cadastrado" e "senha errada" na mesma resposta.
      method: HTTP_METHODS.POST,
      path: REGISTRATIONS_PATH,
      summary: 'Cria a conta por e-mail e senha, e ja abre a sessao.',
      handle: async ({ request }) => {
        const { email, password, fullName } = await parseJsonBody(request, registerWithPasswordSchema);
        signInRateLimiter.consume(email);
        const session = await useCases.registerWithPassword({ email, password, fullName });
        return respondWithSession(session, HTTP_STATUS.CREATED);
      },
    },
    {
      // PUT no MESMO recurso, e nao um `/refresh`: a rota substitui a sessao
      // que ja existe (apis.md — recurso e substantivo, o verbo e o metodo).
      method: HTTP_METHODS.PUT,
      path: SESSIONS_PATH,
      summary: 'Rotaciona a sessao usando o cookie de refresh.',
      handle: async ({ request }) => {
        const session = await useCases.refreshSession(readRefreshToken(request));
        return respondWithSession(session, HTTP_STATUS.OK);
      },
    },
    {
      method: HTTP_METHODS.DELETE,
      path: SESSIONS_PATH,
      summary: 'Encerra a sessao e apaga os cookies.',
      handle: async ({ request }) => {
        const refreshTokenValue = readCookie(request, REFRESH_COOKIE_NAME);
        if (refreshTokenValue !== undefined) await useCases.signOut(refreshTokenValue);
        // Sair e idempotente: sem cookie nao ha o que revogar, e ainda assim a
        // resposta apaga os dois. Recusar aqui prenderia o navegador na sessao.
        return withCookies(new Response(null, { status: HTTP_STATUS.NO_CONTENT }), [
          buildClearedCookie({
            name: ACCESS_COOKIE_NAME,
            path: ACCESS_COOKIE_PATH,
            isSecure: isSecureCookie,
          }),
          buildClearedCookie({
            name: REFRESH_COOKIE_NAME,
            path: REFRESH_COOKIE_PATH,
            isSecure: isSecureCookie,
          }),
        ]);
      },
    },
  ];
}
