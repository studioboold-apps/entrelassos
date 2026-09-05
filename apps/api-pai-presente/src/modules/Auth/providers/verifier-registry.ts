/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import {
  DEVELOPMENT_AUTH_PROVIDER,
  OIDC_AUTH_PROVIDERS,
  OIDC_PROVIDER_CONFIG,
  type AuthProvider,
  type OidcAuthProvider,
} from '../auth.constant';
import type { IdentityVerifier, IdentityVerifierRegistry } from '../types/auth.types';
import { createDevelopmentVerifier } from './development.verifier';
import { createOidcVerifier } from './oidc.verifier';

export type ProviderClientIds = Readonly<Partial<Record<OidcAuthProvider, string>>>;

export type DevelopmentSignInSettings = {
  readonly isEnabled: boolean;
  readonly isProduction: boolean;
};

export type CreateIdentityVerifierRegistryParams = {
  readonly clientIds: ProviderClientIds;
  readonly developmentSignIn: DevelopmentSignInSettings;
};

/**
 * Fail-closed (security.md §2): sem NENHUM provedor configurado a API nao sobe.
 *
 * O login de desenvolvimento e a resposta ao outro lado disso — sem ele, so subia
 * a API quem tivesse conta no Google Cloud, e ninguem conseguia rodar o produto.
 * Ele exige variavel explicita (nunca nasce de env incompleto) e DERRUBA O BOOT
 * em producao: recusar o login la seria tarde, porque a porta ja teria subido.
 */
export function createIdentityVerifierRegistry({
  clientIds,
  developmentSignIn,
}: CreateIdentityVerifierRegistryParams): IdentityVerifierRegistry {
  if (developmentSignIn.isEnabled && developmentSignIn.isProduction) {
    throw new Error(
      'login de desenvolvimento ligado em producao: remova AUTH_DEV_SIGN_IN do ambiente',
    );
  }

  const verifiers = new Map<AuthProvider, IdentityVerifier>();

  for (const provider of OIDC_AUTH_PROVIDERS) {
    const clientId = clientIds[provider];
    if (clientId === undefined || clientId.length === 0) continue;
    const config = OIDC_PROVIDER_CONFIG[provider];
    verifiers.set(provider, createOidcVerifier({ ...config, clientId }));
  }

  if (developmentSignIn.isEnabled) {
    verifiers.set(DEVELOPMENT_AUTH_PROVIDER, createDevelopmentVerifier());
  }

  if (verifiers.size === 0) {
    throw new Error(
      'nenhum provedor de login configurado: defina GOOGLE_CLIENT_ID, APPLE_CLIENT_ID ou AUTH_DEV_SIGN_IN=1 fora de producao',
    );
  }

  return {
    forProvider(provider: AuthProvider): IdentityVerifier | undefined {
      return verifiers.get(provider);
    },
  };
}
