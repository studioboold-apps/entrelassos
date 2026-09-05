/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { Database } from '../../database/client';
import type { AuthenticatedUserResolver } from '../shared/auth/authenticated-user.interface';
import type { PublicRouteDefinition } from '../shared/http/route.types';
import { buildAuthRoutes } from './auth.controller';
import { createAuthAccountRepository, createSessionRepository } from './auth.repository';
import { createAuthUseCases } from './auth.use-case';
import {
  createIdentityVerifierRegistry,
  type DevelopmentSignInSettings,
  type ProviderClientIds,
} from './providers/verifier-registry';
import { createCookieSessionResolver } from './session.resolver';
import { createTokenService } from './token.service';

export type BuildAuthModuleParams = {
  readonly database: Database;
  readonly jwtSecret: string;
  readonly clientIds: ProviderClientIds;
  readonly developmentSignIn: DevelopmentSignInSettings;
  readonly isSecureCookie: boolean;
};

export type AuthModule = {
  readonly publicRoutes: readonly PublicRouteDefinition[];
  readonly authenticatedUserResolver: AuthenticatedUserResolver;
};

export function buildAuthModule({
  database,
  jwtSecret,
  clientIds,
  developmentSignIn,
  isSecureCookie,
}: BuildAuthModuleParams): AuthModule {
  const tokenService = createTokenService(jwtSecret);
  const useCases = createAuthUseCases({
    verifiers: createIdentityVerifierRegistry({ clientIds, developmentSignIn }),
    accounts: createAuthAccountRepository(database),
    sessions: createSessionRepository(database),
    tokenService,
  });

  return {
    publicRoutes: buildAuthRoutes({ useCases, isSecureCookie }),
    authenticatedUserResolver: createCookieSessionResolver(tokenService),
  };
}
