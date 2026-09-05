/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type {
  AuthenticatedUser,
  AuthenticatedUserResolver,
} from '../shared/auth/authenticated-user.interface';
import { ACCESS_COOKIE_NAME } from './auth.constant';
import { readCookie } from './cookie.util';
import type { TokenService } from './types/auth.types';

/**
 * O COOKIE e a unica origem da sessao. Aceitar tambem `Authorization: Bearer`
 * daria ao frontend um caminho para guardar o token em `localStorage`, que e
 * exatamente o que a decisao de cookie veio impedir.
 */
export function createCookieSessionResolver(tokenService: TokenService): AuthenticatedUserResolver {
  return {
    async resolve(request: Request): Promise<AuthenticatedUser | undefined> {
      const accessToken = readCookie(request, ACCESS_COOKIE_NAME);
      if (accessToken === undefined) return undefined;
      return await tokenService.verifyAccessToken(accessToken);
    },
  };
}
